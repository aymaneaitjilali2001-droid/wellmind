'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useSWRConfig } from 'swr';
import { isAxiosError } from 'axios';
import { AlertCircle, ArrowLeft, Loader2, Pencil, SearchX, Sparkles, TriangleAlert } from 'lucide-react';
import { ActionTimeline } from '@/components/actions/detail/ActionTimeline';
import { ActionStatusCard } from '@/components/actions/detail/ActionStatusCard';
import { ActionStatusBadge } from '@/components/actions/ActionStatusBadge';
import { ButtonLink } from '@/components/Buttonlink';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { isActionsKey, useAction } from '@/hooks/useActions';
import { getErrorMessage } from '@/lib/Api';
import { addActionUpdate, changeActionStatus, updateAction } from '@/services/actions';
import type { Action, ActionStatus } from '@/types/action';

const dateFormat = new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
const fmt = (iso: string | null) => (iso ? dateFormat.format(new Date(iso)) : '—');

export default function ActionDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data: action, error, isLoading, mutate } = useAction(id ?? null);
  const { mutate: mutateCache } = useSWRConfig();

  // Le backend renvoie l'action à jour : on l'utilise directement, puis on recharge la liste
  const applyUpdate = async (updated: Action) => {
    await mutate(updated, { revalidate: false });
    await mutateCache((key) => isActionsKey(key) && key !== `/actions/${id}`);
  };

  const handleChangeStatus = async (status: ActionStatus, note: string) =>
    applyUpdate(await changeActionStatus(id, status, note || undefined));
  const handleToggleShare = async (visible: boolean) =>
    applyUpdate(await updateAction(id, { visibleToEmployees: visible }));
  const handleAddNote = async (note: string) => applyUpdate(await addActionUpdate(id, note));

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
        <h1 className="text-xl font-semibold">Action introuvable</h1>
        <ButtonLink href="/hr/actions" variant="outline" className="mt-2">
          Retour aux actions
        </ButtonLink>
      </div>
    );
  }

  if (error || !action) {
    return (
      <Alert variant="destructive">
        <AlertCircle />
        <AlertTitle>Impossible de charger l’action</AlertTitle>
        <AlertDescription>
          <p>{getErrorMessage(error)}</p>
          <Button variant="outline" size="sm" className="mt-3" onClick={() => mutate()}>
            Réessayer
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  const owner = action.ownerId;

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6">
      <Link
        href="/hr/actions"
        className="inline-flex w-fit items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft aria-hidden="true" className="size-4" /> Toutes les actions
      </Link>

      <header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex flex-col gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <ActionStatusBadge status={action.status} />
            {action.isOverdue && (
              <span className="inline-flex items-center gap-1 rounded-full bg-destructive/10 px-2.5 py-0.5 text-xs font-medium text-destructive">
                <TriangleAlert aria-hidden="true" className="size-3.5" /> En retard
              </span>
            )}
            {action.recommendationId && (
              <span className="inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs text-muted-foreground">
                <Sparkles aria-hidden="true" className="size-3.5" /> Issue d’une recommandation IA
              </span>
            )}
          </div>
          <h1 className="text-2xl font-semibold text-balance">{action.title}</h1>
        </div>
        {action.status !== 'CANCELLED' && (
          <ButtonLink href={`/hr/actions/${action._id}/edit`} variant="outline" className="shrink-0">
            <Pencil aria-hidden="true" /> Modifier
          </ButtonLink>
        )}
      </header>

      <div className="grid gap-6 lg:grid-cols-[1fr_20rem]">
        <div className="flex min-w-0 flex-col gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Détails</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-5">
              <div>
                <p className="text-sm font-medium">Objectif</p>
                <p className="mt-1 text-sm whitespace-pre-line text-muted-foreground">
                  {action.objective || 'Aucun objectif précisé.'}
                </p>
              </div>
              <dl className="grid gap-4 text-sm sm:grid-cols-2">
                <div>
                  <dt className="text-muted-foreground">Responsable</dt>
                  <dd className="mt-0.5 font-medium">
                    {owner ? `${owner.firstName} ${owner.lastName}` : 'Compte supprimé'}
                    {owner?.department && <span className="font-normal text-muted-foreground"> · {owner.department}</span>}
                  </dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Échéance</dt>
                  <dd className={action.isOverdue ? 'mt-0.5 font-medium text-destructive' : 'mt-0.5 font-medium'}>
                    {fmt(action.targetDate)}
                  </dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Thème</dt>
                  <dd className="mt-0.5">{action.topic || '—'}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Sondage d’origine</dt>
                  <dd className="mt-0.5">
                    {action.surveyId ? (
                      <Link href={`/hr/surveys/${action.surveyId._id}`} className="text-primary hover:underline">
                        {action.surveyId.title}
                      </Link>
                    ) : (
                      '—'
                    )}
                  </dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Créée</dt>
                  <dd className="mt-0.5">
                    {fmt(action.createdAt)}
                    {action.createdBy && ` par ${action.createdBy.firstName} ${action.createdBy.lastName}`}
                  </dd>
                </div>
                {action.startedAt && (
                  <div>
                    <dt className="text-muted-foreground">Démarrée</dt>
                    <dd className="mt-0.5">{fmt(action.startedAt)}</dd>
                  </div>
                )}
                {action.status === 'DONE' && (
                  <div>
                    <dt className="text-muted-foreground">Terminée</dt>
                    <dd className="mt-0.5">{fmt(action.completedAt)}</dd>
                  </div>
                )}
                {action.status === 'CANCELLED' && (
                  <div>
                    <dt className="text-muted-foreground">Annulée</dt>
                    <dd className="mt-0.5">{fmt(action.cancelledAt)}</dd>
                  </div>
                )}
              </dl>
            </CardContent>
          </Card>

          <ActionTimeline updates={action.updates} onAddNote={handleAddNote} />
        </div>

        <aside>
          <ActionStatusCard action={action} onChangeStatus={handleChangeStatus} onToggleShare={handleToggleShare} />
        </aside>
      </div>
    </div>
  );
}