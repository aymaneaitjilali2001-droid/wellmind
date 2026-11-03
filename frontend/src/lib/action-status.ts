import type { ActionStatus } from '@/types/action';

export const ACTION_STATUSES: ActionStatus[] = ['PLANNED', 'IN_PROGRESS', 'DONE', 'CANCELLED'];

export const STATUS_LABELS: Record<ActionStatus, string> = {
  PLANNED: 'Planifiée',
  IN_PROGRESS: 'En cours',
  DONE: 'Terminée',
  CANCELLED: 'Annulée',
};

// Mêmes transitions que ALLOWED_TRANSITIONS dans improvementActions.models.js
export const ALLOWED_TRANSITIONS: Record<ActionStatus, ActionStatus[]> = {
  PLANNED: ['IN_PROGRESS', 'CANCELLED'],
  IN_PROGRESS: ['DONE', 'CANCELLED', 'PLANNED'],
  DONE: ['IN_PROGRESS'],
  CANCELLED: ['PLANNED'],
};

// Bouton affiché pour chaque transition possible, et texte de la confirmation
export const TRANSITIONS: Record<
  string,
  { label: string; confirm: string; tone: 'default' | 'outline' | 'danger' }
> = {
  'PLANNED->IN_PROGRESS': { label: 'Démarrer l’action', confirm: 'Passer l’action en cours ?', tone: 'default' },
  'PLANNED->CANCELLED': { label: 'Annuler l’action', confirm: 'Annuler cette action ?', tone: 'danger' },
  'IN_PROGRESS->DONE': { label: 'Marquer comme terminée', confirm: 'Marquer l’action comme terminée ?', tone: 'default' },
  'IN_PROGRESS->PLANNED': { label: 'Remettre en planifiée', confirm: 'Remettre l’action en planifiée ?', tone: 'outline' },
  'IN_PROGRESS->CANCELLED': { label: 'Annuler l’action', confirm: 'Annuler cette action ?', tone: 'danger' },
  'DONE->IN_PROGRESS': { label: 'Rouvrir l’action', confirm: 'Rouvrir l’action (retour en cours) ?', tone: 'outline' },
  'CANCELLED->PLANNED': { label: 'Replanifier l’action', confirm: 'Replanifier cette action ?', tone: 'default' },
};

export const getTransition = (from: ActionStatus, to: ActionStatus) => TRANSITIONS[`${from}->${to}`];

export const isActiveStatus =(status: ActionStatus) => status === 'PLANNED' || status === 'IN_PROGRESS';