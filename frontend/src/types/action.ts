// Actions d'amélioration (réponses de /api/actions, RH seulement)

export type ActionStatus = 'PLANNED' | 'IN_PROGRESS' | 'DONE' | 'CANCELLED';

// Le backend « remplit » (populate) ownerId et surveyId : ce sont des objets, pas des chaînes.
// null si le compte ou le sondage a été supprimé.
export interface ActionPerson {
  _id: string;
  firstName: string;
  lastName: string;
  email?: string;
  department?: string;
}

interface ActionBase {
  _id: string;
  organizationId: string;
  title: string;
  objective: string;
  topic: string;
  status: ActionStatus;
  targetDate: string;
  visibleToEmployees: boolean;
  ownerId: ActionPerson | null;
  surveyId: { _id: string; title: string } | null;
  analysisId: string | null;
  recommendationId: string | null;
  startedAt: string | null;
  completedAt: string | null;
  cancelledAt: string | null;
  createdAt: string;
  updatedAt: string;
  isOverdue: boolean;
}

// GET /api/actions : une ligne de la liste
export interface ActionListItem extends ActionBase {
  createdBy: string;
  updateCount: number;
  lastUpdateAt: string | null;
}

// Note de suivi (ajoutée à la main ou automatiquement à chaque changement)
export interface ActionUpdate {
  _id: string;
  authorId: { _id: string; firstName: string; lastName: string } | null;
  note: string;
  statusFrom: ActionStatus | null;
  statusTo: ActionStatus | null;
  createdAt: string;
}

// GET /api/actions/:id : l'action complète, notes les plus récentes en premier
export interface Action extends ActionBase {
  createdBy: { _id: string; firstName: string; lastName: string } | null;
  updates: ActionUpdate[];
}

// GET /api/actions/summary
export interface ActionsSummary {
  total: number;
  byStatus: Record<ActionStatus, number>;
  overdue: number;
  visibleToEmployees: number;
  completionRate: number | null;
}

// Corps de POST /api/actions et PATCH /api/actions/:id
export interface ActionInput {
  title?: string;
  objective?: string;
  topic?: string;
  ownerId?: string;
  targetDate?: string;
  surveyId?: string | null;
  visibleToEmployees?: boolean;
}