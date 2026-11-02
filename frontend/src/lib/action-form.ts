import { dateInputToEndISO, isoToDateInput } from '@/lib/survey-dates';
import type { Action, ActionInput } from '@/types/action';

// Valeurs du formulaire d'action (tout en texte, comme les champs HTML)
export interface ActionFormValues {
  title: string;
  objective: string;
  topic: string;
  ownerId: string;
  targetDate: string; // AAAA-MM-JJ
  surveyId: string; // '' = aucun sondage
  visibleToEmployees: boolean;
}

export type ActionFormErrors = Partial<Record<keyof ActionFormValues, string>>;

export const emptyActionValues = (): ActionFormValues => ({
  title: '',
  objective: '',
  topic: '',
  ownerId: '',
  targetDate: '',
  surveyId: '',
  visibleToEmployees: false,
});

export const actionToValues = (action: Action): ActionFormValues => ({
  title: action.title,
  objective: action.objective ?? '',
  topic: action.topic ?? '',
  ownerId: action.ownerId?._id ?? '',
  targetDate: isoToDateInput(action.targetDate),
  surveyId: action.surveyId?._id ?? '',
  visibleToEmployees: action.visibleToEmployees,
});

// Date du jour au format AAAA-MM-JJ (heure locale), pour comparer avec <input type="date">
export const todayInput = (now: Date = new Date()) => isoToDateInput(now.toISOString());

// Mêmes règles que le modèle ImprovementAction.
// En création, l'échéance ne peut pas être passée (en modification, si : une action peut être en retard).
export const validateAction = (
  values: ActionFormValues,
  mode: 'create' | 'edit',
  now: Date = new Date()
): ActionFormErrors => {
  const errors: ActionFormErrors = {};
  const title = values.title.trim();

  if (title.length < 3) errors.title = 'Au moins 3 caractères';
  else if (title.length > 200) errors.title = '200 caractères maximum';
  if (values.objective.trim().length > 2000) errors.objective = '2000 caractères maximum';
  if (values.topic.trim().length > 150) errors.topic = '150 caractères maximum';
  if (!values.ownerId) errors.ownerId = 'Choisissez un responsable';
  if (!values.targetDate) errors.targetDate = 'Choisissez une échéance';
  else if (mode === 'create' && values.targetDate < todayInput(now)) {
    errors.targetDate = 'L’échéance ne peut pas être dans le passé';
  }
  return errors;
};

// Valeurs → corps de la requête. Le sondage lié ne se choisit qu'à la création.
export const toActionInput = (values: ActionFormValues, mode: 'create' | 'edit'): ActionInput => ({
  title: values.title.trim(),
  objective: values.objective.trim(),
  topic: values.topic.trim(),
  ownerId: values.ownerId,
  targetDate: dateInputToEndISO(values.targetDate),
  visibleToEmployees: values.visibleToEmployees,
  ...(mode === 'create' && values.surveyId ? { surveyId: values.surveyId } : {}),
});