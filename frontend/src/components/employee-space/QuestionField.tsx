'use client';

import { cn } from '@/lib/utils';
import { MAX_TEXT_LENGTH, type AnswerValue } from '@/lib/employee-answers';
import type { EmployeeQuestion } from '@/types/employee-survey';

// Classes d'une « pastille » de choix : vraie case radio cachée visuellement, mais accessible
// au clavier (flèches) et aux lecteurs d'écran. Le style suit l'état coché / focus.
const pill =
  'flex cursor-pointer items-center justify-center rounded-lg border bg-background text-sm font-medium transition-colors ' +
  'hover:border-primary/60 has-[:checked]:border-primary has-[:checked]:bg-primary has-[:checked]:text-primary-foreground ' +
  'has-[:focus-visible]:ring-[3px] has-[:focus-visible]:ring-ring/50';

// Une question du formulaire employé, selon son type
export function QuestionField({
  question: q,
  index,
  value,
  error,
  onChange,
}: {
  question: EmployeeQuestion;
  index: number;
  value: AnswerValue | undefined;
  error?: string;
  onChange: (value: AnswerValue) => void;
}) {
  const titleId = `q-${q._id}-title`;
  const errorId = `q-${q._id}-error`;

  return (
    <fieldset
      id={`question-${q._id}`}
      aria-describedby={error ? errorId : undefined}
      className={cn('scroll-mt-24 rounded-xl border bg-card p-5', error && 'border-destructive')}
    >
      <legend id={titleId} className="sr-only">
        {q.label}
      </legend>
      <p aria-hidden="true" className="font-medium">
        <span className="text-muted-foreground">{index + 1}. </span>
        {q.label}
        {q.isRequired ? (
          <span className="ml-1 text-destructive">*</span>
        ) : (
          <span className="ml-2 text-xs font-normal text-muted-foreground">(facultative)</span>
        )}
      </p>

      <div className="mt-4">
        {/* ---------- Note ---------- */}
        {q.type === 'RATING' && q.scaleMin !== undefined && q.scaleMax !== undefined && (
          <>
            <div
              className="grid gap-2"
              style={{ gridTemplateColumns: `repeat(${q.scaleMax - q.scaleMin + 1}, minmax(0, 1fr))` }}
            >
              {Array.from({ length: q.scaleMax - q.scaleMin + 1 }, (_, i) => q.scaleMin! + i).map((n) => (
                <label key={n} className={cn(pill, 'h-11')}>
                  <input
                    type="radio"
                    name={q._id}
                    value={n}
                    checked={value?.rating === n}
                    onChange={() => onChange({ rating: n })}
                    className="sr-only"
                    aria-label={
                      n === q.scaleMin && q.minLabel
                        ? `${n} : ${q.minLabel}`
                        : n === q.scaleMax && q.maxLabel
                          ? `${n} : ${q.maxLabel}`
                          : String(n)
                    }
                  />
                  {n}
                </label>
              ))}
            </div>
            {(q.minLabel || q.maxLabel) && (
              <div aria-hidden="true" className="mt-2 flex justify-between gap-4 text-xs text-muted-foreground">
                <span>{q.minLabel}</span>
                <span className="text-right">{q.maxLabel}</span>
              </div>
            )}
          </>
        )}

        {/* ---------- Choix ---------- */}
        {q.type === 'CHOICE' && (
          <div className="flex flex-col gap-2">
            {q.options?.map((o) => (
              <label
                key={o._id}
                className="flex cursor-pointer items-center gap-3 rounded-lg border px-4 py-3 text-sm transition-colors hover:bg-muted/50 has-[:checked]:border-primary has-[:checked]:bg-brand-50 has-[:focus-visible]:ring-[3px] has-[:focus-visible]:ring-ring/50"
              >
                <input
                  type="radio"
                  name={q._id}
                  value={o._id}
                  checked={value?.optionId === o._id}
                  onChange={() => onChange({ optionId: o._id })}
                  className="size-4 accent-[var(--primary)]"
                />
                {o.label}
              </label>
            ))}
          </div>
        )}

        {/* ---------- Texte libre ---------- */}
        {q.type === 'TEXT' && (
          <>
            <textarea
              aria-labelledby={titleId}
              aria-invalid={error ? true : undefined}
              value={value?.text ?? ''}
              onChange={(e) => onChange({ text: e.target.value })}
              rows={4}
              maxLength={MAX_TEXT_LENGTH}
              placeholder="Votre réponse…"
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-xs outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 aria-invalid:border-destructive"
            />
            <div className="mt-1.5 flex justify-between gap-4 text-xs text-muted-foreground">
              <span>Évitez de citer des noms : ils sont masqués automatiquement avant toute analyse.</span>
              <span className="shrink-0 tabular-nums">
                {(value?.text ?? '').length} / {MAX_TEXT_LENGTH}
              </span>
            </div>
          </>
        )}
      </div>

      {error && (
        <p id={errorId} className="mt-3 text-sm text-destructive">
          {error}
        </p>
      )}
    </fieldset>
  );
}