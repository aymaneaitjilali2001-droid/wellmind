import type { AnswerInput, EmployeeQuestion } from '@/types/employee-survey';

// Réponses en cours de saisie : une entrée par question (questionId → valeur)
export interface AnswerValue {
  rating?: number;
  optionId?: string;
  text?: string;
}
export type AnswersState = Record<string, AnswerValue>;

export const MAX_TEXT_LENGTH = 3000; // même limite que le backend

// La question a-t-elle une réponse utilisable ?
export const isAnswered = (q: EmployeeQuestion, a: AnswerValue | undefined): boolean => {
  if (!a) return false;
  if (q.type === 'RATING') return typeof a.rating === 'number';
  if (q.type === 'CHOICE') return Boolean(a.optionId);
  return Boolean(a.text?.trim());
};

// Erreurs par question (mêmes règles que buildAnswers côté backend)
export const validateAnswers = (questions: EmployeeQuestion[], answers: AnswersState): Record<string, string> => {
  const errors: Record<string, string> = {};
  for (const q of questions) {
    const a = answers[q._id];
    if (q.isRequired && !isAnswered(q, a)) errors[q._id] = 'Réponse obligatoire';
    else if (q.type === 'TEXT' && (a?.text?.trim().length ?? 0) > MAX_TEXT_LENGTH) {
      errors[q._id] = `${MAX_TEXT_LENGTH} caractères maximum`;
    }
  }
  return errors;
};

// Corps de la requête : seulement les questions répondues
export const toAnswerInputs = (questions: EmployeeQuestion[], answers: AnswersState): AnswerInput[] =>
  questions.flatMap((q): AnswerInput[] => {
    const a = answers[q._id];
    if (!isAnswered(q, a)) return [];
    if (q.type === 'RATING') return [{ questionId: q._id, ratingValue: a!.rating as number }];
    if (q.type === 'CHOICE') return [{ questionId: q._id, optionId: a!.optionId as string }];
    return [{ questionId: q._id, text: (a!.text as string).trim() }];
  });

export const countAnswered = (questions: EmployeeQuestion[], answers: AnswersState) =>
  questions.filter((q) => isAnswered(q, answers[q._id])).length;