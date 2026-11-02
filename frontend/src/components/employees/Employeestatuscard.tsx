'use client';

import { useState } from 'react';
import { AlertCircle, Loader2, UserCheck, UserX } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { getErrorMessage } from '@/lib/Api';
import { activateEmployee, deactivateEmployee } from '@/services/employees';
import type { Employee } from '@/types/user';
import { StatusBadge } from './Employeebadges';

// Désactivation / réactivation d'un compte, avec une confirmation avant de désactiver
export function EmployeeStatusCard({
  employee,
  isSelf,
  onChanged,
}: {
  employee: Employee;
  isSelf: boolean;
  onChanged: () => Promise<unknown>;
}) {
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const run = async (action: (id: string) => Promise<Employee>) => {
    setBusy(true);
    setError(null);
    try {
      await action(employee._id);
      await onChanged();
      setConfirming(false);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between gap-3">
          <CardTitle className="text-base">Statut du compte</CardTitle>
          <StatusBadge active={employee.isActive} />
        </div>
        <CardDescription>
          {employee.isActive
            ? 'Un compte désactivé ne peut plus se connecter. Ses participations passées sont conservées.'
            : 'Ce compte ne peut plus se connecter. Vous pouvez le réactiver à tout moment.'}
        </CardDescription>
      </CardHeader>

      <CardContent className="flex flex-col gap-3">
        {error && (
          <Alert variant="destructive">
            <AlertCircle />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {isSelf ? (
          <p className="text-sm text-muted-foreground">Vous ne pouvez pas désactiver votre propre compte.</p>
        ) : employee.isActive ? (
          confirming ? (
            // Étape de confirmation : évite une désactivation par erreur
            <div className="flex flex-col gap-3 rounded-lg border border-destructive/30 bg-destructive/5 p-3">
              <p className="text-sm font-medium">
                Désactiver le compte de {employee.firstName} {employee.lastName} ?
              </p>
              <div className="flex gap-2">
                <Button variant="destructive" size="sm" onClick={() => run(deactivateEmployee)} disabled={busy}>
                  {busy && <Loader2 aria-hidden="true" className="animate-spin" />}
                  Confirmer
                </Button>
                <Button variant="outline" size="sm" onClick={() => setConfirming(false)} disabled={busy}>
                  Annuler
                </Button>
              </div>
            </div>
          ) : (
            <Button variant="outline" onClick={() => setConfirming(true)} className="text-destructive">
              <UserX aria-hidden="true" /> Désactiver le compte
            </Button>
          )
        ) : (
          <Button variant="outline" onClick={() => run(activateEmployee)} disabled={busy}>
            {busy ? <Loader2 aria-hidden="true" className="animate-spin" /> : <UserCheck aria-hidden="true" />}
            Réactiver le compte
          </Button>
        )}
      </CardContent>
    </Card>
  );
}