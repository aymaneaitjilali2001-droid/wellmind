import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

// Un chiffre clé du tableau de bord. Pas de graphique : un seul nombre se lit mieux en grand.
export function KpiTile({
  label,
  value,
  detail,
  icon,
  tone,
}: {
  label: string;
  value: string;
  detail?: ReactNode;
  icon: ReactNode;
  tone?: 'danger';
}) {
  return (
    <div className={cn('rounded-xl border bg-card p-4', tone === 'danger' && 'border-destructive/30 bg-destructive/5')}>
      <div className="flex items-center justify-between gap-2 text-sm text-muted-foreground">
        <span>{label}</span>
        <span aria-hidden="true" className="[&_svg]:size-4">
          {icon}
        </span>
      </div>
      <p className={cn('mt-2 text-3xl font-semibold tabular-nums', tone === 'danger' && 'text-destructive')}>{value}</p>
      {detail && <p className="mt-1 text-xs text-muted-foreground">{detail}</p>}
    </div>
  );
}