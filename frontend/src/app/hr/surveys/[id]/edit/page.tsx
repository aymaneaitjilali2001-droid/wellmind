'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useSWRConfig } from 'swr';
import { isAxiosError } from 'axios';
import { AlertCircle, ArrowLeft, Loader2, Lock, SearchX } from 'lucide-react';
import { ButtonLink } from '@/components/Buttonlink';
import { SurveyEditor } from '@/components/surveys/editor/SurveyEditor';
import { SurveyStatusBadge } from '@/components/surveys/SurveyStatusBadge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { isSurveysKey, useSurvey } from '@/hooks/useSurveys';
import { getErrorMessage } from '@/lib/Api';
import { getSurveyTiming } from '@/lib/survey-dates';
import type { Survey } from '@/types/survey';

export default function EditSurveyPage() {
  const { id } = useParams<{ id: string }>();
  const { data: survey, error, isLoading, mutate } = useSurvey(id ?? null);
  const { mutate: mutateCache } = useSWRConfig();

  // Après l'enregistrement : ce sondage prend la version renvoyée, puis les listes sont rechargées
  const handleSaved = async (saved: Survey) => {
    await mutate(saved, { revalidate: false });
    await mutateCache((key) => isSurveysKey(key) && key !== `/surveys/${id}`);
  };

  const backLink = (
    <Link
      href={`/hr/surveys/${id}`}
      className="inline-flex w-fit items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
    >
      <ArrowLeft aria-hidden="true" className="size-4" /> Retour au sondage
    </Link>
  );

  if (isLoading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="size-6 animate-spin text-muted-foreground" aria-label="Chargement" />
      </div>
    );
  }

  const notFound = isAxiosError(error) && (error.response?.status === 404 || error.response?.status === 400);
  if (notFound) {
    return (
      <div className="mx-auto flex max-w-md flex-col items-center gap-3 py-16 text-center">
        <SearchX aria-hidden="true" className="size-8 text-muted-foreground" />
        <h1 className="text-xl font-semibold">Sondage introuvable</h1>
        <ButtonLink href="/hr/surveys" variant="outline" className="mt-2">
          Retour aux sondages
        </ButtonLink>
      </div>
    );
  }

  if (error || !survey) {
    return (
      <Alert variant="destructive">
        <AlertCircle />
        <AlertTitle>Impossible de charger le sondage</AlertTitle>
        <AlertDescription>
          <p>{getErrorMessage(error)}</p>
          <Button variant="outline" size="sm" className="mt-3" onClick={() => mutate()}>
            Réessayer
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  // Un sondage clôturé n'est plus modifiable (refusé par le backend)
  if (survey.status === 'CLOSED') {
    return (
      <div className="mx-auto flex max-w-xl flex-col gap-6">
        {backLink}
        <div className="flex flex-col items-center gap-3 rounded-xl border py-12 text-center">
          <Lock aria-hidden="true" className="size-8 text-muted-foreground" />
          <h1 className="text-xl font-semibold">Ce sondage est clôturé</h1>
          <p className="max-w-sm text-muted-foreground">
            Il ne peut plus être modifié. Pour le reposer, dupliquez-le depuis la liste des sondages.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-6">
      {backLink}
      <div>
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-semibold">Modifier le sondage</h1>
          <SurveyStatusBadge timing={getSurveyTiming(survey)} />
        </div>
        <p className="mt-1 text-muted-foreground">{survey.title}</p>
      </div>

      <SurveyEditor key={survey._id} survey={survey} cancelHref={`/hr/surveys/${id}`} onSaved={handleSaved} />
    </div>
  );
}