export type SurveyStatus = 'DRAFT' | 'PUBLISHED' | 'CLOSED';
export type QuestionType = 'RATING' | 'CHOICE' | 'TEXT';

export interface QuestionOption {
  _id: string;
  label: string;
  position: number;
}

export interface Question {
  _id: string;
  label: string;
  type: QuestionType;
  isRequired: boolean;
  position: number;
  scaleMin?: number;
  scaleMax?: number;
  minLabel?: string;
  maxLabel?: string;
  options: QuestionOption[];
}

export interface Survey {
  _id: string;
  organizationId: string;
  createdBy: string;
  title: string;
  description: string;
  topic?: string;
  isAnonymous: boolean;
  status: SurveyStatus;
  startDate?: string;
  endDate?: string;
  seriesId: string | null;
  questions: Question[];
  publishedAt: string | null;
  closedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export type SurveySummary = Omit<Survey, 'questions'> & {
  questionCount: number;
  participantCount: number;
};

export interface QuestionInput {
  label: string;
  type: QuestionType;
  isRequired: boolean;
  scaleMin?: number;
  scaleMax?: number;
  minLabel?: string;
  maxLabel?: string;
  options?: string[];
}

// null pour une date = l'effacer
export interface SurveyInput {
  title?: string;
  description?: string;
  topic?: string;
  isAnonymous?: boolean;
  startDate?: string | null;
  endDate?: string | null;
  questions?: QuestionInput[];
}

export interface SurveyParticipation {
  surveyId: string;
  title: string;
  status: SurveyStatus;
  isAnonymous: boolean;
  startDate?: string;
  endDate?: string;
  participants: number;
  eligible: number;
  nonParticipants: number;
  participationRate: number;
}