'use client';

import { AlertCircle, Inbox, Loader2, ShieldCheck } from 'lucide-react';
import { OpenSurveyCard } from '@/components/employee-space/OpenSurveyCard';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/Authcontext';
import { useMySurveys } from '@/hooks/useEmployeeSurveys';
import { getErrorMessage } from '@/lib/Api';

// Accueil employé : les sondages ouverts, ceux à faire en premier
export default function EmployeeHomePage() {
  const { user, organization } = useAuth();
  const { data: surveys, error, isLoading, mutate } = useMySurveys();

  const pending = surveys?.filter((s) => !s.alreadySubmitted) ?? [];
  const answered = surveys?.filter((s) => s.alreadySubmitted) ?? [];

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-8">
      <header>
        <h1 className="text-2xl font-semibold">Bonjour {user?.firstName}</h1>
        <p className="mt-1 max-w-2xl text-muted-foreground">
          Voici les sondages ouverts{organization ? ` chez ${organization.name}` : ''}. Vos réponses aident à
          améliorer le bien-être de chacun.
        </p>
      </header>

      {isLoading && (
        <div className="flex justify-center py-12">
          <Loader2 className="size-6 animate-spin text-muted-foreground" aria-label="Chargement des sondages" />
        </div>
      )}

      {error && (
        <Alert variant="destructive">
          <AlertCircle />
          <AlertTitle>Impossible de charger vos sondages</AlertTitle>
          <AlertDescription>
            <p>{getErrorMessage(error)}</p>
            <Button variant="outline" size="sm" className="mt-3" onClick={() => mutate()}>
              Réessayer
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {surveys && (
        <>
          <section aria-labelledby="pending-title" className="flex flex-col gap-4">
            <h2 id="pending-title" className="text-lg font-semibold">
              À répondre <span className="text-muted-foreground">({pending.length})</span>
            </h2>
            {pending.length === 0 ? (
              <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed py-10 text-center">
                <Inbox aria-hidden="true" className="size-8 text-muted-foreground" />
                <p className="font-medium">Aucun sondage en attente</p>
                <p className="text-sm text-muted-foreground">
                  {answered.length > 0
                    ? 'Vous avez répondu à tous les sondages ouverts. Merci !'
                    : 'Les RH n’ont pas de sondage ouvert pour le moment.'}
                </p>
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {pending.map((s) => (
                  <OpenSurveyCard key={s._id} survey={s} />
                ))}
              </div>
            )}
          </section>

          {answered.length > 0 && (
            <section aria-labelledby="answered-title" className="flex flex-col gap-4">
              <h2 id="answered-title" className="text-lg font-semibold">
                Déjà répondu <span className="text-muted-foreground">({answered.length})</span>
              </h2>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {answered.map((s) => (
                  <OpenSurveyCard key={s._id} survey={s} />
                ))}
              </div>
            </section>
          )}
        </>
      )}

      <aside className="flex items-start gap-3 rounded-xl border bg-card p-4 text-sm">
        <ShieldCheck aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-brand-600" />
        <div>
          <p className="font-medium">Votre confidentialité</p>
          <p className="mt-1 text-muted-foreground">
            Chaque sondage indique s’il est <strong>anonyme</strong> ou <strong>identifié</strong> avant que vous
            répondiez. Pour un sondage anonyme, vos réponses ne sont jamais reliées à votre compte, et les RH ne voient
            les résultats qu’à partir d’un nombre minimum de réponses.
          </p>
        </div>
      </aside>
    </div>
  );
}