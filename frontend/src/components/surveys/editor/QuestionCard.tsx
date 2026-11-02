'use client';

import { ArrowDown, ArrowUp, Copy, Info, Plus, Trash2, X } from 'lucide-react';
import { FormField } from '@/components/FormField';
import { SelectField } from '@/components/Selectfield';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import {
  changeQuestionType,
  LIMITS,
  newKey,
  SCALE_PRESETS,
  type DraftQuestion,
  type QuestionErrors,
} from '@/lib/survey-editor';
import type { QuestionType } from '@/types/survey';

export const TYPE_LABELS: Record<QuestionType, string> = {
  RATING: 'Échelle de notation',
  CHOICE: 'Choix unique',
  TEXT: 'Réponse libre',
};

// Une question de l'éditeur : intitulé, type, réglages propres au type, et actions
// (monter, descendre, dupliquer, supprimer). readOnly = sondage publié.
export function QuestionCard({
  question,
  index,
  total,
  errors = {},
  readOnly,
  onChange,
  onMove,
  onDuplicate,
  onRemove,
}: {
  question: DraftQuestion;
  index: number;
  total: number;
  errors?: QuestionErrors;
  readOnly: boolean;
  onChange: (next: DraftQuestion) => void;
  onMove: (direction: -1 | 1) => void;
  onDuplicate: () => void;
  onRemove: () => void;
}) {
  const q = question;
  const set = (patch: Partial<DraftQuestion>) => onChange({ ...q, ...patch });
  const number = index + 1;

  // Échelle actuelle absente des préréglages (ancien sondage) : on l'ajoute à la liste
  const scaleValue = `${q.scaleMin}-${q.scaleMax}`;
  const presets = SCALE_PRESETS.some((p) => `${p.min}-${p.max}` === scaleValue)
    ? SCALE_PRESETS
    : [...SCALE_PRESETS, { min: q.scaleMin, max: q.scaleMax }];

  return (
    <article
      aria-label={`Question ${number}`}
      className={cn('rounded-xl border bg-card p-5 shadow-xs', Object.keys(errors).length > 0 && 'border-destructive/50')}
    >
      {/* En-tête : numéro et actions */}
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-semibold text-muted-foreground">Question {number}</p>
        {!readOnly && (
          <div className="flex items-center gap-1">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => onMove(-1)}
              disabled={index === 0}
              aria-label={`Monter la question ${number}`}
            >
              <ArrowUp aria-hidden="true" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => onMove(1)}
              disabled={index === total - 1}
              aria-label={`Descendre la question ${number}`}
            >
              <ArrowDown aria-hidden="true" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={onDuplicate}
              disabled={total >= LIMITS.questions}
              aria-label={`Dupliquer la question ${number}`}
            >
              <Copy aria-hidden="true" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={onRemove}
              aria-label={`Supprimer la question ${number}`}
              className="text-destructive hover:text-destructive"
            >
              <Trash2 aria-hidden="true" />
            </Button>
          </div>
        )}
      </div>

      <div className="mt-3 flex flex-col gap-4">
        <div className="grid gap-4 md:grid-cols-3">
          <FormField
            label="Intitulé de la question"
            className="md:col-span-2"
            placeholder="Ex : Comment évaluez-vous votre charge de travail ce mois-ci ?"
            value={q.label}
            error={errors.label}
            disabled={readOnly}
            onChange={(e) => set({ label: e.target.value })}
          />
          <SelectField
            label="Type"
            value={q.type}
            disabled={readOnly}
            onChange={(e) => onChange(changeQuestionType(q, e.target.value as QuestionType))}
          >
            {(Object.keys(TYPE_LABELS) as QuestionType[]).map((type) => (
              <option key={type} value={type}>
                {TYPE_LABELS[type]}
              </option>
            ))}
          </SelectField>
        </div>

        {/* Réglages propres à chaque type */}
        {q.type === 'RATING' && (
          <div className="flex flex-col gap-3 rounded-lg bg-muted/40 p-4">
            <div className="grid gap-4 sm:grid-cols-3">
              <SelectField
                label="Échelle"
                value={scaleValue}
                disabled={readOnly}
                onChange={(e) => {
                  const [min, max] = e.target.value.split('-').map(Number);
                  set({ scaleMin: min, scaleMax: max });
                }}
              >
                {presets.map((p) => (
                  <option key={`${p.min}-${p.max}`} value={`${p.min}-${p.max}`}>
                    De {p.min} à {p.max}
                  </option>
                ))}
              </SelectField>
              <FormField
                label={`Libellé du ${q.scaleMin}`}
                optional
                placeholder="Ex : Pas du tout satisfait"
                value={q.minLabel}
                disabled={readOnly}
                error={errors.scaleLabels}
                onChange={(e) => set({ minLabel: e.target.value })}
              />
              <FormField
                label={`Libellé du ${q.scaleMax}`}
                optional
                placeholder="Ex : Très satisfait"
                value={q.maxLabel}
                disabled={readOnly}
                onChange={(e) => set({ maxLabel: e.target.value })}
              />
            </div>
            {/* Aperçu de l'échelle telle que l'employé la verra */}
            <div aria-hidden="true" className="flex flex-wrap items-center gap-1.5">
              {Array.from({ length: q.scaleMax - q.scaleMin + 1 }, (_, i) => (
                <span
                  key={i}
                  className="flex size-8 items-center justify-center rounded-md border bg-background text-xs text-muted-foreground"
                >
                  {q.scaleMin + i}
                </span>
              ))}
            </div>
          </div>
        )}

        {q.type === 'CHOICE' && (
          <fieldset disabled={readOnly} className="flex flex-col gap-2 rounded-lg bg-muted/40 p-4">
            <legend className="sr-only">Options de la question {number}</legend>
            <p className="text-sm font-medium">Options</p>
            {q.options.map((option, i) => (
              <div key={option.key} className="flex items-center gap-2">
                <span aria-hidden="true" className="size-4 shrink-0 rounded-full border-2 border-muted-foreground/40" />
                <Input
                  aria-label={`Option ${i + 1}`}
                  placeholder={`Option ${i + 1}`}
                  value={option.label}
                  maxLength={LIMITS.option}
                  onChange={(e) =>
                    set({ options: q.options.map((o) => (o.key === option.key ? { ...o, label: e.target.value } : o)) })
                  }
                />
                {!readOnly && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => set({ options: q.options.filter((o) => o.key !== option.key) })}
                    disabled={q.options.length <= 2}
                    aria-label={`Retirer l’option ${i + 1}`}
                  >
                    <X aria-hidden="true" />
                  </Button>
                )}
              </div>
            ))}
            {errors.options && <p className="text-xs text-destructive">{errors.options}</p>}
            {!readOnly && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="self-start"
                onClick={() => set({ options: [...q.options, { key: newKey(), label: '' }] })}
                disabled={q.options.length >= LIMITS.options}
              >
                <Plus aria-hidden="true" /> Ajouter une option
              </Button>
            )}
          </fieldset>
        )}

        {q.type === 'TEXT' && (
          <p className="flex items-start gap-2 rounded-lg bg-muted/40 p-4 text-sm text-muted-foreground">
            <Info aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
            Les réponses écrites sont désidentifiées (noms, e-mails et téléphones masqués) avant de pouvoir être
            analysées par l’IA.
          </p>
        )}

        <label className={cn('flex w-fit items-center gap-2 text-sm', readOnly ? 'cursor-not-allowed' : 'cursor-pointer')}>
          <input
            type="checkbox"
            className="size-4 accent-brand-600"
            checked={q.isRequired}
            disabled={readOnly}
            onChange={(e) => set({ isRequired: e.target.checked })}
          />
          Réponse obligatoire
        </label>
      </div>
    </article>
  );
}