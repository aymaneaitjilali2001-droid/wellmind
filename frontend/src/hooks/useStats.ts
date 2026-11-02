import { useApi } from '@/lib/swr';
import type { StatsOverview, SurveyStats } from '@/types/stats';

// Résultats d'un sondage. Le backend répond 409 s'il n'est pas clôturé
// et 422 sous le seuil : on n'appelle donc la route que pour un sondage clôturé.
export function useSurveyStats(surveyId: string | null) {
  return useApi<SurveyStats>(surveyId ? `/stats/surveys/${surveyId}` : null);
}

export function useStatsOverview() {
  return useApi<StatsOverview>('/stats/overview');
}