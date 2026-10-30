// ---------------------------------------------------------------
// employeeSurveys.controller.js
// Les employés consultent les sondages et y répondent.
//
// Modèles utilisés :
//  - Survey        : le sondage et ses questions (lecture seule ici)
//  - Participation : QUI a répondu (taux de participation, anti-doublon)
//  - Response      : CE QUI a été répondu (userId = null si anonyme)
// Les deux sont enregistrés dans la même transaction, sans aucun lien
// entre eux, pour garantir l'anonymat.
//
// Routes (protégées par requireAuth + requireRole('EMPLOYEE')) :
//  GET  /api/employee/surveys             → listMySurveys
//  GET  /api/employee/surveys/:id         → getSurveyForEmployee
//  POST /api/employee/surveys/:id/submit  → submitSurvey
// ---------------------------------------------------------------

import mongoose from 'mongoose';
import Survey from '../models/surveys.models.js';
import Participation from '../models/participations.models.js';
import Response from '../models/responses.models.js';
import User from '../models/User.models.js';
import { HttpError } from '../utils/Httperror.js';
import { runValidation } from '../utils/validation.js';
import { redact } from '../utils/Redact.js';
import { anonymousObjectId } from '../utils/Anonymousid.js';

const MAX_TEXT_LENGTH = 3000;

// Ce que l'employé voit d'une question (pas de champs internes)
const publicQuestion = (q) => ({
  _id: q._id,
  label: q.label,
  type: q.type,
  isRequired: q.isRequired,
  ...(q.type === 'RATING' && {
    scaleMin: q.scaleMin,
    scaleMax: q.scaleMax,
    minLabel: q.minLabel,
    maxLabel: q.maxLabel,
  }),
  ...(q.type === 'CHOICE' && {
    options: [...q.options].sort((a, b) => a.position - b.position).map((o) => ({ _id: o._id, label: o.label })),
  }),
});

// Prénoms et noms des membres de l'organisation, masqués dans les commentaires
const getOrgNames = async (organizationId) => {
  const users = await User.find({ organizationId }).select('firstName lastName').lean();
  return users.flatMap((u) => [u.firstName, u.lastName]);
};

// Vérifie chaque réponse par rapport aux questions du sondage.
// Les messages d'erreur ne contiennent jamais le texte saisi.
const buildAnswers = (survey, rawAnswers, names) => {
  if (!Array.isArray(rawAnswers)) throw new HttpError(400, 'answers doit être une liste');

  const byQuestion = new Map();
  for (const a of rawAnswers) {
    if (!a?.questionId) throw new HttpError(400, 'Chaque réponse doit avoir un questionId');
    const key = String(a.questionId);
    if (byQuestion.has(key)) throw new HttpError(400, 'Une question a reçu plusieurs réponses');
    byQuestion.set(key, a);
  }

  const questions = survey.getSortedQuestions();
  const knownIds = new Set(questions.map((q) => q._id.toString()));
  for (const key of byQuestion.keys()) {
    if (!knownIds.has(key)) throw new HttpError(400, 'Réponse à une question inconnue', { questionId: key });
  }

  const errors = [];
  const answers = [];

  for (const q of questions) {
    const a = byQuestion.get(q._id.toString());
    const fail = (message) => errors.push({ questionId: q._id, label: q.label, message });

    if (q.type === 'RATING') {
      const raw = a?.ratingValue;
      if (raw === undefined || raw === null || raw === '') {
        if (q.isRequired) fail('Réponse obligatoire');
        continue;
      }
      const value = Number(raw);
      if (!Number.isInteger(value) || value < q.scaleMin || value > q.scaleMax) {
        fail(`La note doit être un entier entre ${q.scaleMin} et ${q.scaleMax}`);
        continue;
      }
      answers.push({ questionId: q._id, questionType: 'RATING', ratingValue: value });
    }

    if (q.type === 'CHOICE') {
      const raw = a?.optionId;
      if (!raw) {
        if (q.isRequired) fail('Réponse obligatoire');
        continue;
      }
      const option = q.options.find((o) => o._id.toString() === String(raw));
      if (!option) {
        fail('Option invalide');
        continue;
      }
      answers.push({ questionId: q._id, questionType: 'CHOICE', optionId: option._id });
    }

    if (q.type === 'TEXT') {
      // Accepte { text } ou { textValue }
      const raw = a?.text ?? a?.textValue;
      const text = typeof raw === 'string' ? raw.trim() : '';
      if (!text) {
        if (q.isRequired) fail('Réponse obligatoire');
        continue;
      }
      if (text.length > MAX_TEXT_LENGTH) {
        fail(`${MAX_TEXT_LENGTH} caractères maximum`);
        continue;
      }
      answers.push({
        questionId: q._id,
        questionType: 'TEXT',
        textValue: text,
        textRedacted: redact(text, names),
      });
    }
  }

  if (errors.length) throw new HttpError(400, 'Certaines réponses sont invalides', { errors });
  if (!answers.length) throw new HttpError(400, 'Le sondage envoyé est vide');
  return answers;
};

// ---------- Contrôleurs (EMPLOYÉ) ----------

// GET /api/employee/surveys
// Sondages publiés et ouverts, avec l'indication "déjà répondu"
export const listMySurveys = async (req, res) => {
  const now = new Date();
  const surveys = await Survey.find({
    organizationId: req.user.organizationId,
    status: 'PUBLISHED',
    startDate: { $lte: now },
    endDate: { $gte: now },
  })
    .select('title description isAnonymous startDate endDate topic questions')
    .sort({ endDate: 1 })
    .lean();

  const answered = new Set(await Participation.surveyIdsForUser(req.user.userId));

  res.json(
    surveys.map((s) => ({
      _id: s._id,
      title: s.title,
      description: s.description,
      topic: s.topic,
      isAnonymous: s.isAnonymous,
      startDate: s.startDate,
      endDate: s.endDate,
      questionCount: s.questions.length,
      alreadySubmitted: answered.has(s._id.toString()),
    }))
  );
};

// GET /api/employee/surveys/:id
// Le sondage à remplir. isAnonymous est affiché AVANT l'envoi.
export const getSurveyForEmployee = async (req, res) => {
  const survey = await Survey.findOne({
    _id: req.params.id,
    organizationId: req.user.organizationId,
    status: 'PUBLISHED',
  });
  if (!survey) throw new HttpError(404, 'Sondage introuvable');

  const alreadySubmitted = await Participation.hasParticipated(survey._id, req.user.userId);

  res.json({
    _id: survey._id,
    title: survey.title,
    description: survey.description,
    topic: survey.topic,
    isAnonymous: survey.isAnonymous,
    anonymityNotice: survey.isAnonymous
      ? "Ce sondage est anonyme : vos réponses ne seront pas reliées à votre compte."
      : 'Ce sondage est identifié : les RH pourront voir que ces réponses viennent de vous.',
    startDate: survey.startDate,
    endDate: survey.endDate,
    isOpen: survey.isOpen(),
    alreadySubmitted,
    questions: survey.getSortedQuestions().map(publicQuestion),
  });
};

// Prépare le document Response selon le mode du sondage.
// Le mode vient TOUJOURS du sondage en base, jamais du body de la requête.
const buildResponseData = ({ survey, userId, organizationId, department, answers, now }) => {
  const base = { organizationId, surveyId: survey._id, department, answers };

  if (survey.isAnonymous === true) {
    // ---------- Sondage ANONYME ----------
    // - pas de userId : la réponse n'est reliée à aucun employé
    // - _id sans heure exacte : impossible de la relier à la participation
    return {
      ...base,
      _id: anonymousObjectId(now),
      isAnonymous: true,
      userId: null,
    };
  }

  if (survey.isAnonymous === false) {
    // ---------- Sondage IDENTIFIÉ ----------
    // L'employé a été prévenu avant l'envoi que les RH verront ses réponses
    return {
      ...base,
      isAnonymous: false,
      userId,
    };
  }

  // Mode inconnu (donnée corrompue) : on refuse plutôt que de risquer
  // d'enregistrer une réponse identifiée par erreur
  throw new HttpError(500, "Le mode d'anonymat de ce sondage est invalide");
};

// POST /api/employee/surveys/:id/submit
// Body : { answers: [ { questionId, ratingValue } | { questionId, optionId } | { questionId, text } ] }
// Un userId ou isAnonymous envoyé dans le body est ignoré.
export const submitSurvey = async (req, res) => {
  const { userId, organizationId } = req.user;

  const survey = await Survey.findOne({ _id: req.params.id, organizationId });
  if (!survey || survey.status === 'DRAFT') throw new HttpError(404, 'Sondage introuvable');

  if (!survey.isOpen()) {
    const notStarted = survey.status === 'PUBLISHED' && survey.startDate && new Date() < survey.startDate;
    throw new HttpError(
      403,
      notStarted ? "Ce sondage n'est pas encore ouvert" : "Ce sondage n'accepte plus de réponses"
    );
  }

  // Vérification rapide ; l'index unique protège aussi contre deux envois simultanés
  if (await Participation.hasParticipated(survey._id, userId)) {
    throw new HttpError(409, 'Vous avez déjà répondu à ce sondage');
  }

  const names = await getOrgNames(organizationId);
  const answers = buildAnswers(survey, req.body?.answers, names);

  const user = await User.findById(userId).select('department').lean();
  const now = new Date();

  // Anonyme ou identifié : vérifié ici, avant toute écriture
  const responseData = buildResponseData({
    survey,
    userId,
    organizationId,
    department: user?.department || null,
    answers,
    now,
  });

  const session = await mongoose.startSession();
  let participation;

  try {
    // Participation et réponse enregistrées ensemble, ou aucune des deux
    await session.withTransaction(async () => {
      // La participation contient toujours le userId (taux, anti-doublon),
      // mais aucun lien vers la réponse
      participation = new Participation({ organizationId, surveyId: survey._id, userId });
      const response = new Response(responseData);

      await runValidation(participation);
      await runValidation(response); // le modèle revérifie : anonyme ⇒ userId null
      await participation.save({ session });
      await response.save({ session });
    });
  } finally {
    await session.endSession();
  }

  res.status(201).json({
    message: survey.isAnonymous
      ? 'Votre réponse anonyme a bien été enregistrée. Merci pour votre participation.'
      : 'Votre réponse a bien été enregistrée. Les RH pourront voir qu’elle vient de vous. Merci pour votre participation.',
    isAnonymous: survey.isAnonymous,
    submittedOn: participation.submittedOn,
  });
};