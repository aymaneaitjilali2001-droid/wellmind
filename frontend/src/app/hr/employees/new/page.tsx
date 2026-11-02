'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useSWRConfig } from 'swr';
import { ArrowLeft, Check, Copy, UserPlus } from 'lucide-react';
import { ButtonLink } from '@/components/Buttonlink';
import { EmployeeForm, type EmployeeFormValues } from '@/components/employees/Employeeform';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { isEmployeesKey, useOrganization } from '@/hooks/useEmployees';
import { createEmployee } from '@/services/employees';
import type { Employee } from '@/types/user';

// Écran affiché après la création : les identifiants à transmettre à l'employé
function CreatedPanel({
  employee,
  password,
  onAddAnother,
}: {
  employee: Employee;
  password: string;
  onAddAnother: () => void;
}) {
  const [copied, setCopied] = useState(false);

  const credentials = `Adresse de connexion : ${employee.email}\nMot de passe provisoire : ${password}`;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(credentials);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Copie refusée par le navigateur : l'utilisateur peut sélectionner le texte
    }
  };

  return (
    <Card>
      <CardHeader>
        <span className="mb-2 flex size-10 items-center justify-center rounded-full bg-brand-100">
          <Check aria-hidden="true" className="size-5 text-brand-700" />
        </span>
        <CardTitle className="text-xl">
          Compte créé pour {employee.firstName} {employee.lastName}
        </CardTitle>
        <CardDescription>
          Transmettez ces identifiants à l’employé de façon sécurisée. Le mot de passe ne sera plus affiché
          après avoir quitté cette page.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <dl className="grid gap-3 rounded-lg border bg-muted/40 p-4 text-sm sm:grid-cols-[auto_1fr]">
          <dt className="text-muted-foreground">E-mail</dt>
          <dd className="font-medium break-all">{employee.email}</dd>
          <dt className="text-muted-foreground">Mot de passe provisoire</dt>
          <dd className="font-mono font-medium break-all">{password}</dd>
        </dl>

        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
          <Button variant="outline" onClick={copy}>
            {copied ? <Check aria-hidden="true" /> : <Copy aria-hidden="true" />}
            {copied ? 'Copié' : 'Copier les identifiants'}
          </Button>
          <Button variant="outline" onClick={onAddAnother}>
            <UserPlus aria-hidden="true" /> Ajouter un autre employé
          </Button>
          <ButtonLink href="/hr/employees" className="sm:ml-auto">
            Retour à la liste
          </ButtonLink>
        </div>
        <p role="status" className="sr-only">
          {copied ? 'Identifiants copiés' : ''}
        </p>
      </CardContent>
    </Card>
  );
}

export default function NewEmployeePage() {
  const { data: organization } = useOrganization();
  const { mutate } = useSWRConfig();
  const [created, setCreated] = useState<{ employee: Employee; password: string } | null>(null);

  const handleCreate = async (values: EmployeeFormValues) => {
    const employee = await createEmployee({
      firstName: values.firstName,
      lastName: values.lastName,
      email: values.email,
      password: values.password,
      role: values.role,
      department: values.department || undefined,
    });
    // Toutes les listes d'employés en cache sont rechargées
    await mutate(isEmployeesKey);
    setCreated({ employee, password: values.password });
  };

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <Link
        href="/hr/employees"
        className="inline-flex w-fit items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft aria-hidden="true" className="size-4" /> Employés
      </Link>

      {created ? (
        <CreatedPanel employee={created.employee} password={created.password} onAddAnother={() => setCreated(null)} />
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">Ajouter un employé</CardTitle>
            <CardDescription>
              Le compte pourra se connecter immédiatement avec l’e-mail et le mot de passe provisoire.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <EmployeeForm
              mode="create"
              departments={organization?.departments ?? []}
              submitLabel="Créer le compte"
              cancelHref="/hr/employees"
              onSubmit={handleCreate}
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
}