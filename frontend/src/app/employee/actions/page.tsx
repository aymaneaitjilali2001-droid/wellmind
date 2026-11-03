'use client';

import { AlertCircle, CalendarDays, CircleCheck, Loader2, Sprout } from 'lucide-react';
import { ActionStatusBadge } from '@/components/actions/ActionStatusBadge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { useSharedActions } from '@/hooks/useEmployeeSurveys';
import { getErrorMessage } from '@/lib/Api';
import type { EmployeeAction } from '@/types/employee-survey';

const dateFormat = new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });

function SharedActionCard({ action }: { action: EmployeeAction }) {
  const done = action.status === 'DONE';
  return (
    <article className="flex flex-col rounded-xl border bg-card p-5">
      <div className="flex flex-wrap items-center gap-2">
        <ActionStatusBadge status={action.status} />
        {action.topic && <span className="text-xs text-muted-foreground">{action.topic}</span>}
      </div>
      <h3 className="mt-3 font-semibold leading-snug">{action.title}</h3>
      {action.objective && <p className="mt-1 text-sm whitespace-pre-line text-muted-foreground">{action.objective}</p>}
      <p className="mt-auto flex items-center gap-1.5 pt-4 text-sm text-muted-foreground">
        {done ? (
          <>
            <CircleCheck aria-hidden="true" className="size-4 text-brand-600" />
            Terminée le {dateFormat.format(new Date(action.completedAt ?? action.targetDate))}
          </>
        ) : (
          <>
            <CalendarDays aria-hidden="true" className="size-4" />
            Prévue pour le {dateFormat.format(new Date(action.targetDate))}
          </>
        )}
      </p>
    </article>
  );
}

// Actions que les RH ont choisi de partager : ce qui change grâce aux sondages
export default function SharedActionsPage() {
  const { data, error, isLoading, mutate } = useSharedActions();

  const ongoing = data?.filter((a) => a.status !== 'DONE') ?? [];
  const done = data?.filter((a) => a.status === 'DONE') ?? [];

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-8">
      <header>
        <h1 className="text-2xl font-semibold">Ce qui change</h1>
        <p className="mt-1 max-w-2xl text-muted-foreground">
          Les actions mises en place par les RH à partir des résultats des sondages. Vos réponses comptent : voici ce
          qu’elles ont permis de lancer.
        </p>
      </header>

      {isLoading && (
        <div className="flex justify-center py-12">
          <Loader2 className="size-6 animate-spin text-muted-foreground" aria-label="Chargement des actions" />
        </div>
      )}

      {error && (
        <Alert variant="destructive">
          <AlertCircle />
          <AlertTitle>Impossible de charger les actions</AlertTitle>
          <AlertDescription>
            <p>{getErrorMessage(error)}</p>
            <Button variant="outline" size="sm" className="mt-3" onClick={() => mutate()}>
              Réessayer
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {data && data.length === 0 && (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed py-12 text-center">
          <Sprout aria-hidden="true" className="size-8 text-muted-foreground" />
          <p className="font-medium">Aucune action partagée pour l’instant</p>
          <p className="max-w-sm text-sm text-muted-foreground">
            Les actions décidées après les sondages apparaîtront ici.
          </p>
        </div>
      )}

      {ongoing.length > 0 && (
        <section aria-labelledby="ongoing-title" className="flex flex-col gap-4">
          <h2 id="ongoing-title" className="text-lg font-semibold">
            En cours et à venir <span className="text-muted-foreground">({ongoing.length})</span>
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {ongoing.map((a) => (
              <SharedActionCard key={a._id} action={a} />
            ))}
          </div>
        </section>
      )}

      {done.length > 0 && (
        <section aria-labelledby="done-title" className="flex flex-col gap-4">
          <h2 id="done-title" className="text-lg font-semibold">
            Réalisées <span className="text-muted-foreground">({done.length})</span>
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {done.map((a) => (
              <SharedActionCard key={a._id} action={a} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}