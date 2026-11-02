'use client';

import { useState, type FormEvent } from 'react';
import Link from 'next/link';
import { AlertCircle, ArrowRight, CircleCheck, ListPlus, Loader2, Undo2, X } from 'lucide-react';
import { FormField } from '@/components/FormField';
import { SelectField } from '@/components/Selectfield';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { useEmployees } from '@/hooks/useEmployees';
import { emptyActionValues, todayInput, validateAction, type ActionFormErrors } from '@/lib/action-form';
import { getErrorMessage } from '@/lib/Api';
import { dateInputToEndISO } from '@/lib/survey-dates';
import { createActionFromRecommendation, reviewRecommendation } from '@/services/analyses';
import type { Recommendation } from '@/types/analysis';

// Mini-formulaire : transformer la recommandation en action (titre, responsable, échéance)
function CreateActionPanel({
  analysisId,
  recommendation,
  onCreated,
  onCancel,
}: {
  analysisId: string;
  recommendation: Recommendation;
  onCreated: () => Promise<void>;
  onCancel: () => void;
}) {
  const [values, setValues] = useState({
    ...emptyActionValues(),
    title: recommendation.content.slice(0, 200),
  });
  const [submitted, setSubmitted] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { data: people, isLoading } = useEmployees({ isActive: 'true', limit: 100 });

  // Mêmes règles que le formulaire d'action complet
  const errors: ActionFormErrors = submitted ? validateAction(values, 'create') : {};

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitted(true);
    setError(null);
    if (Object.keys(validateAction(values, 'create')).length > 0) return;

    setSaving(true);
    try {
      await createActionFromRecommendation({
        analysisId,
        recommendationId: recommendation._id,
        title: values.title.trim(),
        ownerId: values.ownerId,
        targetDate: dateInputToEndISO(values.targetDate) as string,
        visibleToEmployees: values.visibleToEmployees,
      });
      await onCreated();
    } catch (err) {
      setError(getErrorMessage(err));
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} noValidate className="mt-3 flex flex-col gap-4 rounded-lg border bg-muted/30 p-4">
      <p className="text-sm font-medium">Nouvelle action à partir de cette recommandation</p>
      {error && (
        <Alert variant="destructive">
          <AlertCircle />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      <FormField
        label="Titre de l’action"
        value={values.title}
        onChange={(e) => setValues((v) => ({ ...v, title: e.target.value }))}
        error={errors.title}
        maxLength={200}
      />
      <div className="grid gap-4 sm:grid-cols-2">
        <SelectField
          label="Responsable"
          value={values.ownerId}
          onChange={(e) => setValues((v) => ({ ...v, ownerId: e.target.value }))}
          error={errors.ownerId}
          disabled={isLoading}
        >
          <option value="">{isLoading ? 'Chargement…' : 'Choisir une personne'}</option>
          {people?.items.map((p) => (
            <option key={p._id} value={p._id}>
              {p.firstName} {p.lastName}
              {p.department ? ` — ${p.department}` : ''}
            </option>
          ))}
        </SelectField>
        <FormField
          label="Échéance"
          type="date"
          min={todayInput()}
          value={values.targetDate}
          onChange={(e) => setValues((v) => ({ ...v, targetDate: e.target.value }))}
          error={errors.targetDate}
        />
      </div>
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          className="size-4 accent-[var(--primary)]"
          checked={values.visibleToEmployees}
          onChange={(e) => setValues((v) => ({ ...v, visibleToEmployees: e.target.checked }))}
        />
        Partager avec les employés
      </label>
      <p className="text-xs text-muted-foreground">
        Le thème et l’explication de l’IA sont repris automatiquement dans l’action (modifiables ensuite).
      </p>
      <div className="flex gap-2">
        <Button type="submit" size="sm" disabled={saving}>
          {saving && <Loader2 aria-hidden="true" className="animate-spin" />}
          Créer l’action
        </Button>
        <Button type="button" size="sm" variant="outline" onClick={onCancel} disabled={saving}>
          Annuler
        </Button>
      </div>
    </form>
  );
}

// Une recommandation de l'IA, avec ce que le RH peut en faire
export function RecommendationItem({
  analysisId,
  recommendation: rec,
  onChanged,
}: {
  analysisId: string;
  recommendation: Recommendation;
  onChanged: () => Promise<void>;
}) {
  const [creating, setCreating] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const review = async (status: 'PROPOSED' | 'REJECTED') => {
    setBusy(true);
    setError(null);
    try {
      await reviewRecommendation(analysisId, rec._id, { status });
      await onChanged();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const rejected = rec.status === 'REJECTED';

  return (
    <li className={rejected ? 'rounded-lg border border-dashed p-3 opacity-70' : 'rounded-lg border p-3'}>
      <p className={rejected ? 'text-sm font-medium line-through' : 'text-sm font-medium'}>
        {rec.content}
        {rec.editedByHr && <span className="ml-1 text-xs font-normal text-muted-foreground">(reformulée par les RH)</span>}
      </p>
      {rec.rationale && <p className="mt-1 text-xs text-muted-foreground">Pourquoi : {rec.rationale}</p>}

      {error && (
        <Alert variant="destructive" className="mt-2">
          <AlertCircle />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="mt-3 flex flex-wrap items-center gap-2">
        {rec.actionId ? (
          <>
            <span className="inline-flex items-center gap-1 text-xs font-medium text-brand-700">
              <CircleCheck aria-hidden="true" className="size-4" /> Action créée
            </span>
            <Link
              href={`/hr/actions/${rec.actionId}`}
              className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
            >
              Voir l’action <ArrowRight aria-hidden="true" className="size-3.5" />
            </Link>
          </>
        ) : rejected ? (
          <>
            <span className="text-xs text-muted-foreground">Rejetée</span>
            <Button size="sm" variant="ghost" onClick={() => review('PROPOSED')} disabled={busy}>
              <Undo2 aria-hidden="true" /> Annuler le rejet
            </Button>
          </>
        ) : (
          !creating && (
            <>
              <Button size="sm" onClick={() => setCreating(true)} disabled={busy}>
                <ListPlus aria-hidden="true" /> Créer une action
              </Button>
              <Button size="sm" variant="ghost" onClick={() => review('REJECTED')} disabled={busy}>
                {busy ? <Loader2 aria-hidden="true" className="animate-spin" /> : <X aria-hidden="true" />} Rejeter
              </Button>
            </>
          )
        )}
      </div>

      {creating && !rec.actionId && (
        <CreateActionPanel
          analysisId={analysisId}
          recommendation={rec}
          onCancel={() => setCreating(false)}
          onCreated={async () => {
            setCreating(false);
            await onChanged();
          }}
        />
      )}
    </li>
  );
}