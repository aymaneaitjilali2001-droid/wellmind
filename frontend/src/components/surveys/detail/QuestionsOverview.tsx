import { TYPE_LABELS } from '@/components/surveys/editor/QuestionCard';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { Question } from '@/types/survey';

// Questions du sondage en lecture seule, telles que les employés les verront
export function QuestionsOverview({ questions }: { questions: Question[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Questions ({questions.length})</CardTitle>
        <CardDescription>Dans l’ordre où elles sont présentées aux employés.</CardDescription>
      </CardHeader>
      <CardContent>
        {questions.length === 0 ? (
          <p className="text-sm text-muted-foreground">Aucune question pour l’instant.</p>
        ) : (
          <ol className="flex flex-col divide-y">
            {questions.map((q, index) => (
              <li key={q._id} className="flex gap-3 py-4 first:pt-0 last:pb-0">
                <span
                  aria-hidden="true"
                  className="flex size-7 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold"
                >
                  {index + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="font-medium">{q.label}</p>
                  <div className="mt-1.5 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                    <span className="rounded-full bg-muted px-2 py-0.5">{TYPE_LABELS[q.type]}</span>
                    <span>{q.isRequired ? 'Obligatoire' : 'Facultative'}</span>
                    {q.type === 'RATING' && (
                      <span>
                        · De {q.scaleMin} à {q.scaleMax}
                        {(q.minLabel || q.maxLabel) && ` (${q.minLabel ?? '…'} → ${q.maxLabel ?? '…'})`}
                      </span>
                    )}
                  </div>
                  {q.type === 'CHOICE' && (
                    <ul className="mt-2 flex flex-wrap gap-1.5" aria-label="Options">
                      {q.options.map((o) => (
                        <li key={o._id} className="rounded-md border px-2 py-0.5 text-xs">
                          {o.label}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </li>
            ))}
          </ol>
        )}
      </CardContent>
    </Card>
  );
}