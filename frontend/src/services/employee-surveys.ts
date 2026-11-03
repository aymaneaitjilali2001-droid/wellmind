import { api } from '@/lib/Api';
import type { AnswerInput, SubmitResult } from '@/types/employee-survey';

// L'anonymat n'est PAS envoyé : le backend le prend toujours dans le sondage
export const submitSurvey = (surveyId: string, answers: AnswerInput[]) =>
  api.post<SubmitResult>(`/employee/surveys/${surveyId}/submit`, { answers }).then((res) => res.data);