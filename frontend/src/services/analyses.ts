import { api } from '@/lib/Api';
import type { Action } from '@/types/action';
import type { ActionFromRecommendationInput, Analysis, Recommendation, RecommendationStatus } from '@/types/analysis';

// L'appel attend la réponse du service IA (jusqu'à 60 s côté backend) :
// on laisse donc plus que les 30 s par défaut d'axios.
export const requestAnalysis = (surveyId: string) =>
  api.post<Analysis>('/analyses', { surveyId }, { timeout: 90_000 }).then((res) => res.data);

export const reviewRecommendation = (
  analysisId: string,
  recommendationId: string,
  input: { status?: RecommendationStatus; content?: string }
) =>
  api
    .patch<{ recommendation: Recommendation }>(`/analyses/${analysisId}/recommendations/${recommendationId}`, input)
    .then((res) => res.data.recommendation);

// Crée l'action ET marque la recommandation comme acceptée (une seule transaction côté backend)
export const createActionFromRecommendation = (input: ActionFromRecommendationInput) =>
  api.post<Action>('/actions/from-recommendation', input).then((res) => res.data);