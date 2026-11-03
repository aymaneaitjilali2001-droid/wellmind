'use client';

import { AlertCircle, CircleCheck, History, Loader2, ShieldCheck } from 'lucide-react';
import { AnonymityBadge } from '@/components/employee-space/AnonymityBadge';
import { ButtonLink } from '@/components/Buttonlink';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { useMyParticipations } from '@/hooks/useEmployeeSurveys';
import { getErrorMessage } from '@/lib/Api';

const dateFormat = new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });

// Historique : les sondages auxquels l'employé a répondu.
// Le backend ne renvoie que le titre et le jour : jamais le contenu des réponses.
export default function HistoryPage() {
  const { data, error, isLoading, mutate } = useMyParticipations();

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <header>
        <h1 className="text-2xl font-semibold">Mon historique</h1>
        <p className="mt-1 text-muted-foreground">Les sondages auxquels vous avez participé.</p>
      </header>

      <aside className="flex items-start gap-3 rounded-xl border bg-card p-4 text-sm">
        <ShieldCheck aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-brand-600" />
        <p className="text-muted-foreground">
          Seule votre participation est enregistrée ici, jamais le contenu de vos réponses. Pour un sondage anonyme,
          vos réponses ne sont reliées à votre compte nulle part : même WellMind ne peut pas les retrouver.
        </p>
      </aside>

      {isLoading && (
        <div className="flex justify-center py-12">
          <Loader2 className="size-6 animate-spin text-muted-foreground" aria-label="Chargement de l’historique" />
        </div>
      )}

      {error && (
        <Alert variant="destructive">
          <AlertCircle />
          <AlertTitle>Impossible de charger votre historique</AlertTitle>
          <AlertDescription>
            <p>{getErrorMessage(error)}</p>
            <Button variant="outline" size="sm" className="mt-3" onClick={() => mutate()}>
              Réessayer
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {data &&
        (data.length === 0 ? (
          <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed py-12 text-center">
            <History aria-hidden="true" className="size-8 text-muted-foreground" />
            <p className="font-medium">Vous n’avez encore répondu à aucun sondage</p>
            <ButtonLink href="/employee" variant="outline" className="mt-1">
              Voir les sondages ouverts
            </ButtonLink>
          </div>
        ) : (
          <ul className="flex flex-col divide-y rounded-xl border bg-card">
            {data.map((p) => (
              <li key={p.surveyId} className="flex flex-col gap-2 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <p className="font-medium">{p.title}</p>
                  <p className="mt-0.5 flex items-center gap-1.5 text-sm text-muted-foreground">
                    <CircleCheck aria-hidden="true" className="size-4 text-brand-600" />
                    Répondu le {dateFormat.format(new Date(p.submittedOn))}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <AnonymityBadge isAnonymous={p.isAnonymous} />
                  <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
                    {p.surveyStatus === 'CLOSED' ? 'Clôturé' : 'En cours'}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        ))}
    </div>
  );
}