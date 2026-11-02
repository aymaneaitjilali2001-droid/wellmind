'use client';

import { useMemo, useState } from 'react';
import { AlertCircle, ListTodo, Loader2, Plus, Search, SearchX, TriangleAlert } from 'lucide-react';
import { ActionsTable } from '@/components/actions/ActionsTable';
import { ButtonLink } from '@/components/Buttonlink';
import { NativeSelect } from '@/components/Nativeselect';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useActions } from '@/hooks/useActions';
import { getErrorMessage } from '@/lib/Api';
import { cn } from '@/lib/utils';
import type { ActionStatus } from '@/types/action';

const TABS: { value: ActionStatus | ''; label: string }[] = [
  { value: '', label: 'Toutes' },
  { value: 'PLANNED', label: 'Planifiées' },
  { value: 'IN_PROGRESS', label: 'En cours' },
  { value: 'DONE', label: 'Terminées' },
  { value: 'CANCELLED', label: 'Annulées' },
];

function StatTile({ label, value, tone }: { label: string; value: string; tone?: 'danger' }) {
  return (
    <div className={cn('rounded-xl border bg-card p-4', tone === 'danger' && 'border-destructive/30 bg-destructive/5')}>
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className={cn('mt-1 text-2xl font-semibold', tone === 'danger' && 'text-destructive')}>{value}</p>
    </div>
  );
}

export default function ActionsPage() {
  // Toutes les actions sont chargées une fois ; filtres, compteurs et chiffres sont calculés ici
  const { data, error, isLoading, mutate } = useActions();

  const [status, setStatus] = useState<ActionStatus | ''>('');
  const [overdueOnly, setOverdueOnly] = useState(false);
  const [ownerId, setOwnerId] = useState('');
  const [search, setSearch] = useState('');

  const actions = useMemo(() => data ?? [], [data]);

  const stats = useMemo(() => {
    const counts: Record<string, number> = { '': actions.length, PLANNED: 0, IN_PROGRESS: 0, DONE: 0, CANCELLED: 0 };
    for (const a of actions) counts[a.status] += 1;
    const notCancelled = actions.length - counts.CANCELLED;
    return {
      counts,
      active: counts.PLANNED + counts.IN_PROGRESS,
      overdue: actions.filter((a) => a.isOverdue).length,
      completion: notCancelled > 0 ? Math.round((counts.DONE / notCancelled) * 100) : null,
    };
  }, [actions]);

  // Responsables présents dans la liste, pour le filtre
  const owners = useMemo(() => {
    const map = new Map<string, string>();
    for (const a of actions) if (a.ownerId) map.set(a.ownerId._id, `${a.ownerId.firstName} ${a.ownerId.lastName}`);
    return [...map].sort((a, b) => a[1].localeCompare(b[1], 'fr'));
  }, [actions]);

  const visible = useMemo(() => {
    const term = search.trim().toLowerCase();
    return actions.filter(
      (a) =>
        (!status || a.status === status) &&
        (!overdueOnly || a.isOverdue) &&
        (!ownerId || a.ownerId?._id === ownerId) &&
        (!term || a.title.toLowerCase().includes(term) || a.topic.toLowerCase().includes(term))
    );
  }, [actions, status, overdueOnly, ownerId, search]);

  const resetFilters = () => {
    setStatus('');
    setOverdueOnly(false);
    setOwnerId('');
    setSearch('');
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Actions d’amélioration</h1>
          <p className="mt-1 text-muted-foreground">
            Transformez les résultats des sondages en actions concrètes, et suivez leur avancement.
          </p>
        </div>
        <ButtonLink href="/hr/actions/new">
          <Plus aria-hidden="true" /> Nouvelle action
        </ButtonLink>
      </div>

      {data && (
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <StatTile label="Actions actives" value={String(stats.active)} />
          <StatTile label="En retard" value={String(stats.overdue)} tone={stats.overdue > 0 ? 'danger' : undefined} />
          <StatTile label="Terminées" value={String(stats.counts.DONE)} />
          <StatTile label="Taux de réalisation" value={stats.completion === null ? '—' : `${stats.completion} %`} />
        </div>
      )}

      {/* Filtres */}
      <div className="flex flex-col gap-3">
        <div role="group" aria-label="Filtrer par statut" className="flex w-fit flex-wrap gap-1 rounded-lg bg-muted p-1">
          {TABS.map((tab) => (
            <button
              key={tab.value}
              type="button"
              onClick={() => setStatus(tab.value)}
              aria-pressed={status === tab.value}
              className={cn(
                'rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
                'focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none',
                status === tab.value ? 'bg-background text-foreground shadow-xs' : 'text-muted-foreground hover:text-foreground'
              )}
            >
              {tab.label}
              {data && <span className="ml-1.5 text-xs text-muted-foreground">{stats.counts[tab.value]}</span>}
            </button>
          ))}
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
          <div className="relative sm:w-72">
            <Search
              aria-hidden="true"
              className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
            />
            <Input
              type="search"
              aria-label="Rechercher une action"
              placeholder="Rechercher par titre ou thème"
              className="pl-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <NativeSelect
            aria-label="Filtrer par responsable"
            className="sm:w-56"
            value={ownerId}
            onChange={(e) => setOwnerId(e.target.value)}
          >
            <option value="">Tous les responsables</option>
            {owners.map(([id, name]) => (
              <option key={id} value={id}>
                {name}
              </option>
            ))}
          </NativeSelect>
          <Button
            type="button"
            variant={overdueOnly ? 'destructive' : 'outline'}
            aria-pressed={overdueOnly}
            onClick={() => setOverdueOnly((v) => !v)}
          >
            <TriangleAlert aria-hidden="true" /> En retard seulement
          </Button>
        </div>
      </div>

      {isLoading && (
        <div className="flex justify-center py-16">
          <Loader2 className="size-6 animate-spin text-muted-foreground" aria-label="Chargement des actions" />
        </div>
      )}

      {error && !isLoading && (
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

      {data && !error && (
        <>
          {visible.length > 0 ? (
            <ActionsTable actions={visible} />
          ) : actions.length === 0 ? (
            <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed py-14 text-center">
              <ListTodo aria-hidden="true" className="size-8 text-muted-foreground" />
              <p className="font-medium">Aucune action pour l’instant</p>
              <p className="max-w-sm text-sm text-muted-foreground">
                Créez une action à la main, ou à partir d’une recommandation de l’analyse IA d’un sondage.
              </p>
              <ButtonLink href="/hr/actions/new" className="mt-2">
                <Plus aria-hidden="true" /> Nouvelle action
              </ButtonLink>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed py-14 text-center">
              <SearchX aria-hidden="true" className="size-8 text-muted-foreground" />
              <p className="font-medium">Aucune action ne correspond à ces filtres</p>
              <Button variant="outline" size="sm" onClick={resetFilters}>
                Effacer les filtres
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}