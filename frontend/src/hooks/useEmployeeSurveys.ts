import { useApi } from '@/lib/Swr';
import type {
  EmployeeAction,
  EmployeeSurvey,
  EmployeeSurveySummary,
  MyParticipation,
} from '@/types/employee-survey';

// Toutes les clés de l'espace employé commencent par /employee :
// après une réponse, mutate(isEmployeeSpaceKey) recharge la liste ET l'historique.
export const isEmployeeSpaceKey = (key: unknown) => typeof key === 'string' && key.startsWith('/employee/');

export function useMySurveys() {
  return useApi<EmployeeSurveySummary[]>('/employee/surveys');
}

export function useMySurvey(id: string | null) {
  return useApi<EmployeeSurvey>(id ? `/employee/surveys/${id}` : null);
}

export function useMyParticipations() {
  return useApi<MyParticipation[]>('/employee/participations');
}

export function useSharedActions() {
  return useApi<EmployeeAction[]>('/employee/actions');
}