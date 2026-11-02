'use client';

import { useState } from 'react';
import { AlertCircle, Eye, EyeOff, Loader2 } from 'lucide-react';
import { ConfirmPanel } from '@/components/ConfirmPanel';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ALLOWED_TRANSITIONS, getTransition, STATUS_LABELS } from '@/lib/action-status';
import { getErrorMessage } from '@/lib/Api';
import type { Action, ActionStatus } from '@/types/action';

const STATUS_HELP: Record<ActionStatus, string> = {
  PLANNED: 'L’action est prévue mais pas encore commencée.',
  IN_PROGRESS: 'L’action est en cours de réalisation.',
  DONE: 'L’action est terminée.',
  CANCELLED: 'L’action est annulée. Replanifiez-la pour la modifier à nouveau.',
};

// Changement de statut (avec note facultative) et partage avec les employés
export function ActionStatusCard({
  action,
  onChangeStatus,
  onToggleShare,
}: {
  action: Action;
  onChangeStatus: (status: ActionStatus, note: string) => Promise<void>;
  onToggleShare: (visible: boolean) => Promise<void>;
}) {
  const [target, setTarget] = useState<ActionStatus | null>(null);
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState<'status' | 'share' | null>(null);
  const [error, setError] = useState<string | null>(null);

  const run = async (kind: 'status' | 'share', task: () => Promise<void>) => {
    setBusy(kind);
    setError(null);
    try {
      await task();
      setTarget(null);
      setNote('');
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setBusy(null);
    }
  };

  const transitions = ALLOWED_TRANSITIONS[action.status];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Statut : {STATUS_LABELS[action.status]}</CardTitle>
        <CardDescription>{STATUS_HELP[action.status]}</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {error && (
          <Alert variant="destructive">
            <AlertCircle />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {target ? (
          <ConfirmPanel
            tone={getTransition(action.status, target).tone === 'danger' ? 'danger' : 'default'}
            confirmLabel="Confirmer"
            busy={busy === 'status'}
            onConfirm={() => run('status', () => onChangeStatus(target, note.trim()))}
            onCancel={() => {
              setTarget(null);
              setNote('');
            }}
          >
            <p className="font-medium">{getTransition(action.status, target).confirm}</p>
            <label className="mt-3 block">
              <span className="text-muted-foreground">Note de suivi (facultative)</span>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={3}
                maxLength={2000}
                placeholder="Ex : premier atelier réalisé avec l’équipe support"
                className="mt-1.5 w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
              />
            </label>
          </ConfirmPanel>
        ) : (
          transitions.map((to) => {
            const t = getTransition(action.status, to);
            return (
              <Button
                key={to}
                variant={t.tone === 'default' ? 'default' : t.tone === 'danger' ? 'ghost' : 'outline'}
                className={t.tone === 'danger' ? 'text-destructive hover:text-destructive' : undefined}
                onClick={() => setTarget(to)}
                disabled={busy !== null}
              >
                {t.label}
              </Button>
            );
          })
        )}

        {/* Partage avec les employés (impossible sur une action annulée : le backend refuse la modification) */}
        <div className="mt-2 flex flex-col gap-2 border-t pt-4">
          <p className="flex items-center gap-2 text-sm">
            {action.visibleToEmployees ? (
              <>
                <Eye aria-hidden="true" className="size-4 text-brand-600" /> Partagée avec les employés
              </>
            ) : (
              <>
                <EyeOff aria-hidden="true" className="size-4 text-muted-foreground" /> Visible par les RH seulement
              </>
            )}
          </p>
          <Button
            variant="outline"
            size="sm"
            disabled={busy !== null || action.status === 'CANCELLED'}
            onClick={() => run('share', () => onToggleShare(!action.visibleToEmployees))}
          >
            {busy === 'share' && <Loader2 aria-hidden="true" className="animate-spin" />}
            {action.visibleToEmployees ? 'Ne plus partager' : 'Partager avec les employés'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}