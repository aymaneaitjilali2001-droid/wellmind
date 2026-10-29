// ---------------------------------------------------------------
// improvementActions.controller.js
// Plans d'amélioration : actions décidées par les RH, avec responsable,
// échéance, statut et notes de suivi.
//
// Une action peut être créée :
//  - à la main (aucun lien avec l'IA)
//  - à partir d'une recommandation de l'analyse IA
// Elle vise une pratique de l'organisation, jamais un employé.
//
// Routes RH (requireAuth + requireRole('HR_ADMIN')) :
//  GET   /api/actions/summary                 → getActionsSummary
//  POST  /api/actions                         → createAction
//  POST  /api/actions/from-recommendation     → createActionFromRecommendation
//  GET   /api/actions                         → listActions
//  GET   /api/actions/:id                     → getAction
//  PATCH /api/actions/:id                     → updateAction
//  PATCH /api/actions/:id/status              → changeActionStatus
//  POST  /api/actions/:id/updates             → addActionUpdate
// Route employé (requireRole('EMPLOYEE')) :
//  GET   /api/employee/actions                → listEmployeeActions
// ---------------------------------------------------------------

import mongoose from 'mongoose';
import ImprovementAction, { ACTION_STATUSES } from '../models/improvementActions.models.js';
import AiAnalysis from '../models/aiAnalyses.models.js';
import Survey from '../models/surveys.models.js';
import User from '../models/users.models.js';
import { HttpError } from '../utils/Httperror.js';
import { runValidation, pick, requireFields } from '../utils/validation.js';

const EDITABLE_FIELDS = ['title', 'objective', 'topic', 'visibleToEmployees'];
const ACTIVE_STATUSES = ['PLANNED', 'IN_PROGRESS'];
const MAX_NOTE_LENGTH = 2000;

const OWNER_FIELDS = 'firstName lastName email department';

// ---------- Helpers ----------

const day = (d) => (d ? new Date(d).toISOString().slice(0, 10) : '—');

const startOfToday = () => {
  const d = new Date();
  d.setUTCHours(0, 0, 0, 0);
  return d;
};

const isOverdue = (a) => ACTIVE_STATUSES.includes(a.status) && new Date(a.targetDate) < startOfToday();

// Date valide ; `future: true` refuse une échéance déjà passée
const parseTargetDate = (value, { future = false } = {}) => {
  const date = new Date(value);
  if (!value || Number.isNaN(date.getTime())) throw new HttpError(400, "Date d'échéance invalide");
  if (future && date < startOfToday()) throw new HttpError(400, "L'échéance ne peut pas être dans le passé");
  return date;
};

// Le responsable doit être un compte actif de la même organisation
const checkOwner = async (organizationId, ownerId) => {
  if (!mongoose.isValidObjectId(ownerId)) throw new HttpError(400, 'Responsable invalide');
  const exists = await User.exists({ _id: ownerId, organizationId, isActive: true });
  if (!exists) throw new HttpError(400, 'Responsable introuvable ou désactivé');
};

const checkSurvey = async (organizationId, surveyId) => {
  if (!surveyId) return null;
  if (!mongoose.isValidObjectId(surveyId)) throw new HttpError(400, 'Sondage invalide');
  const exists = await Survey.exists({ _id: surveyId, organizationId });
  if (!exists) throw new HttpError(400, 'Sondage introuvable');
  return surveyId;
};

const cleanNote = (note) => {
  const text = typeof note === 'string' ? note.trim() : '';
  if (text.length > MAX_NOTE_LENGTH) throw new HttpError(400, `${MAX_NOTE_LENGTH} caractères maximum`);
  return text;
};

const findActionInOrg = async (req) => {
  const action = await ImprovementAction.findOne({ _id: req.params.id, organizationId: req.user.organizationId });
  if (!action) throw new HttpError(404, 'Action introuvable');
  return action;
};

// Action complète avec les noms (responsable, auteurs des notes, sondage)
const loadFull = (id) =>
  ImprovementAction.findById(id)
    .populate({ path: 'ownerId', select: OWNER_FIELDS })
    .populate({ path: 'createdBy', select: 'firstName lastName' })
    .populate({ path: 'surveyId', select: 'title' })
    .populate({ path: 'updates.authorId', select: 'firstName lastName' });

const present = (action) => {
  const json = action.toJSON();
  return {
    ...json,
    updates: [...json.updates].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)),
    isOverdue: isOverdue(json),
  };
};

// ---------- RH ----------

// POST /api/actions
// Body : { title, ownerId, targetDate, objective?, topic?, surveyId?, visibleToEmployees? }
export const createAction = async (req, res) => {
  const { organizationId, userId } = req.user;
  requireFields(req.body, ['title', 'ownerId', 'targetDate']);

  await checkOwner(organizationId, req.body.ownerId);
  const surveyId = await checkSurvey(organizationId, req.body.surveyId);

  const action = new ImprovementAction({
    ...pick(req.body, EDITABLE_FIELDS),
    organizationId,
    createdBy: userId,
    ownerId: req.body.ownerId,
    surveyId,
    targetDate: parseTargetDate(req.body.targetDate, { future: true }),
    status: 'PLANNED',
  });
  action.addUpdate(userId, 'Action créée');

  await runValidation(action);
  await action.save();
  res.status(201).json(present(await loadFull(action._id)));
};

// POST /api/actions/from-recommendation
// Body : { analysisId, recommendationId, ownerId, targetDate, title?, objective?, visibleToEmployees? }
// Crée l'action et marque la recommandation comme acceptée, en une seule transaction.
export const createActionFromRecommendation = async (req, res) => {
  const { organizationId, userId } = req.user;
  requireFields(req.body, ['analysisId', 'recommendationId', 'ownerId', 'targetDate']);

  const analysis = await AiAnalysis.findOne({ _id: req.body.analysisId, organizationId, status: 'DONE' });
  if (!analysis) throw new HttpError(404, 'Analyse introuvable');

  const found = analysis.findRecommendation(req.body.recommendationId);
  if (!found) throw new HttpError(404, 'Recommandation introuvable');
  const { theme, recommendation } = found;

  if (recommendation.status === 'REJECTED') {
    throw new HttpError(409, 'Cette recommandation a été rejetée');
  }
  if (recommendation.actionId) {
    throw new HttpError(409, 'Une action existe déjà pour cette recommandation');
  }

  await checkOwner(organizationId, req.body.ownerId);
  const targetDate = parseTargetDate(req.body.targetDate, { future: true });

  const session = await mongoose.startSession();
  let action;

  try {
    await session.withTransaction(async () => {
      action = new ImprovementAction({
        organizationId,
        createdBy: userId,
        // Par défaut, le texte de la recommandation (le RH peut le reformuler)
        title: (req.body.title || recommendation.content).slice(0, 200),
        objective: req.body.objective ?? recommendation.rationale,
        topic: theme.name,
        surveyId: analysis.surveyId,
        analysisId: analysis._id,
        themeId: theme._id,
        recommendationId: recommendation._id,
        ownerId: req.body.ownerId,
        targetDate,
        visibleToEmployees: Boolean(req.body.visibleToEmployees),
      });
      action.addUpdate(userId, "Action créée à partir d'une recommandation de l'analyse IA");
      await runValidation(action);
      await action.save({ session });

      recommendation.status = 'ACCEPTED';
      recommendation.actionId = action._id;
      recommendation.reviewedBy = userId;
      recommendation.reviewedAt = new Date();
      await analysis.save({ session });
    });
  } finally {
    await session.endSession();
  }

  res.status(201).json(present(await loadFull(action._id)));
};

// GET /api/actions?status=IN_PROGRESS&ownerId=...&surveyId=...&overdue=true&visible=true
export const listActions = async (req, res) => {
  const filter = { organizationId: req.user.organizationId };
  const { status, ownerId, surveyId, overdue, visible } = req.query;

  if (status) {
    if (!ACTION_STATUSES.includes(status)) {
      throw new HttpError(400, 'Statut invalide', { allowed: ACTION_STATUSES });
    }
    filter.status = status;
  }
  if (ownerId) filter.ownerId = ownerId;
  if (surveyId) filter.surveyId = surveyId;
  if (visible === 'true' || visible === 'false') filter.visibleToEmployees = visible === 'true';
  if (overdue === 'true') {
    filter.status = status && ACTIVE_STATUSES.includes(status) ? status : { $in: ACTIVE_STATUSES };
    filter.targetDate = { $lt: startOfToday() };
  }

  const actions = await ImprovementAction.find(filter)
    .sort({ targetDate: 1 })
    .populate({ path: 'ownerId', select: OWNER_FIELDS })
    .populate({ path: 'surveyId', select: 'title' })
    .lean();

  res.json(
    actions.map(({ updates, __v, ...a }) => ({
      ...a,
      updateCount: updates.length,
      lastUpdateAt: updates.length ? updates.at(-1).createdAt : null,
      isOverdue: isOverdue(a),
    }))
  );
};

// GET /api/actions/summary?surveyId=...
// Chiffres pour le tableau de bord RH
export const getActionsSummary = async (req, res) => {
  const match = { organizationId: new mongoose.Types.ObjectId(req.user.organizationId) };
  if (req.query.surveyId) {
    if (!mongoose.isValidObjectId(req.query.surveyId)) throw new HttpError(400, 'Sondage invalide');
    match.surveyId = new mongoose.Types.ObjectId(req.query.surveyId);
  }

  const [byStatus, overdueCount, visibleCount] = await Promise.all([
    ImprovementAction.aggregate([{ $match: match }, { $group: { _id: '$status', count: { $sum: 1 } } }]),
    ImprovementAction.countDocuments({
      ...match,
      status: { $in: ACTIVE_STATUSES },
      targetDate: { $lt: startOfToday() },
    }),
    ImprovementAction.countDocuments({ ...match, visibleToEmployees: true }),
  ]);

  const counts = Object.fromEntries(ACTION_STATUSES.map((s) => [s, 0]));
  for (const row of byStatus) counts[row._id] = row.count;
  const total = Object.values(counts).reduce((a, b) => a + b, 0);

  res.json({
    total,
    byStatus: counts,
    overdue: overdueCount,
    visibleToEmployees: visibleCount,
    // Part des actions terminées, sans compter les annulées
    completionRate: total - counts.CANCELLED > 0
      ? Math.round((counts.DONE / (total - counts.CANCELLED)) * 1000) / 10
      : null,
  });
};

// GET /api/actions/:id
export const getAction = async (req, res) => {
  const action = await findActionInOrg(req);
  res.json(present(await loadFull(action._id)));
};

// PATCH /api/actions/:id
// Body : { title?, objective?, topic?, ownerId?, targetDate?, visibleToEmployees? }
// Le statut se change avec PATCH /api/actions/:id/status
export const updateAction = async (req, res) => {
  const { organizationId, userId } = req.user;
  const action = await findActionInOrg(req);

  if (req.body.status !== undefined) {
    throw new HttpError(400, 'Pour changer le statut, utilisez PATCH /api/actions/:id/status');
  }
  if (action.status === 'CANCELLED') {
    throw new HttpError(409, 'Une action annulée doit être replanifiée avant d’être modifiée');
  }

  action.set(pick(req.body, EDITABLE_FIELDS));

  // Les changements importants sont tracés dans les notes de suivi
  if (req.body.ownerId !== undefined && String(req.body.ownerId) !== String(action.ownerId)) {
    await checkOwner(organizationId, req.body.ownerId);
    action.ownerId = req.body.ownerId;
    action.addUpdate(userId, 'Responsable modifié');
  }

  if (req.body.targetDate !== undefined) {
    const newDate = parseTargetDate(req.body.targetDate);
    if (day(newDate) !== day(action.targetDate)) {
      action.addUpdate(userId, `Échéance modifiée : ${day(action.targetDate)} → ${day(newDate)}`);
      action.targetDate = newDate;
    }
  }

  if (action.isModified('visibleToEmployees')) {
    action.addUpdate(
      userId,
      action.visibleToEmployees ? 'Action partagée avec les employés' : 'Action retirée de la vue employés'
    );
  }

  await runValidation(action);
  await action.save();
  res.json(present(await loadFull(action._id)));
};

// PATCH /api/actions/:id/status
// Body : { status, note? }
export const changeActionStatus = async (req, res) => {
  requireFields(req.body, ['status']);
  const { status } = req.body;

  if (!ACTION_STATUSES.includes(status)) {
    throw new HttpError(400, 'Statut invalide', { allowed: ACTION_STATUSES });
  }

  const action = await findActionInOrg(req);
  if (action.status === status) throw new HttpError(400, `L'action est déjà au statut ${status}`);

  try {
    // Vérifie la transition et ajoute la note de suivi
    action.changeStatus(status, req.user.userId, cleanNote(req.body.note));
  } catch (err) {
    if (err instanceof HttpError) throw err;
    throw new HttpError(409, err.message);
  }

  await runValidation(action);
  await action.save();
  res.json(present(await loadFull(action._id)));
};

// POST /api/actions/:id/updates
// Body : { note }
export const addActionUpdate = async (req, res) => {
  requireFields(req.body, ['note']);
  const note = cleanNote(req.body.note);
  if (note.length < 2) throw new HttpError(400, 'La note est trop courte');

  const action = await findActionInOrg(req);
  action.addUpdate(req.user.userId, note);

  await runValidation(action);
  await action.save();
  res.status(201).json(present(await loadFull(action._id)));
};

// ---------- EMPLOYÉ ----------

// GET /api/employee/actions
// Actions partagées par les RH : titre, objectif, statut, échéance seulement
export const listEmployeeActions = async (req, res) => {
  const actions = await ImprovementAction.findVisibleForEmployees(req.user.organizationId);
  res.json(actions.map((a) => a.toEmployeeView()));
};