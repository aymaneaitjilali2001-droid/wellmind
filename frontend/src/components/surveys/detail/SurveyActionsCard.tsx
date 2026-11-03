'use client';

import { useState } from 'react';
import { AlertCircle, CircleCheck, Circle, CopyPlus, Lock, Pencil, Send, Trash2 } from 'lucide-react';
import { ButtonLink } from '@/components/Buttonlink';
import { ConfirmPanel } from '@/components/ConfirmPanel';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { getErrorDetails, getErrorMessage } from '@/lib/Api';
import { getSurveyTiming } from '@/lib/survey-dates';
import { getPublishChecklist } from '@/lib/survey-publish';
import { cn } from '@/lib/utils';
import type { Survey } from '@/types/survey';

type Action = 'publish' | 'close' | 'delete' | 'duplicate';

const dateFormat = new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'long' });

// Actions possibles selon le statut du sondage, avec une confirmation pour chacune
export function SurveyActionsCard({
  survey,
  onPublish,
  onClose,
  onDelete,
  onDuplicate,
}: {
  survey: Survey;
  onPublish: () => Promise<void>;
  onClose: () => Promise<void>;
  onDelete: () => Promise<void>;
  onDuplicate: () => Promise<void>;
}) {
  const [confirming, setConfirming] = useState<Action | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<{ message: string; details: string[] } | null>(null);

  const run = async (action: () => Promise<void>) => {
    setBusy(true);
    setError(null);
    try {
      await action();
      setConfirming(null);
    } catch (err) {
      setError({ message: getErrorMessage(err), details: getErrorDetails(err) });
    } finally {
      setBusy(false);
    }
  };

  const timing = getSurveyTiming(survey);
  const checklist = getPublishChecklist(survey);
  const canPublish = checklist.every((item) => item.ok);
  const startsLater = survey.startDate && new Date(survey.startDate) > new Date();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Actions</CardTitle>
        <CardDescription>
          {survey.status === 'DRAFT' && 'Les employés ne voient pas encore ce sondage.'}
          {timing === 'scheduled' && 'Publié : les employés pourront répondre à partir de la date de début.'}
          {timing === 'open' && 'En cours : les employés peuvent répondre.'}
          {timing === 'ended' && 'La date de fin est passée : clôturez le sondage pour figer ses résultats.'}
          {survey.status === 'CLOSED' && 'Clôturé : les résultats sont définitifs.'}
        </CardDescription>
      </CardHeader>

      <CardContent className="flex flex-col gap-3">
        {error && (
          <Alert variant="destructive">
            <AlertCircle />
            <AlertTitle>{error.message}</AlertTitle>
            {error.details.length > 0 && (
              <AlertDescription>
                <ul className="list-disc pl-4">
                  {error.details.map((d) => (
                    <li key={d}>{d}</li>
                  ))}
                </ul>
              </AlertDescription>
            )}
          </Alert>
        )}

        {/* ---------- Brouillon ---------- */}
        {survey.status === 'DRAFT' && (
          <>
            <div>
              <p className="mb-2 text-sm font-medium">Avant de publier</p>
              <ul className="flex flex-col gap-1.5 text-sm">
                {checklist.map((item) => (
                  <li key={item.label} className={cn('flex items-center gap-2', !item.ok && 'text-muted-foreground')}>
                    {item.ok ? (
                      <CircleCheck aria-hidden="true" className="size-4 text-brand-600" />
                    ) : (
                      <Circle aria-hidden="true" className="size-4" />
                    )}
                    <span>
                      {item.label}
                      <span className="sr-only">{item.ok ? ' : fait' : ' : à faire'}</span>
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            {confirming === 'publish' ? (
              <ConfirmPanel
                confirmLabel="Publier"
                busy={busy}
                onConfirm={() => run(onPublish)}
                onCancel={() => setConfirming(null)}
              >
                <p className="font-medium">Publier « {survey.title} » ?</p>
                <p className="mt-1 text-muted-foreground">
                  Les questions et le mode {survey.isAnonymous ? 'anonyme' : 'identifié'} ne pourront plus être
                  modifiés. Les employés pourront répondre
                  {startsLater && survey.startDate
                    ? ` à partir du ${dateFormat.format(new Date(survey.startDate))}.`
                    : ' dès maintenant.'}
                </p>
              </ConfirmPanel>
            ) : (
              <Button onClick={() => setConfirming('publish')} disabled={!canPublish || busy}>
                <Send aria-hidden="true" /> Publier
              </Button>
            )}

            <ButtonLink href={`/hr/surveys/${survey._id}/edit`} variant="outline">
              <Pencil aria-hidden="true" /> Modifier
            </ButtonLink>

            {confirming === 'delete' ? (
              <ConfirmPanel
                tone="danger"
                confirmLabel="Supprimer"
                busy={busy}
                onConfirm={() => run(onDelete)}
                onCancel={() => setConfirming(null)}
              >
                <p className="font-medium">Supprimer ce brouillon ?</p>
                <p className="mt-1 text-muted-foreground">Cette action est définitive.</p>
              </ConfirmPanel>
            ) : (
              <Button variant="ghost" className="text-destructive hover:text-destructive" onClick={() => setConfirming('delete')}>
                <Trash2 aria-hidden="true" /> Supprimer le brouillon
              </Button>
            )}
          </>
        )}

        {/* ---------- Publié ---------- */}
        {survey.status === 'PUBLISHED' && (
          <>
            {confirming === 'close' ? (
              <ConfirmPanel
                tone="danger"
                confirmLabel="Clôturer"
                busy={busy}
                onConfirm={() => run(onClose)}
                onCancel={() => setConfirming(null)}
              >
                <p className="font-medium">Clôturer le sondage ?</p>
                <p className="mt-1 text-muted-foreground">
                  Plus aucune réponse ne sera acceptée, et il ne pourra plus être modifié.
                </p>
              </ConfirmPanel>
            ) : (
              <Button
                variant={timing === 'ended' ? 'default' : 'outline'}
                onClick={() => setConfirming('close')}
              >
                <Lock aria-hidden="true" /> Clôturer
              </Button>
            )}
            <ButtonLink href={`/hr/surveys/${survey._id}/edit`} variant="outline">
              <Pencil aria-hidden="true" /> Modifier la description ou la date de fin
            </ButtonLink>
          </>
        )}

        {/* ---------- Clôturé ---------- */}
        {survey.status === 'CLOSED' && (
          <Button variant="outline" onClick={() => run(onDuplicate)} disabled={busy}>
            <CopyPlus aria-hidden="true" /> Dupliquer pour une nouvelle période
          </Button>
        )}
      </CardContent>
    </Card>
  );
}