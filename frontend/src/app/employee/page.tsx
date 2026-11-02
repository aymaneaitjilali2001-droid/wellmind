'use client';

import { AlertCircle, ArrowRight, CalendarClock, CheckCircle2, ClipboardList, Eye, EyeOff, Loader2 } from 'lucide-react';
import { ButtonLink } from '@/components/Buttonlink';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/context/Authcontext';
import { getErrorMessage } from '@/lib/Api';
import { useApi } from '@/lib/Swr';

// Un sondage tel que renvoyé par GET /api/employee/surveys
interface EmployeeSurvey {
  _id: string;
  title: string;
  description?: string;
  topic?: string;
  isAnonymous: boolean;
  startDate: string;
  endDate: string;
  questionCount: number;
  alreadySubmitted: boolean;
}

const formatDate = (date: string) =>
  new Date(date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });

function SurveyCard({ survey }: { survey: EmployeeSurvey }) {
  return (
    <Card>
      <CardHeader>
        <div className="mb-1 flex flex-wrap items-center gap-2 text-xs font-medium">
          {survey.isAnonymous ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-brand-100 px-2 py-0.5 text-brand-700">
              <EyeOff aria-hidden="true" className="size-3" /> Anonyme
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-muted-foreground">
              <Eye aria-hidden="true" className="size-3" /> Identifié
            </span>
          )}
          {survey.topic && <span className="text-muted-foreground">{survey.topic}</span>}
        </div>
        <CardTitle className="text-lg font-semibold">{survey.title}</CardTitle>
        {survey.description && <CardDescription>{survey.description}</CardDescription>}
      </CardHeader>

      <CardContent className="mt-auto text-muted-foreground">
        <p className="flex items-center gap-2">
          <CalendarClock aria-hidden="true" className="size-4 shrink-0" />
          Jusqu’au {formatDate(survey.endDate)}
        </p>
        <p className="flex items-center gap-2">
          <ClipboardList aria-hidden="true" className="size-4 shrink-0" />
          {survey.questionCount} {survey.questionCount > 1 ? 'questions' : 'question'}
        </p>
      </CardContent>

      <CardFooter>
        {survey.alreadySubmitted ? (
          <p className="flex items-center gap-2 font-medium text-brand-700">
            <CheckCircle2 aria-hidden="true" className="size-4" /> Vous avez déjà répondu
          </p>
        ) : (
          <ButtonLink href={`/employee/surveys/${survey._id}`}>
            Répondre <ArrowRight aria-hidden="true" />
          </ButtonLink>
        )}
      </CardFooter>
    </Card>
  );
}

// Accueil employé : les sondages ouverts de son organisation
export default function EmployeeHomePage() {
  const { user, organization } = useAuth();
  const { data: surveys, error, isLoading, mutate } = useApi<EmployeeSurvey[]>('/employee/surveys');

  const toAnswer = surveys?.filter((s) => !s.alreadySubmitted) ?? [];
  const answered = surveys?.filter((s) => s.alreadySubmitted) ?? [];

  return (
    <div className="flex flex-col gap-6">
      {/* En-tête de la page */}
      <div>
        <h1 className="text-2xl font-semibold">Bonjour {user?.firstName}</h1>
        <p className="mt-1 max-w-2xl text-muted-foreground">
          Retrouvez ici les sondages ouverts de {organization?.name}. Vos réponses aux sondages anonymes ne sont
          jamais reliées à votre compte.
        </p>
      </div>

      {/* Premier chargement */}
      {isLoading && (
        <div className="flex justify-center py-16">
          <Loader2 className="size-6 animate-spin text-muted-foreground" aria-label="Chargement des sondages" />
        </div>
      )}

      {/* Erreur */}
      {error && !isLoading && (
        <Alert variant="destructive">
          <AlertCircle />
          <AlertTitle>Impossible de charger les sondages</AlertTitle>
          <AlertDescription>
            <p>{getErrorMessage(error)}</p>
            <Button variant="outline" size="sm" className="mt-3" onClick={() => mutate()}>
              Réessayer
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Données */}
      {surveys && !error && (
        <>
          {surveys.length === 0 && (
            <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed py-14 text-center">
              <ClipboardList aria-hidden="true" className="size-8 text-muted-foreground" />
              <p className="font-medium">Aucun sondage ouvert pour l’instant</p>
              <p className="max-w-sm text-sm text-muted-foreground">
                Les nouveaux sondages de votre organisation apparaîtront ici.
              </p>
            </div>
          )}

          {toAnswer.length > 0 && (
            <section className="flex flex-col gap-3">
              <h2 className="text-lg font-semibold">À remplir ({toAnswer.length})</h2>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {toAnswer.map((survey) => (
                  <SurveyCard key={survey._id} survey={survey} />
                ))}
              </div>
            </section>
          )}

          {answered.length > 0 && (
            <section className="flex flex-col gap-3">
              <h2 className="text-lg font-semibold">Déjà répondu ({answered.length})</h2>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {answered.map((survey) => (
                  <SurveyCard key={survey._id} survey={survey} />
                ))}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}
