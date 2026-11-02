'use client';

import { useState, type FormEvent } from 'react';
import { FormField } from '@/components/FormField';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useSaveAction } from '@/hooks/useSaveAction';
import type { UpdateOrganizationInput } from '@/services/organization';
import type { Organization } from '@/types/auth';
import { SaveFooter } from './SaveFooter';

interface Values {
  name: string;
  industry: string;
  size: string;
}

const fromOrganization = (org: Organization): Values => ({
  name: org.name,
  industry: org.industry ?? '',
  size: org.size ? String(org.size) : '',
});

// Nom, secteur d'activité et taille de l'organisation
export function GeneralInfoCard({
  organization,
  onSave,
}: {
  organization: Organization;
  onSave: (input: UpdateOrganizationInput) => Promise<Organization>;
}) {
  const [initial, setInitial] = useState<Values>(() => fromOrganization(organization));
  const [values, setValues] = useState<Values>(initial);
  const [errors, setErrors] = useState<Partial<Record<keyof Values, string>>>({});
  const { run, saving, saved, error, details } = useSaveAction();

  const dirty = values.name !== initial.name || values.industry !== initial.industry || values.size !== initial.size;

  const set = (name: keyof Values, value: string) => {
    setValues((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: undefined }));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    // Mêmes règles que le modèle Organization (name : 2 à 120, size : entier ≥ 1)
    const nextErrors: typeof errors = {};
    if (values.name.trim().length < 2) nextErrors.name = 'Au moins 2 caractères.';
    if (values.name.trim().length > 120) nextErrors.name = '120 caractères maximum.';
    if (values.size && (!/^\d+$/.test(values.size) || Number(values.size) < 1)) {
      nextErrors.size = 'Un nombre entier supérieur à 0.';
    }
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;

    await run(async () => {
      const updated = await onSave({
        name: values.name.trim(),
        industry: values.industry.trim(),
        size: values.size ? Number(values.size) : null,
      });
      const next = fromOrganization(updated);
      setInitial(next);
      setValues(next);
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Informations générales</CardTitle>
        <CardDescription>Le nom de l’organisation apparaît dans l’en-tête de tous les comptes.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
          <FormField
            label="Nom de l'organisation"
            value={values.name}
            error={errors.name}
            onChange={(e) => set('name', e.target.value)}
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField
              label="Secteur d'activité"
              optional
              value={values.industry}
              onChange={(e) => set('industry', e.target.value)}
            />
            <FormField
              label="Nombre de salariés"
              optional
              inputMode="numeric"
              value={values.size}
              error={errors.size}
              onChange={(e) => set('size', e.target.value)}
            />
          </div>
          <SaveFooter
            dirty={dirty}
            saving={saving}
            saved={saved}
            error={error}
            details={details}
            onReset={() => {
              setValues(initial);
              setErrors({});
            }}
          />
        </form>
      </CardContent>
    </Card>
  );
}