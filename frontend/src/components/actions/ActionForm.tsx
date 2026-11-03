'use client';

import { useState, type FormEvent } from 'react';
import { AlertCircle, Eye, Loader2 } from 'lucide-react';
import { ButtonLink } from '@/components/Buttonlink';
import { FormField } from '@/components/FormField';
import { SelectField } from '@/components/Selectfield';
import { TextareaField } from '@/components/TextareaField';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { useEmployees } from '@/hooks/useEmployees';
import { useSurveys } from '@/hooks/useSurveys';
import {
  emptyActionValues,
  todayInput,
  validateAction,
  type ActionFormErrors,
  type ActionFormValues,
} from '@/lib/action-form';
import { getErrorDetails, getErrorMessage } from '@/lib/Api';

// Thèmes proposés (le RH peut aussi en écrire un autre)
const TOPIC_SUGGESTIONS = [
  'Charge de travail',
  'Équilibre vie professionnelle / vie personnelle',
  'Communication',
  'Reconnaissance',
  'Management',
  'Conditions de travail',
  'Stress',
  'Évolution professionnelle',
];

// Formulaire de création et de modification d'une action
export function ActionForm({
  mode,
  initialValues,
  submitLabel,
  cancelHref,
  onSubmit,
}: {
  mode: 'create' | 'edit';
  initialValues?: ActionFormValues;
  submitLabel: string;
  cancelHref: string;
  onSubmit: (values: ActionFormValues) => Promise<void>;
}) {
  const [values, setValues] = useState<ActionFormValues>(initialValues ?? emptyActionValues());
  const [submitted, setSubmitted] = useState(false);
  const [saving, setSaving] = useState(false);
  const [serverError, setServerError] = useState<{ message: string; details: string[] } | null>(null);

  // Responsables possibles : comptes actifs (RH ou employés), 100 au maximum
  const { data: people, isLoading: loadingPeople } = useEmployees({ isActive: 'true', limit: 100 });
  // Sondage lié : seulement à la création, parmi les sondages publiés ou clôturés
  const { data: surveys } = useSurveys();
  const linkableSurveys = surveys?.filter((s) => s.status !== 'DRAFT') ?? [];

  // Les erreurs n'apparaissent qu'après la première tentative d'envoi
  const errors: ActionFormErrors = submitted ? validateAction(values, mode) : {};

  const set = <K extends keyof ActionFormValues>(name: K, value: ActionFormValues[K]) =>
    setValues((v) => ({ ...v, [name]: value }));

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitted(true);
    setServerError(null);
    if (Object.keys(validateAction(values, mode)).length > 0) return;

    setSaving(true);
    try {
      await onSubmit(values);
    } catch (err) {
      setServerError({ message: getErrorMessage(err), details: getErrorDetails(err) });
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
      {serverError && (
        <Alert variant="destructive">
          <AlertCircle />
          <AlertTitle>{serverError.message}</AlertTitle>
          {serverError.details.length > 0 && (
            <AlertDescription>
              <ul className="list-disc pl-4">
                {serverError.details.map((d) => (
                  <li key={d}>{d}</li>
                ))}
              </ul>
            </AlertDescription>
          )}
        </Alert>
      )}

      <FormField
        label="Titre de l’action"
        placeholder="Ex : Mettre en place un point hebdomadaire sur les priorités"
        value={values.title}
        onChange={(e) => set('title', e.target.value)}
        error={errors.title}
        maxLength={200}
      />

      <TextareaField
        label="Objectif"
        optional
        placeholder="Ce que l’action doit améliorer, et comment on saura qu’elle a fonctionné"
        value={values.objective}
        onChange={(e) => set('objective', e.target.value)}
        error={errors.objective}
        maxLength={2000}
      />

      <div className="grid gap-5 sm:grid-cols-2">
        <SelectField
          label="Responsable"
          value={values.ownerId}
          onChange={(e) => set('ownerId', e.target.value)}
          error={errors.ownerId}
          disabled={loadingPeople}
          hint="La personne qui pilote l’action. Elle vise une pratique, jamais un employé."
        >
          <option value="">{loadingPeople ? 'Chargement…' : 'Choisir une personne'}</option>
          {people?.items.map((p) => (
            <option key={p._id} value={p._id}>
              {p.firstName} {p.lastName}
              {p.department ? ` — ${p.department}` : ''}
              {p.role === 'HR_ADMIN' ? ' (RH)' : ''}
            </option>
          ))}
        </SelectField>

        <FormField
          label="Échéance"
          type="date"
          value={values.targetDate}
          min={mode === 'create' ? todayInput() : undefined}
          onChange={(e) => set('targetDate', e.target.value)}
          error={errors.targetDate}
        />
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <FormField
            label="Thème"
            optional
            list="action-topic-suggestions"
            placeholder="Ex : Charge de travail"
            value={values.topic}
            onChange={(e) => set('topic', e.target.value)}
            error={errors.topic}
            maxLength={150}
          />
          <datalist id="action-topic-suggestions">
            {TOPIC_SUGGESTIONS.map((t) => (
              <option key={t} value={t} />
            ))}
          </datalist>
        </div>

        {mode === 'create' && (
          <SelectField
            label="Sondage à l’origine de l’action"
            optional
            value={values.surveyId}
            onChange={(e) => set('surveyId', e.target.value)}
          >
            <option value="">Aucun</option>
            {linkableSurveys.map((s) => (
              <option key={s._id} value={s._id}>
                {s.title}
              </option>
            ))}
          </SelectField>
        )}
      </div>

      <label className="flex cursor-pointer items-start gap-3 rounded-lg border p-4 has-[:checked]:border-primary has-[:checked]:bg-brand-50 has-[:focus-visible]:ring-[3px] has-[:focus-visible]:ring-ring/50">
        <input
          type="checkbox"
          className="mt-0.5 size-4 accent-[var(--primary)]"
          checked={values.visibleToEmployees}
          onChange={(e) => set('visibleToEmployees', e.target.checked)}
        />
        <span className="text-sm">
          <span className="flex items-center gap-1.5 font-medium">
            <Eye aria-hidden="true" className="size-4" /> Partager avec les employés
          </span>
          <span className="mt-0.5 block text-muted-foreground">
            Ils verront le titre, l’objectif, le statut et l’échéance, mais pas le responsable ni les notes de suivi.
            Montrer ce qui change grâce aux sondages encourage la participation.
          </span>
        </span>
      </label>

      <div className="flex flex-col-reverse gap-2 border-t pt-5 sm:flex-row sm:justify-end">
        <ButtonLink href={cancelHref} variant="outline">
          Annuler
        </ButtonLink>
        <Button type="submit" disabled={saving}>
          {saving && <Loader2 aria-hidden="true" className="animate-spin" />}
          {submitLabel}
        </Button>
      </div>
    </form>
  );
}