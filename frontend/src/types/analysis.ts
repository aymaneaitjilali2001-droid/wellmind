// Analyse IA d'un sondage (réponses de /api/analyses, RH seulement)

export type AnalysisStatus = 'PENDING' | 'DONE' | 'FAILED';
export type ThemeSentiment = 'CONCERN' | 'POSITIVE' | 'MIXED';
export type RecommendationStatus = 'PROPOSED' | 'ACCEPTED' | 'REJECTED';

export interface Recommendation {
  _id: string;
  content: string;
  rationale: string;
  status: RecommendationStatus;
  editedByHr: boolean;
  reviewedBy: string | null;
  reviewedAt: string | null;
  actionId: string | null; // action créée à partir de cette recommandation
}

export interface AnalysisTheme {
  _id: string;
  name: string;
  sentiment: ThemeSentiment;
  description: string;
  mentionCount: number; // calculé par le backend, pas par l'IA
  excerpts: string[]; // extraits désidentifiés (3 maximum)
  recommendations: Recommendation[];
}

export interface Analysis {
  _id: string;
  organizationId: string;
  surveyId: string;
  requestedBy: string;
  status: AnalysisStatus;
  summary: string;
  responseCount: number;
  commentCount: number;
  insufficientData: boolean;
  limitations: string[];
  themes: AnalysisTheme[];
  aiModel: string | null;
  errorMessage: string | null;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
  // Ajoutés par le backend (splitThemes)
  concerns: AnalysisTheme[];
  positives: AnalysisTheme[];
  mixed: AnalysisTheme[];
}

// Corps de POST /api/actions/from-recommendation
export interface ActionFromRecommendationInput {
  analysisId: string;
  recommendationId: string;
  ownerId: string;
  targetDate: string;
  title?: string;
  objective?: string;
  visibleToEmployees?: boolean;
}

// GET /api/analyses : historique des analyses (sans le détail des thèmes)
export interface AnalysisListItem {
  _id: string;
  surveyId: string;
  surveyTitle: string | null;
  status: AnalysisStatus;
  insufficientData: boolean;
  responseCount: number;
  commentCount: number;
  themeCount: number;
  concernCount: number;
  positiveCount: number;
  errorMessage: string | null;
  createdAt: string;
  completedAt: string | null;
}