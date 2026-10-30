import Survey, { QUESTION_TYPES, SURVEY_STATUSES } from '../models/surveys.models.js';
import Participation from '../models/participations.models.js';
import { HttpError } from '../utils/Httperror.js';
import { runValidation, pick, requireFields } from '../utils/validation.js';

const MAX_QUESTIONS = 50;
const SURVEY_FIELDS = ['title', 'description', 'isAnonymous', 'startDate', 'endDate', 'topic'];

// Seuls ces champs peuvent changer une fois le sondage publié :
// ils ne modifient pas le sens des réponses déjà reçues
const PUBLISHED_EDITABLE = ['description', 'endDate'];

// ---------- Helpers ----------

// Transforme les questions reçues en questions du modèle.
// L'ordre du tableau donne les positions (0, 1, 2…).
const normalizeQuestions = (questions) => {
  if (!Array.isArray(questions)) throw new HttpError(400, 'questions doit être une liste');
  if (questions.length > MAX_QUESTIONS) {
    throw new HttpError(400, `${MAX_QUESTIONS} questions maximum par sondage`);
  }

  return questions.map((q, i) => {
    if (!q || !QUESTION_TYPES.includes(q.type)) {
      throw new HttpError(400, `Question ${i + 1} : type invalide`, { allowed: QUESTION_TYPES });
    }
    const base = {
      label: q.label,
      type: q.type,
      isRequired: Boolean(q.isRequired),
      position: i,
    };
    if (q.type === 'RATING') {
      return {
        ...base,
        scaleMin: q.scaleMin,
        scaleMax: q.scaleMax,
        minLabel: q.minLabel,
        maxLabel: q.maxLabel,
      };
    }
    if (q.type === 'CHOICE') {
      const options = Array.isArray(q.options) ? q.options : [];
      return {
        ...base,
        // Accepte ["Oui", "Non"] ou [{ label: "Oui" }, { label: "Non" }]
        options: options.map((o, j) => ({ label: typeof o === 'string' ? o : o?.label, position: j })),
      };
    }
    return base; // TEXT
  });
};

// Toujours chercher dans l'organisation du RH connecté (isolation)
const findSurveyInOrg = async (req) => {
  const survey = await Survey.findOne({ _id: req.params.id, organizationId: req.user.organizationId });
  if (!survey) throw new HttpError(404, 'Sondage introuvable');
  return survey;
};


// ---------- Contrôleurs (RH) ----------

// POST /api/surveys — crée un brouillon
export const createSurvey = async (req, res) => {
  requireFields(req.body, ['title']);

  const survey = new Survey({
    ...pick(req.body, SURVEY_FIELDS),
    organizationId: req.user.organizationId,
    createdBy: req.user.userId,
    status: 'DRAFT',
    questions: req.body.questions ? normalizeQuestions(req.body.questions) : [],
  });

  await runValidation(survey);
  await survey.save();
  res.status(201).json(survey);
};

// GET /api/surveys?status=PUBLISHED&seriesId=...
// Liste sans le détail des questions, avec le nombre de participants
export const listSurveys = async (req, res) => {
  const filter = { organizationId: req.user.organizationId };
  if (req.query.status) {
    if (!SURVEY_STATUSES.includes(req.query.status)) throw new HttpError(400, 'Statut invalide');
    filter.status = req.query.status;
  }
  if (req.query.seriesId) filter.seriesId = req.query.seriesId;

  const surveys = await Survey.find(filter).sort({ createdAt: -1 }).lean();

  // Participants par sondage, en une seule requête
  const counts = await Participation.aggregate([
    { $match: { surveyId: { $in: surveys.map((s) => s._id) } } },
    { $group: { _id: '$surveyId', count: { $sum: 1 } } },
  ]);
  const countMap = new Map(counts.map((c) => [c._id.toString(), c.count]));

  res.json(
    surveys.map(({ questions, __v, ...s }) => ({
      ...s,
      questionCount: questions.length,
      participantCount: countMap.get(s._id.toString()) || 0,
    }))
  );
};

// GET /api/surveys/:id
export const getSurvey = async (req, res) => {
  const survey = await findSurveyInOrg(req);
  res.json({ ...survey.toJSON(), questions: survey.getSortedQuestions() });
};

// PATCH /api/surveys/:id
// Brouillon : tout est modifiable. Publié : seulement description et endDate.
// Clôturé : rien.
export const updateSurvey = async (req, res) => {
  const survey = await findSurveyInOrg(req);

  if (survey.status === 'CLOSED') {
    throw new HttpError(409, 'Un sondage clôturé ne peut plus être modifié');
  }

  if (survey.status === 'PUBLISHED') {
    const forbidden = Object.keys(req.body).filter((k) => !PUBLISHED_EDITABLE.includes(k));
    if (forbidden.length) {
      throw new HttpError(
        409,
        'Ce sondage est publié : seules la description et la date de fin peuvent être modifiées',
        { forbidden }
      );
    }
    if (req.body.endDate && new Date(req.body.endDate) <= new Date()) {
      throw new HttpError(400, 'La nouvelle date de fin doit être dans le futur');
    }
    survey.set(pick(req.body, PUBLISHED_EDITABLE));
  } else {
    survey.set(pick(req.body, SURVEY_FIELDS));
    if (req.body.questions !== undefined) {
      survey.questions = normalizeQuestions(req.body.questions);
    }
  }

  await runValidation(survey);
  await survey.save();
  res.json(survey);
};

// DELETE /api/surveys/:id — brouillon seulement
export const deleteSurvey = async (req, res) => {
  const survey = await findSurveyInOrg(req);
  if (survey.status !== 'DRAFT') {
    throw new HttpError(409, 'Seul un brouillon peut être supprimé ; clôturez plutôt ce sondage');
  }
  await survey.deleteOne();
  res.status(204).end();
};

// POST /api/surveys/:id/publish
export const publishSurvey = async (req, res) => {
  const survey = await findSurveyInOrg(req);

  const errors = survey.getPublishErrors();
  if (errors.length) throw new HttpError(400, 'Le sondage ne peut pas être publié', { errors });

  survey.status = 'PUBLISHED';
  survey.publishedAt = new Date();
  await runValidation(survey);
  await survey.save();
  res.json(survey);
};

// POST /api/surveys/:id/close
export const closeSurvey = async (req, res) => {
  const survey = await findSurveyInOrg(req);
  if (survey.status !== 'PUBLISHED') {
    throw new HttpError(409, 'Seul un sondage publié peut être clôturé');
  }
  survey.status = 'CLOSED';
  survey.closedAt = new Date();
  await survey.save();
  res.json(survey);
};

// POST /api/surveys/:id/duplicate
// Crée un nouveau brouillon avec les mêmes questions, dans la même série
// (questionnaires récurrents : comparaison entre périodes)
export const duplicateSurvey = async (req, res) => {
  const original = await findSurveyInOrg(req);

  // Le premier sondage d'une série sert d'identifiant de série
  if (!original.seriesId) {
    original.seriesId = original._id;
    await original.save();
  }

  const copy = new Survey({
    organizationId: original.organizationId,
    createdBy: req.user.userId,
    title: req.body.title || `${original.title} (copie)`,
    description: original.description,
    isAnonymous: original.isAnonymous,
    topic: original.topic,
    seriesId: original.seriesId,
    status: 'DRAFT',
    startDate: req.body.startDate,
    endDate: req.body.endDate,
    questions: original.getSortedQuestions().map((q, i) => ({
      label: q.label,
      type: q.type,
      isRequired: q.isRequired,
      position: i,
      scaleMin: q.scaleMin,
      scaleMax: q.scaleMax,
      minLabel: q.minLabel,
      maxLabel: q.maxLabel,
      options: q.options.map((o) => ({ label: o.label, position: o.position })),
    })),
  });

  await runValidation(copy);
  await copy.save();
  res.status(201).json(copy);
};

