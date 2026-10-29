// ---------------------------------------------------------------
// aiAnalyses.controller.js
// Analyse IA des commentaires d'un sondage (RH seulement).
//
// Règles du cahier des charges appliquées ici :
//  - pas d'analyse sous le seuil de réponses de l'organisation (5 par défaut)
//  - seuls les commentaires DÉSIDENTIFIÉS sont envoyés à l'IA,
//    sans aucun identifiant d'employé ni de réponse
//  - les chiffres (réponses, commentaires, mentions par thème) sont
//    calculés par le backend, jamais repris de l'IA
//  - la sortie de l'IA est validée avant d'être enregistrée
//  - un échec de l'IA n'affecte pas le reste de l'application
//
// Routes (requireAuth + requireRole('HR_ADMIN')) :
//  POST  /api/analyses                                  → requestAnalysis
//  GET   /api/analyses?surveyId=...                     → listAnalyses
//  GET   /api/analyses/latest?surveyId=...              → getLatestAnalysis
//  GET   /api/analyses/:id                              → getAnalysis
//  PATCH /api/analyses/:id/recommendations/:recId       → reviewRecommendation
// ---------------------------------------------------------------

import Survey from '../models/surveys.models.js';
import Response from '../models/responses.models.js';
import Organization from '../models/organizations.models.js';
import AiAnalysis, { RECOMMENDATION_STATUSES } from '../models/aiAnalyses.models.js';
import { HttpError } from '../utils/Httperror.js';
import { requireFields } from '../utils/validation.js';
import { analyzeComments, AiServiceError } from '../utils/aiClient.js';
import { sanitizeAiOutput } from '../utils/aiOutput.js';

// Une analyse PENDING plus vieille que ça est considérée comme bloquée
const PENDING_TIMEOUT_MS = 5 * 60 * 1000;

// ---------- Helpers ----------

const findAnalysisInOrg = async (req) => {
  const analysis = await AiAnalysis.findOne({ _id: req.params.id, organizationId: req.user.organizationId });
  if (!analysis) throw new HttpError(404, 'Analyse introuvable');
  return analysis;
};

const getThreshold = async (organizationId) => {
  const org = await Organization.findById(organizationId).select('minResponseThreshold').lean();
  return org?.minResponseThreshold ?? 5;
};

// Format renvoyé au frontend : thèmes séparés pour le tableau de bord
const present = (analysis) => ({
  ...analysis.toJSON(),
  ...analysis.splitThemes(),
});

// ---------- Contrôleurs ----------

// POST /api/analyses   Body : { surveyId }
// Lance l'analyse et attend la réponse du service IA.
export const requestAnalysis = async (req, res) => {
  const { organizationId, userId } = req.user;
  requireFields(req.body, ['surveyId']);

  const survey = await Survey.findOne({ _id: req.body.surveyId, organizationId });
  if (!survey) throw new HttpError(404, 'Sondage introuvable');
  if (survey.status === 'DRAFT') throw new HttpError(409, 'Un brouillon ne peut pas être analysé');

  // Évite deux analyses en même temps sur le même sondage
  const running = await AiAnalysis.exists({
    surveyId: survey._id,
    status: 'PENDING',
    createdAt: { $gte: new Date(Date.now() - PENDING_TIMEOUT_MS) },
  });
  if (running) throw new HttpError(409, 'Une analyse est déjà en cours pour ce sondage');

  // 1. Seuil de confidentialité sur le nombre de réponses
  const threshold = await getThreshold(organizationId);
  const responseCount = await Response.countForSurvey(survey._id);
  if (responseCount < threshold) {
    throw new HttpError(
      422,
      `Pas assez de réponses pour une analyse (${responseCount}/${threshold}). ` +
        'Les résultats restent masqués pour protéger la confidentialité.',
      { responseCount, threshold }
    );
  }

  // 2. Commentaires désidentifiés, numérotés 0, 1, 2… (aucun id réel)
  const rows = await Response.getRedactedComments(survey._id);
  const comments = rows.map((r, i) => ({ id: i, text: r.text }));

  const analysis = new AiAnalysis({
    organizationId,
    surveyId: survey._id,
    requestedBy: userId,
    status: 'PENDING',
    responseCount,
    commentCount: comments.length,
  });

  // 3. Trop peu de commentaires : pas d'appel à l'IA, pas de conclusions
  if (comments.length < threshold) {
    analysis.set({
      status: 'DONE',
      insufficientData: true,
      summary: 'Trop peu de commentaires écrits pour identifier des thèmes de façon fiable.',
      limitations: [`${comments.length} commentaire(s) écrit(s) ; minimum requis : ${threshold}.`],
    });
    await analysis.save();
    return res.status(201).json(present(analysis));
  }

  await analysis.save(); // visible comme PENDING pendant l'appel

  // 4. Appel au service IA, puis validation de sa réponse
  try {
    const textQuestions = survey
      .getSortedQuestions()
      .filter((q) => q.type === 'TEXT')
      .map((q) => q.label);

    const raw = await analyzeComments({
      survey: { title: survey.title, topic: survey.topic || null, questions: textQuestions },
      comments,
    });

    const clean = sanitizeAiOutput(raw, comments);

    analysis.set({
      status: 'DONE',
      summary: clean.summary,
      insufficientData: clean.insufficientData,
      limitations: clean.limitations,
      aiModel: clean.model,
      themes: clean.themes,
    });
    await analysis.save();
    return res.status(201).json(present(analysis));
  } catch (err) {
    // L'échec est enregistré ; le reste de l'application continue de fonctionner.
    // On ne logge jamais le contenu des commentaires.
    if (!(err instanceof AiServiceError)) {
      console.error(`[analyse ${analysis._id}] ${err.name}: ${err.message}`);
    }
    analysis.status = 'FAILED';
    analysis.errorMessage = err instanceof AiServiceError ? err.message : "Erreur lors de l'analyse IA";
    await analysis.save();

    return res.status(502).json({
      error: `${analysis.errorMessage}. Les statistiques du sondage restent disponibles ; vous pouvez réessayer plus tard.`,
      analysis: present(analysis),
    });
  }
};

// GET /api/analyses?surveyId=...
// Historique des analyses (sans le détail des thèmes)
export const listAnalyses = async (req, res) => {
  const filter = { organizationId: req.user.organizationId };
  if (req.query.surveyId) filter.surveyId = req.query.surveyId;

  const analyses = await AiAnalysis.find(filter)
    .sort({ createdAt: -1 })
    .populate({ path: 'surveyId', select: 'title' })
    .lean();

  res.json(
    analyses.map((a) => ({
      _id: a._id,
      surveyId: a.surveyId?._id || a.surveyId,
      surveyTitle: a.surveyId?.title || null,
      status: a.status,
      insufficientData: a.insufficientData,
      responseCount: a.responseCount,
      commentCount: a.commentCount,
      themeCount: a.themes.length,
      concernCount: a.themes.filter((t) => t.sentiment === 'CONCERN').length,
      positiveCount: a.themes.filter((t) => t.sentiment === 'POSITIVE').length,
      errorMessage: a.errorMessage,
      createdAt: a.createdAt,
      completedAt: a.completedAt,
    }))
  );
};

// GET /api/analyses/latest?surveyId=...
// Dernière analyse terminée d'un sondage (pour le tableau de bord)
export const getLatestAnalysis = async (req, res) => {
  requireFields(req.query, ['surveyId']);

  const analysis = await AiAnalysis.findOne({
    organizationId: req.user.organizationId,
    surveyId: req.query.surveyId,
    status: 'DONE',
  }).sort({ createdAt: -1 });

  if (!analysis) throw new HttpError(404, 'Aucune analyse terminée pour ce sondage');
  res.json(present(analysis));
};

// GET /api/analyses/:id
export const getAnalysis = async (req, res) => {
  const analysis = await findAnalysisInOrg(req);
  res.json(present(analysis));
};

// PATCH /api/analyses/:id/recommendations/:recId
// Body : { status?: 'ACCEPTED' | 'REJECTED' | 'PROPOSED', content?: '...' }
// Le RH accepte, rejette ou reformule une recommandation.
export const reviewRecommendation = async (req, res) => {
  const analysis = await findAnalysisInOrg(req);
  if (analysis.status !== 'DONE') throw new HttpError(409, "Cette analyse n'est pas terminée");

  const found = analysis.findRecommendation(req.params.recId);
  if (!found) throw new HttpError(404, 'Recommandation introuvable');
  const { theme, recommendation } = found;

  const { status, content } = req.body;
  if (status === undefined && content === undefined) {
    throw new HttpError(400, 'Indiquez un statut ou un nouveau texte');
  }

  if (status !== undefined) {
    if (!RECOMMENDATION_STATUSES.includes(status)) {
      throw new HttpError(400, 'Statut invalide', { allowed: RECOMMENDATION_STATUSES });
    }
    // Une recommandation déjà transformée en action reste acceptée
    if (recommendation.actionId && status !== 'ACCEPTED') {
      throw new HttpError(409, 'Une action a déjà été créée à partir de cette recommandation');
    }
    recommendation.status = status;
  }

  if (content !== undefined) {
    const text = typeof content === 'string' ? content.trim() : '';
    if (!text) throw new HttpError(400, 'Le texte de la recommandation ne peut pas être vide');
    if (text !== recommendation.content) {
      recommendation.content = text;
      recommendation.editedByHr = true;
    }
  }

  recommendation.reviewedBy = req.user.userId;
  recommendation.reviewedAt = new Date();
  await analysis.save();

  res.json({ analysisId: analysis._id, themeId: theme._id, themeName: theme.name, recommendation });
};