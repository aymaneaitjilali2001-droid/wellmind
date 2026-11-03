// Statistiques calculées par le backend (/api/stats, RH seulement)

interface QuestionStatBase {
  questionId: string;
  label: string;
  isRequired: boolean;
  answered: number; // nombre de personnes qui ont répondu à cette question
}

export interface RatingStat extends QuestionStatBase {
  type: 'RATING';
  scaleMin: number;
  scaleMax: number;
  minLabel?: string;
  maxLabel?: string;
  average: number | null;
  distribution: { value: number; count: number }[];
}

export interface ChoiceStat extends QuestionStatBase {
  type: 'CHOICE';
  options: { optionId: string; label: string; count: number; percent: number }[];
}

// Commentaires : seulement leur nombre (le contenu passe par l'analyse IA, désidentifié)
export interface TextStat extends QuestionStatBase {
  type: 'TEXT';
}

export type QuestionStat = RatingStat | ChoiceStat | TextStat;

// GET /api/stats/surveys/:id (sondage clôturé, au-dessus du seuil)
export interface SurveyStats {
  surveyId: string;
  title: string;
  responseCount: number;
  threshold: number;
  score: number | null; // sur 100 ; null si aucune question notée
  questions: QuestionStat[];
  byDepartment: { department: string; responseCount: number; score: number | null }[];
  hiddenDepartments: number;
}

// GET /api/stats/overview
export interface StatsOverview {
  threshold: number;
  surveys: {
    surveyId: string;
    title: string;
    status: 'PUBLISHED' | 'CLOSED';
    startDate?: string;
    endDate?: string;
    responseCount: number;
    score: number | null;
    masked: boolean; // ouvert ou sous le seuil
  }[];
}