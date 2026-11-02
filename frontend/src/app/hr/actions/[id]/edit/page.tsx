'use client';

import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useSWRConfig } from 'swr';
import { AlertCircle, ArrowLeft, Loader2, Lock } from 'lucide-react';
import { ActionForm } from '@/components/actions/ActionForm';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Card, CardContent } from '@/components/ui/card';
import { isActionsKey, useAction } from '@/hooks/useActions';
import { actionToValues, toActionInput, type ActionFormValues } from '@/lib/action-form';
import { getErrorMessage } from '@/lib/Api';
import { updateAction } from '@/services/actions';

export default function EditActionPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { data: action, error, isLoading } = useAction(id ?? null);
  const { mutate } = useSWRConfig();

  const handleSave = async (values: ActionFormValues) => {
    await updateAction(id, toActionInput(values, 'edit'));
    await mutate(isActionsKey); // détail, liste et chiffres
    router.push(`/hr/actions/${id}`);
  };

  const backLink = (
    <Link
      href={`/hr/actions/${id}`}
      className="inline-flex w-fit items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
    >
      <ArrowLeft aria-hidden="true" className="size-4" /> Retour à l’action
    </Link>
  );

  if (isLoading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="size-6 animate-spin text-muted-foreground" aria-label="Chargement" />
      </div>
    );
  }

  if (error || !action) {
    return (
      <div className="mx-auto flex max-w-3xl flex-col gap-6">
        {backLink}
        <Alert variant="destructive">
          <AlertCircle />
          <AlertTitle>Impossible de charger l’action</AlertTitle>
          <AlertDescription>{getErrorMessage(error)}</AlertDescription>
        </Alert>
      </div>
    );
  }

  // Le backend refuse de modifier une action annulée
  if (action.status === 'CANCELLED') {
    return (
      <div className="mx-auto flex max-w-xl flex-col gap-6">
        {backLink}
        <div className="flex flex-col items-center gap-3 rounded-xl border py-12 text-center">
          <Lock aria-hidden="true" className="size-8 text-muted-foreground" />
          <h1 className="text-xl font-semibold">Cette action est annulée</h1>
          <p className="max-w-sm text-muted-foreground">Replanifiez-la depuis sa page pour pouvoir la modifier.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      {backLink}
      <div>
        <h1 className="text-2xl font-semibold">Modifier l’action</h1>
        <p className="mt-1 text-muted-foreground">
          Les changements de responsable, d’échéance et de partage sont notés automatiquement dans le suivi.
        </p>
      </div>
      <Card>
        <CardContent>
          <ActionForm
            key={action._id}
            mode="edit"
            initialValues={actionToValues(action)}
            submitLabel="Enregistrer"
            cancelHref={`/hr/actions/${id}`}
            onSubmit={handleSave}
          />
        </CardContent>
      </Card>
    </div>
  );
}