import { useApi } from '@/lib/Swr';
import type { Analysis, AnalysisListItem } from '@/types/analysis';

export const latestAnalysisKey = (surveyId: string) => `/analyses/latest?surveyId=${surveyId}`;
export const isAnalysesKey = (key: unknown) => typeof key === 'string' && key.startsWith('/analyses');

// Dernière analyse TERMINÉE d'un sondage.
// Le backend renvoie 404 s'il n'y en a pas encore : ce n'est pas une vraie erreur
// (pas de nouvel essai sur une 4xx, voir swrConfig).
export function useLatestAnalysis(surveyId: string | null) {
  return useApi<Analysis>(surveyId ? latestAnalysisKey(surveyId) : null);
}

// Historique de toutes les analyses de l'organisation (plus récentes en premier)
export function useAnalysesList() {
  return useApi<AnalysisListItem[]>('/analyses');
}

export function useAnalysis(id: string | null) {
  return useApi<Analysis>(id ? `/analyses/${id}` : null);
}