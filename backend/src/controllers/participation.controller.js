// ---------------------------------------------------------------
// participation.controller.js
// Suivi de la participation aux sondages.
//
// Utilise UNIQUEMENT le modèle Participation (qui a répondu),
// jamais Response (ce qui a été répondu).
//
// Côté RH : des chiffres agrégés seulement (nombre, taux).
// Pas de liste nominative des participants : pour un sondage anonyme,
// savoir exactement qui a répondu, combiné à un petit nombre de
// réponses, pourrait permettre de deviner qui a écrit quoi.
//
// Routes :
//  RH (requireRole('HR_ADMIN'))
//   GET /api/participation/overview          → getParticipationOverview
//   GET /api/participation/surveys/:id       → getSurveyParticipation
//  EMPLOYÉ (requireRole('EMPLOYEE'))
//   GET /api/employee/participations         → getMyParticipations
// ---------------------------------------------------------------

import Survey from '../models/surveys.models.js';
import Participation from '../models/participations.models.js';
import User from '../models/User.models.js';
import { HttpError } from '../utils/Httperror.js';

// ---------- Helpers ----------

// Employés actifs pouvant répondre
const countEligible = (organizationId) =>
  User.countDocuments({ organizationId, role: 'EMPLOYEE', isActive: true });

// Taux en %, arrondi à 1 décimale (ex : 72.5)
const toRate = (participants, eligible) =>
  eligible ? Math.round((participants / eligible) * 1000) / 10 : 0;

// Nombre de participants pour une liste de sondages, en une requête
const countBySurvey = async (surveyIds) => {
  const rows = await Participation.aggregate([
    { $match: { surveyId: { $in: surveyIds } } },
    { $group: { _id: '$surveyId', count: { $sum: 1 } } },
  ]);
  return new Map(rows.map((r) => [r._id.toString(), r.count]));
};

// ---------- RH ----------

// GET /api/participation/surveys/:id
// Participation d'un sondage : nombre de participants, éligibles, taux
export const getSurveyParticipation = async (req, res) => {
  const survey = await Survey.findOne({
    _id: req.params.id,
    organizationId: req.user.organizationId,
  }).select('title status isAnonymous startDate endDate');
  if (!survey) throw new HttpError(404, 'Sondage introuvable');

  const [participants, eligible] = await Promise.all([
    Participation.countForSurvey(survey._id),
    countEligible(req.user.organizationId),
  ]);

  res.json({
    surveyId: survey._id,
    title: survey.title,
    status: survey.status,
    isAnonymous: survey.isAnonymous,
    startDate: survey.startDate,
    endDate: survey.endDate,
    participants,
    eligible,
    nonParticipants: Math.max(0, eligible - participants),
    participationRate: toRate(participants, eligible),
  });
};

// GET /api/participation/overview
// Vue d'ensemble pour le tableau de bord RH
export const getParticipationOverview = async (req, res) => {
  const organizationId = req.user.organizationId;

  const [surveys, eligible] = await Promise.all([
    Survey.find({ organizationId, status: { $in: ['PUBLISHED', 'CLOSED'] } })
      .select('title status startDate endDate')
      .sort({ startDate: -1 })
      .lean(),
    countEligible(organizationId),
  ]);

  const counts = await countBySurvey(surveys.map((s) => s._id));

  const perSurvey = surveys.map((s) => {
    const participants = counts.get(s._id.toString()) || 0;
    return {
      surveyId: s._id,
      title: s.title,
      status: s.status,
      startDate: s.startDate,
      endDate: s.endDate,
      participants,
      participationRate: toRate(participants, eligible),
    };
  });

  // Taux moyen calculé sur les sondages clôturés seulement (résultats définitifs)
  const closed = perSurvey.filter((s) => s.status === 'CLOSED');
  const averageRate = closed.length
    ? Math.round((closed.reduce((sum, s) => sum + s.participationRate, 0) / closed.length) * 10) / 10
    : null;

  res.json({
    eligibleEmployees: eligible,
    publishedCount: perSurvey.filter((s) => s.status === 'PUBLISHED').length,
    closedCount: closed.length,
    totalParticipations: perSurvey.reduce((sum, s) => sum + s.participants, 0),
    averageParticipationRate: averageRate, // null si aucun sondage clôturé
    surveys: perSurvey,
  });
};

// ---------- EMPLOYÉ ----------

// GET /api/employee/participations
// Historique de l'employé : les sondages auxquels il a répondu.
// Seulement le titre et la date, jamais le contenu de ses réponses
// (pour un sondage anonyme, il n'existe aucun lien vers elles).
export const getMyParticipations = async (req, res) => {
  const participations = await Participation.find({ userId: req.user.userId })
    .sort({ submittedOn: -1 })
    .populate({ path: 'surveyId', select: 'title isAnonymous status' })
    .lean();

  res.json(
    participations
      .filter((p) => p.surveyId) // sondage supprimé : ignoré
      .map((p) => ({
        surveyId: p.surveyId._id,
        title: p.surveyId.title,
        isAnonymous: p.surveyId.isAnonymous,
        surveyStatus: p.surveyId.status,
        submittedOn: p.submittedOn,
      }))
  );
};