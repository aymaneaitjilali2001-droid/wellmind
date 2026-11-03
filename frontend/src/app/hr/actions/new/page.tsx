'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSWRConfig } from 'swr';
import { ArrowLeft } from 'lucide-react';
import { ActionForm } from '@/components/actions/ActionForm';
import { AiRecommendationsHint } from '@/components/actions/AiRecommendationsHint';
import { Card, CardContent } from '@/components/ui/card';
import { isActionsKey } from '@/hooks/useActions';
import { toActionInput, type ActionFormValues } from '@/lib/action-form';
import { createAction } from '@/services/actions';

export default function NewActionPage() {
  const router = useRouter();
  const { mutate } = useSWRConfig();

  const handleCreate = async (values: ActionFormValues) => {
    const action = await createAction(toActionInput(values, 'create'));
    await mutate(isActionsKey); // liste et chiffres du tableau de bord
    router.replace(`/hr/actions/${action._id}`);
  };

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <Link
        href="/hr/actions"
        className="inline-flex w-fit items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft aria-hidden="true" className="size-4" /> Toutes les actions
      </Link>
      <div>
        <h1 className="text-2xl font-semibold">Nouvelle action</h1>
        <p className="mt-1 text-muted-foreground">
          Une action améliore une pratique de l’organisation : elle a un responsable, une échéance et un suivi.
        </p>
      </div>
      <AiRecommendationsHint />
      <Card>
        <CardContent>
          <ActionForm mode="create" submitLabel="Créer l’action" cancelHref="/hr/actions" onSubmit={handleCreate} />
        </CardContent>
      </Card>
    </div>
  );
}