'use client';

import { AlertCircle, Loader2 } from 'lucide-react';
import { DepartmentsCard } from '@/components/organization/DepartmentsCard';
import { GeneralInfoCard } from '@/components/organization/GeneralInfoCard';
import { PrivacyThresholdCard } from '@/components/organization/PrivacyThresholdCard';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/Authcontext';
import { useOrganization } from '@/hooks/useEmployees';
import { getErrorMessage } from '@/lib/Api';
import { updateOrganization, type UpdateOrganizationInput } from '@/services/organization';

export default function OrganizationPage() {
  const { data: organization, error, isLoading, mutate } = useOrganization();
  const { refresh } = useAuth();

  // Enregistre, met à jour le cache SWR, puis la session (le nom s'affiche dans l'en-tête)
  const save = async (input: UpdateOrganizationInput) => {
    const updated = await updateOrganization(input);
    await mutate(updated, { revalidate: false });
    await refresh();
    return updated;
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="size-6 animate-spin text-muted-foreground" aria-label="Chargement" />
      </div>
    );
  }

  if (error || !organization) {
    return (
      <Alert variant="destructive">
        <AlertCircle />
        <AlertTitle>Impossible de charger l’organisation</AlertTitle>
        <AlertDescription>
          <p>{getErrorMessage(error)}</p>
          <Button variant="outline" size="sm" className="mt-3" onClick={() => mutate()}>
            Réessayer
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">Organisation</h1>
        <p className="mt-1 text-muted-foreground">
          Paramètres communs à tous les comptes de {organization.name}. Chaque carte s’enregistre séparément.
        </p>
      </div>

      <GeneralInfoCard organization={organization} onSave={save} />
      <DepartmentsCard organization={organization} onSave={save} />
      <PrivacyThresholdCard organization={organization} onSave={save} />
    </div>
  );
}