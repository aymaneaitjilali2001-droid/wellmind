import { useApi } from '@/lib/Swr';
import type { SurveyStatus } from '@/types/survey';

// GET /api/participation/overview : participation de tous les sondages publiés ou clôturés
export interface ParticipationOverview {
  eligibleEmployees: number;
  publishedCount: number;
  closedCount: number;
  totalParticipations: number;
  averageParticipationRate: number | null; // sur les sondages clôturés ; null s'il n'y en a pas
  surveys: {
    surveyId: string;
    title: string;
    status: SurveyStatus;
    startDate?: string;
    endDate?: string;
    participants: number;
    participationRate: number;
  }[];
}

export function useParticipationOverview() {
  return useApi<ParticipationOverview>('/participation/overview');
}