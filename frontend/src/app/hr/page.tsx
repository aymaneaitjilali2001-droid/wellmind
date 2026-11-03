'use client';

import { AlertCircle, ClipboardList, ListTodo, Loader2, HeartPulse, Plus, UsersRound } from 'lucide-react';
import { ActionsOverviewCard } from '@/components/dashboard/ActionsOverviewCard';
import { KpiTile } from '@/components/dashboard/KpiTile';
import { LatestInsightsCard } from '@/components/dashboard/LatestInsightsCard';
import { ParticipationChart } from '@/components/dashboard/ParticipationChart';
import { ScoreTrendChart } from '@/components/dashboard/ScoreTrendChart';
import { buildTodos, TodoCard } from '@/components/dashboard/TodoCard';
import { ButtonLink } from '@/components/Buttonlink';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/Authcontext';
import { useActions, useActionsSummary } from '@/hooks/useActions';
import { useAnalysesList } from '@/hooks/useAnalyses';
import { useParticipationOverview } from '@/hooks/useDashboard';
import { useStatsOverview } from '@/hooks/useStats';
import { getErrorMessage } from '@/lib/Api';
import { formatDelta, getScoreLevel } from '@/lib/score';

// Tableau de bord RH : uniquement des chiffres agrégés (aucune réponse individuelle)
export default function HrDashboardPage() {
  const { user, organization } = useAuth();
  const overview = useParticipationOverview();
  const summary = useActionsSummary();
  const actions = useActions();
  const analyses = useAnalysesList();
  const stats = useStatsOverview();

  const all = [overview, summary, actions, analyses, stats];
  const loading = all.some((r) => r.isLoading);
  const firstError = all.find((r) => r.error)?.error;

  const header = (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="text-2xl font-semibold">Bonjour {user?.firstName}</h1>
        <p className="mt-1 text-muted-foreground">
          Le bien-être au travail{organization ? ` chez ${organization.name}` : ''}, en un coup d’œil.
        </p>
      </div>
      <ButtonLink href="/hr/surveys/new">
        <Plus aria-hidden="true" /> Nouveau sondage
      </ButtonLink>
    </div>
  );

  if (loading) {
    return (
      <div className="flex flex-col gap-6">
        {header}
        <div className="flex justify-center py-16">
          <Loader2 className="size-6 animate-spin text-muted-foreground" aria-label="Chargement du tableau de bord" />
        </div>
      </div>
    );
  }

  if (firstError || !overview.data || !summary.data || !actions.data || !analyses.data || !stats.data) {
    return (
      <div className="flex flex-col gap-6">
        {header}
        <Alert variant="destructive">
          <AlertCircle />
          <AlertTitle>Impossible de charger le tableau de bord</AlertTitle>
          <AlertDescription>
            <p>{getErrorMessage(firstError)}</p>
            <Button variant="outline" size="sm" className="mt-3" onClick={() => all.forEach((r) => r.mutate())}>
              Réessayer
            </Button>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const o = overview.data;
  const s = summary.data;
  const active = s.byStatus.PLANNED + s.byStatus.IN_PROGRESS;

  // Dernier score connu (sondage clôturé au-dessus du seuil) et écart avec le précédent
  const scored = stats.data.surveys.filter((x) => x.score !== null);
  const lastScore = scored.at(-1)?.score ?? null;
  const prevScore = scored.at(-2)?.score ?? null;
  const todos = buildTodos({
    overview: o,
    analyses: analyses.data,
    actions: actions.data,
    threshold: organization?.minResponseThreshold ?? 5,
  });

  return (
    <div className="flex flex-col gap-6">
      {header}

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <KpiTile
          label="Score de bien-être"
          value={lastScore === null ? '—' : `${lastScore} / 100`}
          icon={<HeartPulse />}
          detail={
            lastScore === null
              ? 'Après la clôture d’un sondage'
              : `${getScoreLevel(lastScore).label}${prevScore !== null ? ` · ${formatDelta(lastScore - prevScore)}` : ''}`
          }
        />
        <KpiTile
          label="Sondages en cours"
          value={String(o.publishedCount)}
          icon={<ClipboardList />}
          detail={`${o.closedCount} clôturé${o.closedCount > 1 ? 's' : ''}`}
        />
        <KpiTile
          label="Participation moyenne"
          value={o.averageParticipationRate === null ? '—' : `${o.averageParticipationRate.toLocaleString('fr-FR')} %`}
          icon={<UsersRound />}
          detail={o.averageParticipationRate === null ? 'Disponible après une clôture' : 'Sur les sondages clôturés'}
        />
        <KpiTile
          label="Actions actives"
          value={String(active)}
          icon={<ListTodo />}
          tone={s.overdue > 0 ? 'danger' : undefined}
          detail={s.overdue > 0 ? `dont ${s.overdue} en retard` : 'Aucune en retard'}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_22rem]">
        <div className="flex min-w-0 flex-col gap-6">
          <ScoreTrendChart overview={stats.data} />
          <ParticipationChart overview={o} />
          <TodoCard todos={todos} />
        </div>
        <aside className="flex flex-col gap-6">
          <LatestInsightsCard analyses={analyses.data} />
          <ActionsOverviewCard summary={s} />
        </aside>
      </div>
    </div>
  );
}