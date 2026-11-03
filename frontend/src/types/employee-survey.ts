// Ce que l'employé reçoit du backend (/api/employee/...).
// Volontairement séparé de types/survey.ts : l'employé ne voit pas les champs internes.

// GET /api/employee/surveys : sondages publiés et ouverts
export interface EmployeeSurveySummary {
  _id: string;
  title: string;
  description: string;
  topic?: string;
  isAnonymous: boolean;
  startDate: string;
  endDate: string;
  questionCount: number;
  alreadySubmitted: boolean;
}

export interface EmployeeQuestion {
  _id: string;
  label: string;
  type: 'RATING' | 'CHOICE' | 'TEXT';
  isRequired: boolean;
  scaleMin?: number;
  scaleMax?: number;
  minLabel?: string;
  maxLabel?: string;
  options?: { _id: string; label: string }[];
}

// GET /api/employee/surveys/:id : le sondage à remplir
export interface EmployeeSurvey extends Omit<EmployeeSurveySummary, 'questionCount'> {
  anonymityNotice: string;
  isOpen: boolean;
  questions: EmployeeQuestion[];
}

// Corps de POST /api/employee/surveys/:id/submit
export type AnswerInput =
  | { questionId: string; ratingValue: number }
  | { questionId: string; optionId: string }
  | { questionId: string; text: string };

export interface SubmitResult {
  message: string;
  isAnonymous: boolean;
  submittedOn: string;
}

// GET /api/employee/participations : historique (jamais le contenu des réponses)
export interface MyParticipation {
  surveyId: string;
  title: string;
  isAnonymous: boolean;
  surveyStatus: 'DRAFT' | 'PUBLISHED' | 'CLOSED';
  submittedOn: string;
}

// GET /api/employee/actions : actions partagées par les RH (vue publique, sans notes ni responsable)
export interface EmployeeAction {
  _id: string;
  title: string;
  objective: string;
  topic: string;
  status: 'PLANNED' | 'IN_PROGRESS' | 'DONE';
  targetDate: string;
  completedAt: string | null;
}