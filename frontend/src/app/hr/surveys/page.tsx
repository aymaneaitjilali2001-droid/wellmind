'use client';

import { useMemo, useState } from 'react';
import { useSWRConfig } from 'swr';
import { AlertCircle, Check, ClipboardList, Loader2, Plus, Search, SearchX } from 'lucide-react';
import { ButtonLink } from '@/components/Buttonlink';
import { SurveyCard } from '@/components/surveys/SurveyCard';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { isSurveysKey, useSurveys } from '@/hooks/useSurveys';
import { getErrorMessage } from '@/lib/Api';
import { cn } from '@/lib/utils';
import { duplicateSurvey } from '@/services/surveys';
import type { SurveyStatus, SurveySummary } from '@/types/survey';

const TABS: { value: SurveyStatus | ''; label: string }[] = [
  { value: '', label: 'Tous' },
  { value: 'DRAFT', label: 'Brouillons' },
  { value: 'PUBLISHED', label: 'Publiés' },
  { value: 'CLOSED', label: 'Clôturés' },
];

export default function SurveysPage() {
  // Tous les sondages sont chargés une fois ; le filtre et la recherche se font ici,
  // ce qui permet d'afficher le nombre de sondages dans chaque onglet.
  const { data, error, isLoading, mutate } = useSurveys();
  const { mutate: mutateCache } = useSWRConfig();

  const [status, setStatus] = useState<SurveyStatus | ''>('');
  const [search, setSearch] = useState('');
  const [duplicatingId, setDuplicatingId] = useState<string | null>(null);
  const [message, setMessage] = useState<{ tone: 'success' | 'error'; text: string } | null>(null);

  const surveys = useMemo(() => data ?? [], [data]);

  const counts = useMemo(() => {
    const result: Record<string, number> = { '': surveys.length, DRAFT: 0, PUBLISHED: 0, CLOSED: 0 };
    for (const s of surveys) result[s.status] += 1;
    return result;
  }, [surveys]);

  const visible = useMemo(() => {
    const term = search.trim().toLowerCase();
    return surveys.filter(
      (s) =>
        (!status || s.status === status) &&
        (!term || s.title.toLowerCase().includes(term) || (s.topic ?? '').toLowerCase().includes(term))
    );
  }, [surveys, status, search]);

  // Duplication : nouveau brouillon avec les mêmes questions (pour un sondage récurrent)
  const handleDuplicate = async (survey: SurveySummary) => {
    setDuplicatingId(survey._id);
    setMessage(null);
    try {
      const copy = await duplicateSurvey(survey._id);
      await mutateCache(isSurveysKey);
      setMessage({ tone: 'success', text: `Copie créée en brouillon : « ${copy.title} ». Pensez à ajuster ses dates.` });
    } catch (err) {
      setMessage({ tone: 'error', text: getErrorMessage(err) });
    } finally {
      setDuplicatingId(null);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Sondages</h1>
          <p className="mt-1 text-muted-foreground">Créez, publiez et suivez les sondages de votre organisation.</p>
        </div>
        <ButtonLink href="/hr/surveys/new">
          <Plus aria-hidden="true" /> Nouveau sondage
        </ButtonLink>
      </div>

      {/* Onglets de statut + recherche */}
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div role="group" aria-label="Filtrer par statut" className="flex flex-wrap gap-1 rounded-lg bg-muted p-1">
          {TABS.map((tab) => (
            <button
              key={tab.value}
              type="button"
              onClick={() => setStatus(tab.value)}
              aria-pressed={status === tab.value}
              className={cn(
                'rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
                'focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none',
                status === tab.value
                  ? 'bg-background text-foreground shadow-xs'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              {tab.label}
              {data && <span className="ml-1.5 text-xs text-muted-foreground">{counts[tab.value]}</span>}
            </button>
          ))}
        </div>

        <div className="relative lg:w-72">
          <Search
            aria-hidden="true"
            className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
          />
          <Input
            type="search"
            aria-label="Rechercher un sondage"
            placeholder="Rechercher par titre ou thème"
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {message && (
        <Alert variant={message.tone === 'error' ? 'destructive' : 'default'}>
          {message.tone === 'error' ? <AlertCircle /> : <Check />}
          <AlertDescription>{message.text}</AlertDescription>
        </Alert>
      )}

      {isLoading && (
        <div className="flex justify-center py-16">
          <Loader2 className="size-6 animate-spin text-muted-foreground" aria-label="Chargement des sondages" />
        </div>
      )}

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

      {data && !error && (
        <>
          {visible.length > 0 ? (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {visible.map((survey) => (
                <SurveyCard
                  key={survey._id}
                  survey={survey}
                  duplicating={duplicatingId === survey._id}
                  onDuplicate={handleDuplicate}
                />
              ))}
            </div>
          ) : surveys.length === 0 ? (
            <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed py-14 text-center">
              <ClipboardList aria-hidden="true" className="size-8 text-muted-foreground" />
              <p className="font-medium">Aucun sondage pour l’instant</p>
              <p className="max-w-sm text-sm text-muted-foreground">
                Créez votre premier sondage pour recueillir le ressenti de vos équipes.
              </p>
              <ButtonLink href="/hr/surveys/new" className="mt-2">
                <Plus aria-hidden="true" /> Nouveau sondage
              </ButtonLink>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed py-14 text-center">
              <SearchX aria-hidden="true" className="size-8 text-muted-foreground" />
              <p className="font-medium">Aucun sondage ne correspond</p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setStatus('');
                  setSearch('');
                }}
              >
                Afficher tous les sondages
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}