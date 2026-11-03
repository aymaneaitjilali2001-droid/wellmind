import { useApi } from '@/lib/Swr';
import type { Survey, SurveyParticipation, SurveyStatus, SurveySummary } from '@/types/survey';

// /surveys ou /surveys?status=PUBLISHED
export const surveysKey = (status: SurveyStatus | '' = '') =>
  status ? `/surveys?status=${status}` : '/surveys';

// Tout ce qui concerne les sondages en cache : listes, détails et participation
export const isSurveysKey = (key: unknown) =>
  typeof key === 'string' && (key.startsWith('/surveys') || key.startsWith('/participation'));

export function useSurveys(status: SurveyStatus | '' = '') {
  return useApi<SurveySummary[]>(surveysKey(status), { keepPreviousData: true });
}

export function useSurvey(id: string | null) {
  return useApi<Survey>(id ? `/surveys/${id}` : null);
}

export function useSurveyParticipation(id: string | null) {
  return useApi<SurveyParticipation>(id ? `/participation/surveys/${id}` : null);
}