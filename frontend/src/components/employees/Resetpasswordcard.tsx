'use client';

import { useState, type FormEvent } from 'react';
import { AlertCircle, Eye, EyeOff, KeyRound, Loader2 } from 'lucide-react';
import { CopyButton } from '@/components/Copybutton';
import { FormField } from '@/components/FormField';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { getErrorMessage } from '@/lib/Api';
import { generatePassword, PASSWORD_HINT, passwordError } from '@/lib/password';
import { resetEmployeePassword } from '@/services/employees';
import type { Employee } from '@/types/user';

// Réinitialisation du mot de passe par le RH (ex : employé qui a oublié le sien)
export function ResetPasswordCard({ employee }: { employee: Employee }) {
  const [open, setOpen] = useState(false);
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [show, setShow] = useState(false);
  const [errors, setErrors] = useState<{ password?: string; confirm?: string }>({});
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  // Nouveau mot de passe, affiché une seule fois après la réinitialisation
  const [done, setDone] = useState<string | null>(null);

  const reset = () => {
    setPassword('');
    setConfirm('');
    setShow(false);
    setErrors({});
    setError(null);
  };

  const handleGenerate = () => {
    const generated = generatePassword();
    setPassword(generated);
    setConfirm(generated);
    setErrors({});
    setShow(true);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    const nextErrors = {
      password: passwordError(password),
      confirm: confirm !== password ? 'Les mots de passe ne correspondent pas.' : undefined,
    };
    setErrors(nextErrors);
    if (nextErrors.password || nextErrors.confirm) return;

    setBusy(true);
    try {
      await resetEmployeePassword(employee._id, password);
      setDone(password);
      reset();
      setOpen(false);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Mot de passe</CardTitle>
        <CardDescription>
          Définissez un nouveau mot de passe provisoire si l’employé a perdu le sien.
        </CardDescription>
      </CardHeader>

      <CardContent className="flex flex-col gap-4">
        {done && (
          <div className="flex flex-col gap-3 rounded-lg border border-brand-200 bg-brand-50 p-3 text-sm">
            <p className="font-medium text-brand-800">Mot de passe réinitialisé. Transmettez-le à l’employé :</p>
            <p className="font-mono font-medium break-all">{done}</p>
            <div className="flex flex-wrap gap-2">
              <CopyButton
                text={`Adresse de connexion : ${employee.email}\nMot de passe provisoire : ${done}`}
                label="Copier les identifiants"
              />
              <Button variant="ghost" onClick={() => setDone(null)}>
                Terminé
              </Button>
            </div>
          </div>
        )}

        {!open && !done && (
          <Button variant="outline" onClick={() => setOpen(true)}>
            <KeyRound aria-hidden="true" /> Réinitialiser le mot de passe
          </Button>
        )}

        {open && (
          <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-3">
            {error && (
              <Alert variant="destructive">
                <AlertCircle />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <FormField
              label="Nouveau mot de passe"
              type={show ? 'text' : 'password'}
              autoComplete="new-password"
              hint={PASSWORD_HINT}
              value={password}
              error={errors.password}
              onChange={(e) => {
                setPassword(e.target.value);
                setErrors((prev) => ({ ...prev, password: undefined }));
              }}
            />
            <FormField
              label="Confirmer"
              type={show ? 'text' : 'password'}
              autoComplete="new-password"
              value={confirm}
              error={errors.confirm}
              onChange={(e) => {
                setConfirm(e.target.value);
                setErrors((prev) => ({ ...prev, confirm: undefined }));
              }}
            />
            <div className="flex flex-wrap gap-2">
              <Button type="button" variant="outline" size="sm" onClick={handleGenerate}>
                <KeyRound aria-hidden="true" /> Générer
              </Button>
              <Button type="button" variant="ghost" size="sm" onClick={() => setShow((v) => !v)} aria-pressed={show}>
                {show ? <EyeOff aria-hidden="true" /> : <Eye aria-hidden="true" />}
                {show ? 'Masquer' : 'Afficher'}
              </Button>
            </div>
            <div className="flex gap-2 border-t pt-3">
              <Button type="submit" disabled={busy}>
                {busy && <Loader2 aria-hidden="true" className="animate-spin" />}
                Enregistrer
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  reset();
                  setOpen(false);
                }}
                disabled={busy}
              >
                Annuler
              </Button>
            </div>
          </form>
        )}
      </CardContent>
    </Card>
  );
}