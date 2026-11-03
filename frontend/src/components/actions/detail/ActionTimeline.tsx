'use client';

import { useState, type FormEvent } from 'react';
import { AlertCircle, ArrowRight, Loader2, MessageSquarePlus } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { STATUS_LABELS } from '@/lib/action-status';
import { getErrorMessage } from '@/lib/Api';
import type { ActionUpdate } from '@/types/action';

const dateTime = new Intl.DateTimeFormat('fr-FR', { dateStyle: 'medium', timeStyle: 'short' });

// Suivi de l'action : ajout d'une note et historique (le plus récent en haut)
export function ActionTimeline({
  updates,
  onAddNote,
}: {
  updates: ActionUpdate[];
  onAddNote: (note: string) => Promise<void>;
}) {
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const tooShort = note.trim().length < 2;

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (tooShort) return;
    setSaving(true);
    setError(null);
    try {
      await onAddNote(note.trim());
      setNote('');
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Suivi</CardTitle>
        <CardDescription>
          Les notes sont internes aux RH. Les changements de statut, de responsable et d’échéance sont ajoutés
          automatiquement.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-6">
        <form onSubmit={handleSubmit} className="flex flex-col gap-2">
          <label htmlFor="action-note" className="text-sm font-medium">
            Ajouter une note
          </label>
          <textarea
            id="action-note"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={3}
            maxLength={2000}
            placeholder="Ex : réunion de lancement prévue le 12 avec les managers"
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-xs outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
          />
          {error && (
            <Alert variant="destructive">
              <AlertCircle />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          <Button type="submit" size="sm" className="w-fit self-end" disabled={saving || tooShort}>
            {saving ? <Loader2 aria-hidden="true" className="animate-spin" /> : <MessageSquarePlus aria-hidden="true" />}
            Ajouter
          </Button>
        </form>

        <ol className="relative flex flex-col gap-5 border-l pl-5">
          {updates.map((u) => (
            <li key={u._id} className="relative">
              <span
                aria-hidden="true"
                className="absolute top-1.5 -left-[25px] size-2.5 rounded-full border-2 border-background bg-primary"
              />
              <p className="text-xs text-muted-foreground">
                <time dateTime={u.createdAt}>{dateTime.format(new Date(u.createdAt))}</time>
                {' · '}
                {u.authorId ? `${u.authorId.firstName} ${u.authorId.lastName}` : 'Compte supprimé'}
              </p>
              {u.statusFrom && u.statusTo && (
                <p className="mt-1 inline-flex items-center gap-1.5 rounded-full bg-muted px-2 py-0.5 text-xs font-medium">
                  {STATUS_LABELS[u.statusFrom]} <ArrowRight aria-label="vers" className="size-3" /> {STATUS_LABELS[u.statusTo]}
                </p>
              )}
              <p className="mt-1 text-sm whitespace-pre-line">{u.note}</p>
            </li>
          ))}
        </ol>
      </CardContent>
    </Card>
  );
}