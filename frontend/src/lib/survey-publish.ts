import type { Survey } from '@/types/survey';

// Conditions pour publier un sondage : les mêmes que getPublishErrors() dans le backend.
// Affichées sous forme de liste à cocher avant de publier.
export const getPublishChecklist = (survey: Survey, now: Date = new Date()) => [
  { label: 'Un titre d’au moins 3 caractères', ok: survey.title.trim().length >= 3 },
  { label: 'Au moins une question', ok: survey.questions.length > 0 },
  { label: 'Une date de début et une date de fin', ok: Boolean(survey.startDate && survey.endDate) },
  { label: 'Une date de fin à venir', ok: Boolean(survey.endDate && new Date(survey.endDate) > now) },
];