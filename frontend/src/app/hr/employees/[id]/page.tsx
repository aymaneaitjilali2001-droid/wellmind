'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useSWRConfig } from 'swr';
import { isAxiosError } from 'axios';
import { AlertCircle, ArrowLeft, Check, Loader2, UserX } from 'lucide-react';
import { ButtonLink } from '@/components/Buttonlink';
import { EmployeeInitials, RoleBadge, StatusBadge } from '@/components/employees/Employeebadges';
import { EmployeeForm, EMPTY_EMPLOYEE, type EmployeeFormValues } from '@/components/employees/Employeeform';
import { EmployeeStatusCard } from '@/components/employees/Employeestatuscard';
import { ResetPasswordCard } from '@/components/employees/Resetpasswordcard';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/context/Authcontext';
import { isEmployeesKey, useEmployee, useOrganization } from '@/hooks/useEmployees';
import { getErrorMessage } from '@/lib/Api';
import { updateEmployee } from '@/services/employees';

const dateFormat = new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });

export default function EmployeeDetailPage() {
  // L'id vient de l'URL : /hr/employees/[id]
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { data: employee, error, isLoading, mutate } = useEmployee(id ?? null);
  const { data: organization } = useOrganization();
  const { mutate: mutateCache } = useSWRConfig();
  const [saved, setSaved] = useState(false);

  // Le message « Modifications enregistrées » disparaît après 4 secondes
  useEffect(() => {
    if (!saved) return;
    const timer = setTimeout(() => setSaved(false), 4000);
    return () => clearTimeout(timer);
  }, [saved]);

  // Recharge cette fiche ET toutes les listes d'employés (les deux commencent par /users)
  const refreshAll = () => mutateCache(isEmployeesKey);

  const handleSave = async (values: EmployeeFormValues) => {
    await updateEmployee(id, {
      firstName: values.firstName,
      lastName: values.lastName,
      email: values.email,
      role: values.role,
      department: values.department,
    });
    await refreshAll();
    setSaved(true);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="size-6 animate-spin text-muted-foreground" aria-label="Chargement" />
      </div>
    );
  }

  // Identifiant inconnu ou mal formé (404 / 400 du backend), ou employé d'une autre organisation
  const notFound = isAxiosError(error) && (error.response?.status === 404 || error.response?.status === 400);

  if (notFound) {
    return (
      <div className="mx-auto flex max-w-md flex-col items-center gap-3 py-16 text-center">
        <UserX aria-hidden="true" className="size-8 text-muted-foreground" />
        <h1 className="text-xl font-semibold">Employé introuvable</h1>
        <p className="text-muted-foreground">Ce compte n’existe pas ou n’appartient pas à votre organisation.</p>
        <ButtonLink href="/hr/employees" variant="outline" className="mt-2">
          Retour à la liste
        </ButtonLink>
      </div>
    );
  }

  if (error || !employee) {
    return (
      <Alert variant="destructive">
        <AlertCircle />
        <AlertTitle>Impossible de charger cet employé</AlertTitle>
        <AlertDescription>
          <p>{getErrorMessage(error)}</p>
          <Button variant="outline" size="sm" className="mt-3" onClick={() => mutate()}>
            Réessayer
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  const isSelf = employee._id === user?._id;

  const initialValues: EmployeeFormValues = {
    ...EMPTY_EMPLOYEE,
    firstName: employee.firstName,
    lastName: employee.lastName,
    email: employee.email,
    role: employee.role,
    department: employee.department ?? '',
  };

  return (
    <div className="flex flex-col gap-6">
      <Link
        href="/hr/employees"
        className="inline-flex w-fit items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft aria-hidden="true" className="size-4" /> Employés
      </Link>

      {/* En-tête de la fiche */}
      <div className="flex items-center gap-4">
        <EmployeeInitials employee={employee} size="lg" />
        <div className="min-w-0">
          <h1 className="text-2xl font-semibold">
            {employee.firstName} {employee.lastName}
            {isSelf && <span className="ml-2 text-base font-normal text-muted-foreground">(vous)</span>}
          </h1>
          <p className="truncate text-muted-foreground">{employee.email}</p>
          <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            <RoleBadge role={employee.role} />
            <StatusBadge active={employee.isActive} />
            <span>Ajouté le {dateFormat.format(new Date(employee.createdAt))}</span>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Modification des informations */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Informations</CardTitle>
            <CardDescription>Nom, adresse de connexion, rôle et service.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            {saved && (
              <Alert>
                <Check />
                <AlertDescription>Modifications enregistrées.</AlertDescription>
              </Alert>
            )}
            <EmployeeForm
              key={employee._id}
              mode="edit"
              initialValues={initialValues}
              departments={organization?.departments ?? []}
              submitLabel="Enregistrer"
              cancelHref="/hr/employees"
              roleLocked={isSelf}
              onSubmit={handleSave}
            />
          </CardContent>
        </Card>

        {/* Statut et mot de passe */}
        <div className="flex flex-col gap-6">
          <EmployeeStatusCard employee={employee} isSelf={isSelf} onChanged={refreshAll} />
          {!isSelf && <ResetPasswordCard employee={employee} />}
        </div>
      </div>
    </div>
  );
}