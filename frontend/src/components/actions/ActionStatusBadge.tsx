import { STATUS_LABELS } from '@/lib/action-status';
import { cn } from '@/lib/utils';
import type { ActionStatus } from '@/types/action';

const STYLES: Record<ActionStatus, string> = {
  PLANNED: 'bg-muted text-foreground',
  IN_PROGRESS: 'bg-sky-50 text-sky-800',
  DONE: 'bg-brand-50 text-brand-700',
  CANCELLED: 'bg-muted text-muted-foreground line-through',
};

export function ActionStatusBadge({ status, className }: { status: ActionStatus; className?: string }) {
  return (
    <span className={cn('inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium', STYLES[status], className)}>
      {STATUS_LABELS[status]}
    </span>
  );
}