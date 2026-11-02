// ---------------------------------------------------------------
// stats.controller.js
// Statistiques des sondages (RH seulement), calculées par le backend.
//
// Règles de confidentialité :
//  - résultats seulement pour un sondage CLÔTURÉ (pas de comparaison avant / après une réponse)
//  - aucun résultat sous le seuil de réponses de l'organisation (5 par défaut)
//  - résultats par service seulement pour les services qui atteignent le seuil,
//    avec masquage complémentaire (voir applyGroupThreshold)
//  - jamais de réponse individuelle ni de texte de commentaire
//    (les commentaires passent uniquement par l'analyse IA, désidentifiés)
//
// Routes (requireAuth + requireRole('HR_ADMIN')) :
//  GET /api/stats/overview        → getStatsOverview  (score de chaque sondage, pour la courbe)
//  GET /api/stats/surveys/:id     → getSurveyStats    (résultats par question)
// ---------------------------------------------------------------

import mongoose from 'mongoose';
import Survey from '../models/surveys.models.js';
import Response from '../models/responses.models.js';
import Organization from '../models/organizations.models.js';
import { HttpError } from '../utils/Httperror.js';
import { applyGroupThreshold, choiceResult, ratingResult, wellbeingScore } from '../utils/stats.js';

const NO_DEPARTMENT = 'Sans service';

// ---------- Helpers ----------

const getThreshold = async (organizationId) => {
  const org = await Organization.findById(organizationId).select('minResponseThreshold').lean();
  return org?.minResponseThreshold ?? 5;
};

// Échelle de chaque question notée : Map questionId → { min, max }
const ratingScales = (questions) =>
  new Map(
    questions
      .filter((q) => q.type === 'RATING')
      .map((q) => [String(q._id), { min: q.scaleMin ?? 1, max: q.scaleMax ?? 5 }])
  );

// ---------- Contrôleurs ----------

// GET /api/stats/surveys/:id
// Résultats par question + score global + score par service
export const getSurveyStats = async (req, res) => {
  const { organizationId } = req.user;
  if (!mongoose.isValidObjectId(req.params.id)) throw new HttpError(400, 'Sondage invalide');

  const survey = await Survey.findOne({ _id: req.params.id, organizationId });
  if (!survey) throw new HttpError(404, 'Sondage introuvable');
  // Résultats seulement après clôture : sinon, en comparant les chiffres avant et après
  // une nouvelle réponse, on retrouverait ce qu'une personne a répondu.
  if (survey.status !== 'CLOSED') {
    throw new HttpError(409, 'Les statistiques sont disponibles uniquement pour les sondages clôturés');
  }

  const [threshold, responseCount] = await Promise.all([
    getThreshold(organizationId),
    Response.countForSurvey(survey._id),
  ]);

  // Seuil de confidentialité (même code 422 que l'analyse IA)
  if (responseCount < threshold) {
    throw new HttpError(422, `Nombre de réponses insuffisant. Minimum requis : ${threshold}`, {
      responseCount,
      threshold,
    });
  }

  const surveyObjectId = new mongoose.Types.ObjectId(String(survey._id));

  const [answerRows, departmentRows, departmentCounts] = await Promise.all([
    // Une ligne par (question, note) ou (question, option) : uniquement des comptes
    Response.aggregate([
      { $match: { surveyId: surveyObjectId } },
      { $unwind: '$answers' },
      {
        $group: {
          _id: {
            questionId: '$answers.questionId',
            type: '$answers.questionType',
            value: '$answers.ratingValue',
            optionId: '$answers.optionId',
          },
          count: { $sum: 1 },
        },
      },
    ]),
    // Notes par service, pour le score de chaque service
    Response.aggregate([
      { $match: { surveyId: surveyObjectId } },
      { $unwind: '$answers' },
      { $match: { 'answers.questionType': 'RATING' } },
      {
        $group: {
          _id: { department: '$department', questionId: '$answers.questionId', value: '$answers.ratingValue' },
          count: { $sum: 1 },
        },
      },
    ]),
    // Nombre de réponses par service (pour le seuil)
    Response.aggregate([{ $match: { surveyId: surveyObjectId } }, { $group: { _id: '$department', count: { $sum: 1 } } }]),
  ]);

  const rowsFor = (questionId) => answerRows.filter((r) => String(r._id.questionId) === String(questionId));
  const scales = ratingScales(survey.questions);

  // ---- Résultats par question ----
  const questions = survey.getSortedQuestions().map((q) => {
    const rows = rowsFor(q._id);
    const base = { questionId: q._id, label: q.label, type: q.type, isRequired: q.isRequired };

    if (q.type === 'RATING') {
      return {
        ...base,
        scaleMin: q.scaleMin,
        scaleMax: q.scaleMax,
        minLabel: q.minLabel,
        maxLabel: q.maxLabel,
        ...ratingResult(q, rows.map((r) => ({ value: r._id.value, count: r.count }))),
      };
    }
    if (q.type === 'CHOICE') {
      return { ...base, ...choiceResult(q, rows.map((r) => ({ optionId: r._id.optionId, count: r.count }))) };
    }
    // TEXT : seulement le nombre de commentaires, jamais leur contenu
    return { ...base, answered: rows.reduce((s, r) => s + r.count, 0) };
  });

  // ---- Score global ----
  const ratingRows = answerRows
    .filter((r) => r._id.type === 'RATING')
    .map((r) => ({ questionId: r._id.questionId, value: r._id.value, count: r.count }));
  const score = wellbeingScore(ratingRows, scales);

  // ---- Score par service (seuil + masquage complémentaire) ----
  const groups = departmentCounts.map((d) => {
    const key = d._id ?? null;
    const rows = departmentRows
      .filter((r) => (r._id.department ?? null) === key)
      .map((r) => ({ questionId: r._id.questionId, value: r._id.value, count: r.count }));
    return { department: key ?? NO_DEPARTMENT, responseCount: d.count, score: wellbeingScore(rows, scales) };
  });
  const { visible, hiddenCount } = applyGroupThreshold(groups, threshold);

  res.json({
    surveyId: survey._id,
    title: survey.title,
    responseCount,
    threshold,
    score, // sur 100, null si le sondage n'a aucune question notée
    questions,
    byDepartment: visible,
    hiddenDepartments: hiddenCount,
  });
};

// GET /api/stats/overview
// Score de bien-être de chaque sondage publié ou clôturé (du plus ancien au plus récent).
// Un sondage encore ouvert apparaît avec score: null (pas encore de résultats).
export const getStatsOverview = async (req, res) => {
  const { organizationId } = req.user;

  const [threshold, surveys] = await Promise.all([
    getThreshold(organizationId),
    Survey.find({ organizationId, status: { $in: ['PUBLISHED', 'CLOSED'] } })
      .select('title status startDate endDate questions')
      .sort({ startDate: 1 })
      .lean(),
  ]);

  const recent = surveys.slice(-12); // 12 derniers sondages au maximum
  const ids = recent.map((s) => s._id);

  const [counts, ratingRows] = await Promise.all([
    Response.aggregate([{ $match: { surveyId: { $in: ids } } }, { $group: { _id: '$surveyId', count: { $sum: 1 } } }]),
    Response.aggregate([
      { $match: { surveyId: { $in: ids } } },
      { $unwind: '$answers' },
      { $match: { 'answers.questionType': 'RATING' } },
      {
        $group: {
          _id: { surveyId: '$surveyId', questionId: '$answers.questionId', value: '$answers.ratingValue' },
          count: { $sum: 1 },
        },
      },
    ]),
  ]);
  const countBySurvey = new Map(counts.map((c) => [String(c._id), c.count]));

  res.json({
    threshold,
    surveys: recent.map((s) => {
      const responseCount = countBySurvey.get(String(s._id)) || 0;
      // Score seulement pour un sondage clôturé ET au-dessus du seuil
      const enough = s.status === 'CLOSED' && responseCount >= threshold;
      const rows = ratingRows
        .filter((r) => String(r._id.surveyId) === String(s._id))
        .map((r) => ({ questionId: r._id.questionId, value: r._id.value, count: r.count }));
      return {
        surveyId: s._id,
        title: s.title,
        status: s.status,
        startDate: s.startDate,
        endDate: s.endDate,
        responseCount,
        score: enough ? wellbeingScore(rows, ratingScales(s.questions)) : null,
        masked: !enough,
      };
    }),
  });
};