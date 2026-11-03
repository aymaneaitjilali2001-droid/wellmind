import Link from 'next/link';
import { ChevronRight, Eye, TriangleAlert } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ActionListItem } from '@/types/action';
import { ActionStatusBadge } from './ActionStatusBadge';

const dateFormat = new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });

export const ownerName = (owner: ActionListItem['ownerId']) =>
  owner ? `${owner.firstName} ${owner.lastName}` : 'Compte supprimé';

// Tableau des actions. Toute la ligne est cliquable (lien étiré, comme pour les employés).
export function ActionsTable({ actions }: { actions: ActionListItem[] }) {
  return (
    <div className="overflow-hidden rounded-xl border bg-card">
      <table className="w-full text-sm">
        <caption className="sr-only">Actions d’amélioration</caption>
        <thead className="border-b bg-muted/50 text-left text-xs font-medium text-muted-foreground">
          <tr>
            <th scope="col" className="px-4 py-3">
              Action
            </th>
            <th scope="col" className="hidden px-4 py-3 md:table-cell">
              Responsable
            </th>
            <th scope="col" className="px-4 py-3">
              Échéance
            </th>
            <th scope="col" className="hidden px-4 py-3 sm:table-cell">
              Statut
            </th>
            <th scope="col" className="hidden px-4 py-3 lg:table-cell">
              <span className="sr-only">Partagée avec les employés</span>
              <Eye aria-hidden="true" className="size-4" />
            </th>
            <th scope="col" className="w-10 px-4 py-3">
              <span className="sr-only">Détail</span>
            </th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {actions.map((action) => (
            <tr
              key={action._id}
              className="group relative cursor-pointer transition-colors hover:bg-muted/40 has-[a:focus-visible]:bg-muted/60"
            >
              <td className="px-4 py-3">
                <Link
                  href={`/hr/actions/${action._id}`}
                  className="font-medium text-foreground group-hover:text-primary focus-visible:underline focus-visible:outline-none after:absolute after:inset-0 after:content-['']"
                >
                  {action.title}
                </Link>
                <p className="mt-0.5 truncate text-xs text-muted-foreground">
                  {[action.topic, action.surveyId?.title].filter(Boolean).join(' · ') || 'Sans thème'}
                </p>
                {/* Sur mobile, le statut passe sous le titre */}
                <ActionStatusBadge status={action.status} className="mt-1.5 sm:hidden" />
              </td>
              <td className="hidden px-4 py-3 text-muted-foreground md:table-cell">{ownerName(action.ownerId)}</td>
              <td className={cn('px-4 py-3 whitespace-nowrap', action.isOverdue ? 'text-destructive' : 'text-muted-foreground')}>
                {dateFormat.format(new Date(action.targetDate))}
                {action.isOverdue && (
                  <span className="mt-0.5 flex items-center gap-1 text-xs font-medium">
                    <TriangleAlert aria-hidden="true" className="size-3.5" /> En retard
                  </span>
                )}
              </td>
              <td className="hidden px-4 py-3 sm:table-cell">
                <ActionStatusBadge status={action.status} />
              </td>
              <td className="hidden px-4 py-3 lg:table-cell">
                {action.visibleToEmployees ? (
                  <Eye aria-label="Partagée avec les employés" className="size-4 text-brand-600" />
                ) : (
                  <span className="sr-only">Non partagée</span>
                )}
              </td>
              <td className="px-4 py-3">
                <ChevronRight
                  aria-hidden="true"
                  className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5"
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}