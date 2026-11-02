'use client';

import { isAxiosError } from 'axios';
import { AlertCircle, ChartColumn, Loader2, MessageSquare, ShieldAlert } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useSurveyStats } from '@/hooks/useStats';
import { getErrorMessage, type ApiErrorBody } from '@/lib/api';
import { getScoreLevel } from '@/lib/score';
import { cn } from '@/lib/utils';
import type { ChoiceStat, QuestionStat, RatingStat } from '@/types/stats';

const pct = (part: number, total: number) => (total ? Math.round((part / total) * 100) : 0);

// Une ligne « libellé — barre — valeur ». Une seule couleur : la valeur est toujours écrite.
function BarRow({ label, value, width, barClass = 'bg-primary' }: { label: string; value: string; width: number; barClass?: string }) {
  return (
    <div className="grid grid-cols-[minmax(0,8rem)_1fr_4.5rem] items-center gap-3 text-sm">
      <span className="truncate text-muted-foreground" title={label}>
        {label}
      </span>
      <div className="h-2 overflow-hidden rounded-full bg-muted" aria-hidden="true">
        <div className={cn('h-full rounded-full', barClass)} style={{ width: `${width}%` }} />
      </div>
      <span className="text-right text-xs tabular-nums">{value}</span>
    </div>
  );
}

function RatingResult({ q }: { q: RatingStat }) {
  const max = Math.max(1, ...q.distribution.map((d) => d.count));
  const labelFor = (v: number) =>
    v === q.scaleMin && q.minLabel ? `${v} · ${q.minLabel}` : v === q.scaleMax && q.maxLabel ? `${v} · ${q.maxLabel}` : String(v);

  return (
    <>
      <p className="text-sm">
        Moyenne{' '}
        <strong className="text-base tabular-nums">{q.average === null ? '—' : q.average.toLocaleString('fr-FR')}</strong>
        <span className="text-muted-foreground"> / {q.scaleMax}</span>
      </p>
      <div className="mt-3 flex flex-col gap-1.5">
        {/* Note la plus haute en premier */}
        {[...q.distribution].reverse().map((d) => (
          <BarRow
            key={d.value}
            label={labelFor(d.value)}
            width={(d.count / max) * 100}
            value={`${d.count} · ${pct(d.count, q.answered)} %`}
          />
        ))}
      </div>
    </>
  );
}

function ChoiceResult({ q }: { q: ChoiceStat }) {
  return (
    <div className="mt-1 flex flex-col gap-1.5">
      {[...q.options]
        .sort((a, b) => b.count - a.count)
        .map((o) => (
          <BarRow key={o.optionId} label={o.label} width={o.percent} value={`${o.count} · ${Math.round(o.percent)} %`} />
        ))}
    </div>
  );
}

function QuestionResult({ q, index }: { q: QuestionStat; index: number }) {
  return (
    <li className="py-4 first:pt-0 last:pb-0">
      <p className="font-medium">
        <span className="text-muted-foreground">{index + 1}. </span>
        {q.label}
      </p>
      <p className="mt-0.5 mb-2 text-xs text-muted-foreground">
        {q.answered} réponse{q.answered > 1 ? 's' : ''}
      </p>
      {q.type === 'RATING' && <RatingResult q={q} />}
      {q.type === 'CHOICE' && <ChoiceResult q={q} />}
      {q.type === 'TEXT' && (
        <p className="flex items-center gap-2 text-sm text-muted-foreground">
          <MessageSquare aria-hidden="true" className="size-4" />
          Commentaires écrits : leur contenu n’est jamais affiché tel quel. Les thèmes ressortent dans l’analyse IA.
        </p>
      )}
    </li>
  );
}

// Résultats chiffrés d'un sondage clôturé (calculés par le backend)
export function SurveyResultsCard({ surveyId }: { surveyId: string }) {
  const { data: stats, error, isLoading, mutate } = useSurveyStats(surveyId);

  // 422 = seuil non atteint : message de confidentialité, pas une panne
  const belowThreshold = isAxiosError<ApiErrorBody>(error) && error.response?.status === 422;
  const details = belowThreshold
    ? ((error.response?.data?.details ?? {}) as { responseCount?: number; threshold?: number })
    : {};

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <ChartColumn aria-hidden="true" className="size-4" /> Résultats
        </CardTitle>
        <CardDescription>Chiffres agrégés uniquement : aucune réponse individuelle n’est affichée.</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-6">
        {isLoading && <Loader2 className="size-5 animate-spin self-center text-muted-foreground" aria-label="Chargement des résultats" />}

        {belowThreshold && (
          <p className="flex items-start gap-2 rounded-lg bg-amber-50 p-4 text-sm text-amber-900">
            <ShieldAlert aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
            Résultats masqués pour protéger la confidentialité :{' '}
            {details.responseCount !== undefined && details.threshold !== undefined
              ? `${details.responseCount} réponse${details.responseCount > 1 ? 's' : ''} reçue${details.responseCount > 1 ? 's' : ''}, ${details.threshold} minimum.`
              : 'pas assez de réponses.'}
          </p>
        )}

        {error && !belowThreshold && (
          <Alert variant="destructive">
            <AlertCircle />
            <AlertTitle>Impossible de charger les résultats</AlertTitle>
            <AlertDescription>
              <p>{getErrorMessage(error)}</p>
              <Button variant="outline" size="sm" className="mt-3" onClick={() => mutate()}>
                Réessayer
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {stats && (
          <>
            {/* Score global */}
            {stats.score !== null && (
              <div className="flex flex-wrap items-end gap-x-4 gap-y-2 rounded-lg bg-muted/40 p-4">
                <div>
                  <p className="text-sm text-muted-foreground">Score de bien-être</p>
                  <p className="text-4xl font-semibold tabular-nums">
                    {stats.score}
                    <span className="text-lg font-normal text-muted-foreground"> / 100</span>
                  </p>
                </div>
                <span className={cn('mb-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium', getScoreLevel(stats.score).className)}>
                  {getScoreLevel(stats.score).label}
                </span>
                <p className="w-full text-xs text-muted-foreground">
                  Moyenne de toutes les notes, ramenées sur 100 · {stats.responseCount} réponses
                </p>
              </div>
            )}

            {/* Résultats par question */}
            <ol className="flex flex-col divide-y">
              {stats.questions.map((q, i) => (
                <QuestionResult key={q.questionId} q={q} index={i} />
              ))}
            </ol>

            {/* Par service */}
            {(stats.byDepartment.length > 0 || stats.hiddenDepartments > 0) && (
              <div className="rounded-lg border p-4">
                <h3 className="text-sm font-medium">Score par service</h3>
                <div className="mt-3 flex flex-col gap-1.5">
                  {stats.byDepartment.map((d) => (
                    <BarRow
                      key={d.department}
                      label={d.department}
                      width={d.score ?? 0}
                      barClass={d.score === null ? 'bg-muted' : getScoreLevel(d.score).bar}
                      value={d.score === null ? '—' : `${d.score} / 100`}
                    />
                  ))}
                </div>
                {stats.hiddenDepartments > 0 && (
                  <p className="mt-3 flex items-start gap-2 text-xs text-muted-foreground">
                    <ShieldAlert aria-hidden="true" className="mt-0.5 size-3.5 shrink-0" />
                    {stats.hiddenDepartments} service{stats.hiddenDepartments > 1 ? 's' : ''} masqué
                    {stats.hiddenDepartments > 1 ? 's' : ''} : trop peu de réponses pour garantir l’anonymat.
                  </p>
                )}
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}