'use client';

import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useSWRConfig } from 'swr';
import { isAxiosError } from 'axios';
import { AlertCircle, ArrowLeft, CalendarDays, EyeOff, Loader2, SearchX, Tag, UserCheck } from 'lucide-react';
import { ButtonLink } from '@/components/Buttonlink';
import { AnalysisCard } from '@/components/surveys/analysis/AnalysisCard';
import { ParticipationCard } from '@/components/surveys/detail/ParticipationCard';
import { QuestionsOverview } from '@/components/surveys/detail/QuestionsOverview';
import { SurveyActionsCard } from '@/components/surveys/detail/SurveyActionsCard';
import { ResultsLockedCard } from '@/components/surveys/results/ResultsLockedCard';
import { SurveyResultsCard } from '@/components/surveys/results/SurveyResultsCard';
import { SurveyStatusBadge } from '@/components/surveys/SurveyStatusBadge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { useOrganization } from '@/hooks/useEmployees';
import { isSurveysKey, useSurvey, useSurveyParticipation } from '@/hooks/useSurveys';
import { getErrorMessage } from '@/lib/Api';
import { formatDateRange, getSurveyTiming } from '@/lib/survey-dates';
import { closeSurvey, deleteSurvey, duplicateSurvey, publishSurvey } from '@/services/surveys';
import type { Survey } from '@/types/survey';

export default function SurveyDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { mutate: mutateCache } = useSWRConfig();

  // Tous les hooks sont appelés avant les "return" anticipés (règle des hooks React)
  const { data: survey, error, isLoading, mutate } = useSurvey(id ?? null);
  const showParticipation = Boolean(survey && survey.status !== 'DRAFT');
  const participation = useSurveyParticipation(showParticipation ? id : null);
  const { data: organization } = useOrganization();

  // Recharge les listes de sondages (et la participation) sans recharger ce sondage
  const refreshLists = () => mutateCache((key) => isSurveysKey(key) && key !== `/surveys/${id}`);

  const applyUpdate = async (updated: Survey) => {
    await mutate(updated, { revalidate: false });
    await refreshLists();
  };

  const handlePublish = async () => applyUpdate(await publishSurvey(id));
  const handleClose = async () => applyUpdate(await closeSurvey(id));

  const handleDelete = async () => {
    await deleteSurvey(id);
    await refreshLists();
    router.replace('/hr/surveys');
  };

  const handleDuplicate = async () => {
    const copy = await duplicateSurvey(id);
    await refreshLists();
    router.push(`/hr/surveys/${copy._id}/edit`);
  };

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
        <p className="text-muted-foreground">Il a peut-être été supprimé.</p>
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

  const timing = getSurveyTiming(survey);

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6">
      <Link
        href="/hr/surveys"
        className="inline-flex w-fit items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft aria-hidden="true" className="size-4" /> Tous les sondages
      </Link>

      {/* ---------- En-tête ---------- */}
      <header className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <SurveyStatusBadge timing={timing} />
          <span className="inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs text-muted-foreground">
            {survey.isAnonymous ? (
              <>
                <EyeOff aria-hidden="true" className="size-3.5" /> Anonyme
              </>
            ) : (
              <>
                <UserCheck aria-hidden="true" className="size-3.5" /> Identifié
              </>
            )}
          </span>
        </div>
        <h1 className="text-2xl font-semibold text-balance">{survey.title}</h1>
        {survey.description && <p className="max-w-3xl text-muted-foreground">{survey.description}</p>}
        <div className="flex flex-wrap gap-x-5 gap-y-1 text-sm text-muted-foreground">
          <span className="inline-flex items-center gap-1.5">
            <CalendarDays aria-hidden="true" className="size-4" />
            {formatDateRange(survey.startDate, survey.endDate)}
          </span>
          {survey.topic && (
            <span className="inline-flex items-center gap-1.5">
              <Tag aria-hidden="true" className="size-4" />
              {survey.topic}
            </span>
          )}
        </div>
      </header>

      {/* ---------- Contenu : questions à gauche, actions à droite ---------- */}
      <div className="grid gap-6 lg:grid-cols-[1fr_20rem]">
        <div className="flex min-w-0 flex-col gap-6">
          <QuestionsOverview questions={survey.questions} />

          {/* Résultats et analyse IA : seulement après la clôture */}
          {survey.status === 'PUBLISHED' && <ResultsLockedCard />}
          {survey.status === 'CLOSED' && (
            <>
              <SurveyResultsCard surveyId={survey._id} />
              <AnalysisCard
                survey={survey}
                participants={participation.data?.participants}
                threshold={organization?.minResponseThreshold}
              />
            </>
          )}
        </div>

        <aside className="flex flex-col gap-6">
          <SurveyActionsCard
            survey={survey}
            onPublish={handlePublish}
            onClose={handleClose}
            onDelete={handleDelete}
            onDuplicate={handleDuplicate}
          />
          {showParticipation && (
            <ParticipationCard
              participation={participation.data}
              isLoading={participation.isLoading}
              threshold={organization?.minResponseThreshold}
            />
          )}
        </aside>
      </div>
    </div>
  );
}