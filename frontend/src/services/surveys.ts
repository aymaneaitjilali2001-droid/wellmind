import { api } from '@/lib/Api';
import type { Survey, SurveyInput } from '@/types/survey';

// Chaque fonction correspond à une route de surveys.routes.js (réservées aux RH)

export const createSurvey = (input: SurveyInput) =>
  api.post<Survey>('/surveys', input).then((res) => res.data);

// Brouillon : tout est modifiable. Publié : seulement description et endDate.
export const updateSurvey = (id: string, input: SurveyInput) =>
  api.patch<Survey>(`/surveys/${id}`, input).then((res) => res.data);

// Brouillon seulement
export const deleteSurvey = (id: string) => api.delete(`/surveys/${id}`).then(() => undefined);

export const publishSurvey = (id: string) =>
  api.post<Survey>(`/surveys/${id}/publish`).then((res) => res.data);

export const closeSurvey = (id: string) =>
  api.post<Survey>(`/surveys/${id}/close`).then((res) => res.data);

// Nouveau brouillon avec les mêmes questions, dans la même série
export const duplicateSurvey = (id: string, input: { title?: string; startDate?: string; endDate?: string } = {}) =>
  api.post<Survey>(`/surveys/${id}/duplicate`, input).then((res) => res.data);