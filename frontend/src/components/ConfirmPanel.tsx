import type { ReactNode } from 'react';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

// Confirmation affichée sur place avant une action importante (publier, clôturer, supprimer)
export function ConfirmPanel({
  tone = 'default',
  children,
  confirmLabel,
  busy,
  onConfirm,
  onCancel,
}: {
  tone?: 'default' | 'danger';
  children: ReactNode;
  confirmLabel: string;
  busy: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <div
      role="group"
      aria-label="Confirmation"
      className={cn(
        'flex flex-col gap-3 rounded-lg border p-3 text-sm',
        tone === 'danger' ? 'border-destructive/30 bg-destructive/5' : 'border-primary/30 bg-brand-50'
      )}
    >
      <div>{children}</div>
      <div className="flex gap-2">
        <Button
          type="button"
          size="sm"
          variant={tone === 'danger' ? 'destructive' : 'default'}
          onClick={onConfirm}
          disabled={busy}
        >
          {busy && <Loader2 aria-hidden="true" className="animate-spin" />}
          {confirmLabel}
        </Button>
        <Button type="button" size="sm" variant="outline" onClick={onCancel} disabled={busy}>
          Annuler
        </Button>
      </div>
    </div>
  );
}