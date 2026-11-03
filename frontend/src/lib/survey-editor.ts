import type { QuestionInput, QuestionType, Survey, SurveyInput } from '@/types/survey';
import { dateInputToEndISO, dateInputToStartISO, isoToDateInput } from './survey-dates';

// ---------------------------------------------------------------
// État de l'éditeur de sondage, conversions et validation.
// Les règles reprennent celles du modèle Survey du backend.
// ---------------------------------------------------------------

export const LIMITS = {
  title: 150,
  topic: 80,
  description: 2000,
  label: 500,
  option: 200,
  scaleLabel: 50,
  questions: 50,
  options: 20,
};

// Échelles proposées pour les questions RATING (le backend limite l'écart à 10 points)
export const SCALE_PRESETS = [
  { min: 1, max: 5 },
  { min: 1, max: 10 },
  { min: 0, max: 10 },
];

// Clé locale, seulement pour React (key) et pour retrouver une question dans l'état
let counter = 0;
export const newKey = () => `k${Date.now().toString(36)}${(counter++).toString(36)}`;

export interface DraftOption {
  key: string;
  label: string;
}

export interface DraftQuestion {
  key: string;
  label: string;
  type: QuestionType;
  isRequired: boolean;
  scaleMin: number;
  scaleMax: number;
  minLabel: string;
  maxLabel: string;
  options: DraftOption[];
}

export interface EditorState {
  title: string;
  topic: string;
  description: string;
  isAnonymous: boolean;
  startDate: string; // AAAA-MM-JJ (champ date), '' si vide
  endDate: string;
  questions: DraftQuestion[];
}

export const newQuestion = (type: QuestionType): DraftQuestion => ({
  key: newKey(),
  label: '',
  type,
  isRequired: type !== 'TEXT', // une question ouverte est facultative par défaut
  scaleMin: 1,
  scaleMax: 5,
  minLabel: '',
  maxLabel: '',
  options:
    type === 'CHOICE'
      ? [
          { key: newKey(), label: '' },
          { key: newKey(), label: '' },
        ]
      : [],
});

// Change le type d'une question en gardant ce qui peut l'être (intitulé, obligatoire)
export const changeQuestionType = (q: DraftQuestion, type: QuestionType): DraftQuestion => ({
  ...q,
  type,
  options:
    type === 'CHOICE' && q.options.length < 2
      ? [...q.options, ...Array.from({ length: 2 - q.options.length }, () => ({ key: newKey(), label: '' }))]
      : q.options,
});

export const emptyEditorState = (): EditorState => ({
  title: '',
  topic: '',
  description: '',
  isAnonymous: true, // anonyme par défaut : le mode le plus protecteur
  startDate: '',
  endDate: '',
  questions: [newQuestion('RATING')],
});

export const surveyToEditorState = (survey: Survey): EditorState => ({
  title: survey.title,
  topic: survey.topic ?? '',
  description: survey.description ?? '',
  isAnonymous: survey.isAnonymous,
  startDate: isoToDateInput(survey.startDate),
  endDate: isoToDateInput(survey.endDate),
  questions: survey.questions.map((q) => ({
    key: q._id,
    label: q.label,
    type: q.type,
    isRequired: q.isRequired,
    scaleMin: q.scaleMin ?? 1,
    scaleMax: q.scaleMax ?? 5,
    minLabel: q.minLabel ?? '',
    maxLabel: q.maxLabel ?? '',
    options: q.options.map((o) => ({ key: o._id, label: o.label })),
  })),
});

const toQuestionInput = (q: DraftQuestion): QuestionInput => {
  const base = { label: q.label.trim(), type: q.type, isRequired: q.isRequired };
  if (q.type === 'RATING') {
    return {
      ...base,
      scaleMin: q.scaleMin,
      scaleMax: q.scaleMax,
      minLabel: q.minLabel.trim() || undefined,
      maxLabel: q.maxLabel.trim() || undefined,
    };
  }
  if (q.type === 'CHOICE') return { ...base, options: q.options.map((o) => o.label.trim()) };
  return base;
};

// Brouillon : tout est envoyé. Une date vide est envoyée à null pour l'effacer.
export const toFullInput = (s: EditorState): SurveyInput => ({
  title: s.title.trim(),
  topic: s.topic.trim(),
  description: s.description.trim(),
  isAnonymous: s.isAnonymous,
  startDate: dateInputToStartISO(s.startDate) ?? null,
  endDate: dateInputToEndISO(s.endDate) ?? null,
  questions: s.questions.map(toQuestionInput),
});

// Sondage publié : le backend n'accepte que la description et la date de fin
export const toPublishedInput = (s: EditorState): SurveyInput => ({
  description: s.description.trim(),
  endDate: dateInputToEndISO(s.endDate) ?? null,
});

// ---------- Validation ----------

export interface QuestionErrors {
  label?: string;
  options?: string;
  scaleLabels?: string;
}

export interface EditorErrors {
  title?: string;
  topic?: string;
  description?: string;
  dates?: string;
  questions?: string;
  byQuestion: Record<string, QuestionErrors>;
}

export const validateEditor = (s: EditorState, mode: 'draft' | 'published'): EditorErrors => {
  const errors: EditorErrors = { byQuestion: {} };

  if (s.description.trim().length > LIMITS.description) {
    errors.description = `${LIMITS.description} caractères maximum.`;
  }

  if (mode === 'published') {
    // Le backend refuse une nouvelle date de fin passée
    if (!s.endDate) errors.dates = 'La date de fin est obligatoire pour un sondage publié.';
    else if (new Date(`${s.endDate}T23:59:59`) <= new Date()) errors.dates = 'La date de fin doit être dans le futur.';
    return errors;
  }

  const title = s.title.trim();
  if (title.length < 3) errors.title = 'Au moins 3 caractères.';
  else if (title.length > LIMITS.title) errors.title = `${LIMITS.title} caractères maximum.`;
  if (s.topic.trim().length > LIMITS.topic) errors.topic = `${LIMITS.topic} caractères maximum.`;

  if (s.startDate && s.endDate && s.endDate < s.startDate) {
    errors.dates = 'La date de fin doit être après la date de début.';
  }

  if (s.questions.length > LIMITS.questions) errors.questions = `${LIMITS.questions} questions maximum.`;

  for (const q of s.questions) {
    const qe: QuestionErrors = {};
    const label = q.label.trim();
    if (label.length < 3) qe.label = 'Au moins 3 caractères.';
    else if (label.length > LIMITS.label) qe.label = `${LIMITS.label} caractères maximum.`;

    if (q.type === 'CHOICE') {
      const labels = q.options.map((o) => o.label.trim());
      if (labels.length < 2) qe.options = 'Au moins 2 options.';
      else if (labels.some((l) => !l)) qe.options = 'Chaque option doit avoir un texte.';
      else if (new Set(labels.map((l) => l.toLowerCase())).size !== labels.length) {
        qe.options = 'Deux options sont identiques.';
      } else if (labels.some((l) => l.length > LIMITS.option)) qe.options = `${LIMITS.option} caractères maximum par option.`;
    }

    if (q.type === 'RATING' && (q.minLabel.length > LIMITS.scaleLabel || q.maxLabel.length > LIMITS.scaleLabel)) {
      qe.scaleLabels = `${LIMITS.scaleLabel} caractères maximum.`;
    }

    if (Object.keys(qe).length) errors.byQuestion[q.key] = qe;
  }

  return errors;
};

export const countErrors = (e: EditorErrors): number =>
  ['title', 'topic', 'description', 'dates', 'questions'].filter((k) => e[k as keyof EditorErrors]).length +
  Object.values(e.byQuestion).reduce((sum, qe) => sum + Object.keys(qe).length, 0);