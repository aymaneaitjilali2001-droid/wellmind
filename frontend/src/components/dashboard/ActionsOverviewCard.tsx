import { TriangleAlert } from 'lucide-react';
import { ButtonLink } from '@/components/Buttonlink';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ACTION_STATUSES, STATUS_LABELS } from '@/lib/action-status';
import { cn } from '@/lib/utils';
import type { ActionsSummary, ActionStatus } from '@/types/action';

// Mêmes familles de couleurs que les badges de statut des actions
const SEGMENT: Record<ActionStatus, string> = {
  PLANNED: 'bg-slate-400',
  IN_PROGRESS: 'bg-sky-500',
  DONE: 'bg-brand-600',
  CANCELLED: 'bg-slate-200',
};

// Avancement des actions : barre segmentée par statut, avec une légende chiffrée
// (la couleur n'est jamais la seule information : chaque segment a son libellé et son nombre).
export function ActionsOverviewCard({ summary }: { summary: ActionsSummary }) {
  const { total, byStatus, overdue, completionRate, visibleToEmployees } = summary;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Actions d’amélioration</CardTitle>
        <CardDescription>
          {total === 0
            ? 'Aucune action pour l’instant.'
            : `${total} action${total > 1 ? 's' : ''}, dont ${visibleToEmployees} partagée${visibleToEmployees > 1 ? 's' : ''} avec les employés.`}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {total > 0 && (
          <>
            <div>
              <p className="text-3xl font-semibold tabular-nums">
                {completionRate === null ? '—' : `${completionRate.toLocaleString('fr-FR')} %`}
              </p>
              <p className="text-xs text-muted-foreground">Taux de réalisation (hors actions annulées)</p>
            </div>

            <div className="flex h-2.5 gap-0.5 overflow-hidden rounded-full" aria-hidden="true">
              {ACTION_STATUSES.filter((s) => byStatus[s] > 0).map((s) => (
                <div
                  key={s}
                  className={cn('h-full first:rounded-l-full last:rounded-r-full', SEGMENT[s])}
                  style={{ flexGrow: byStatus[s] }}
                  title={`${STATUS_LABELS[s]} : ${byStatus[s]}`}
                />
              ))}
            </div>

            <ul className="grid grid-cols-2 gap-2 text-sm">
              {ACTION_STATUSES.map((s) => (
                <li key={s} className="flex items-center gap-2">
                  <span aria-hidden="true" className={cn('size-2.5 rounded-full', SEGMENT[s])} />
                  <span className="text-muted-foreground">{STATUS_LABELS[s]}</span>
                  <span className="ml-auto font-medium tabular-nums">{byStatus[s]}</span>
                </li>
              ))}
            </ul>

            {overdue > 0 && (
              <p className="flex items-center gap-2 rounded-lg bg-destructive/10 p-3 text-sm font-medium text-destructive">
                <TriangleAlert aria-hidden="true" className="size-4 shrink-0" />
                {overdue} action{overdue > 1 ? 's' : ''} en retard
              </p>
            )}
          </>
        )}

        <ButtonLink href={total === 0 ? '/hr/actions/new' : '/hr/actions'} variant="outline">
          {total === 0 ? 'Créer une action' : 'Voir les actions'}
        </ButtonLink>
      </CardContent>
    </Card>
  );
}