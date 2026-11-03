'use client';

import { useState, type ChangeEvent, type FormEvent } from 'react';
import { isAxiosError } from 'axios';
import { AlertCircle, Eye, EyeOff, KeyRound, Loader2 } from 'lucide-react';
import { ButtonLink } from '@/components/Buttonlink';
import { FormField } from '@/components/FormField';
import { SelectField } from '@/components/Selectfield';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { getErrorDetails, getErrorMessage } from '@/lib/Api';
import { generatePassword, PASSWORD_HINT, passwordError } from '@/lib/password';
import type { Role } from '@/types/Auth';

// ---------------------------------------------------------------
// Formulaire employé, utilisé pour l'ajout (mode "create")
// et pour la modification (mode "edit", sans mot de passe).
// ---------------------------------------------------------------

export interface EmployeeFormValues {
  firstName: string;
  lastName: string;
  email: string;
  role: Role;
  department: string;
  password: string;
  confirmPassword: string;
}

type FieldErrors = Partial<Record<keyof EmployeeFormValues, string>>;

export const EMPTY_EMPLOYEE: EmployeeFormValues = {
  firstName: '',
  lastName: '',
  email: '',
  role: 'EMPLOYEE',
  department: '',
  password: '',
  confirmPassword: '',
};

// Mêmes règles que le backend (validatePassword, modèle User)
const validate = (v: EmployeeFormValues, mode: 'create' | 'edit'): FieldErrors => {
  const errors: FieldErrors = {};
  if (v.firstName.trim().length < 2) errors.firstName = 'Au moins 2 caractères.';
  if (v.lastName.trim().length < 2) errors.lastName = 'Au moins 2 caractères.';
  if (!/^\S+@\S+\.\S+$/.test(v.email.trim())) errors.email = 'Adresse e-mail invalide.';

  if (mode === 'create') {
    errors.password = passwordError(v.password);
    if (v.confirmPassword !== v.password) errors.confirmPassword = 'Les mots de passe ne correspondent pas.';
  }
  // Retire les champs sans erreur (passwordError renvoie undefined si tout va bien)
  return Object.fromEntries(Object.entries(errors).filter(([, message]) => message)) as FieldErrors;
};

export function EmployeeForm({
  mode,
  initialValues = EMPTY_EMPLOYEE,
  departments,
  submitLabel,
  cancelHref,
  roleLocked = false,
  onSubmit,
}: {
  mode: 'create' | 'edit';
  initialValues?: EmployeeFormValues;
  departments: string[];
  submitLabel: string;
  cancelHref: string;
  // true quand le RH modifie son propre compte : il ne peut pas se retirer le rôle RH
  roleLocked?: boolean;
  onSubmit: (values: EmployeeFormValues) => Promise<void>;
}) {
  const [values, setValues] = useState<EmployeeFormValues>(initialValues);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [error, setError] = useState<string | null>(null);
  const [details, setDetails] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const set = (name: keyof EmployeeFormValues, value: string) => {
    setValues((prev) => ({ ...prev, [name]: value }));
    setFieldErrors((prev) => ({ ...prev, [name]: undefined }));
  };

  const bind = (name: keyof EmployeeFormValues) => ({
    name,
    value: values[name],
    error: fieldErrors[name],
    onChange: (event: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => set(name, event.target.value),
  });

  const handleGenerate = () => {
    const password = generatePassword();
    setValues((prev) => ({ ...prev, password, confirmPassword: password }));
    setFieldErrors((prev) => ({ ...prev, password: undefined, confirmPassword: undefined }));
    setShowPassword(true);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setDetails([]);

    const errors = validate(values, mode);
    setFieldErrors(errors);
    if (Object.keys(errors).length) return;

    setSubmitting(true);
    try {
      await onSubmit({
        ...values,
        firstName: values.firstName.trim(),
        lastName: values.lastName.trim(),
        email: values.email.trim(),
      });
    } catch (err) {
      // E-mail déjà utilisé : l'erreur s'affiche sous le champ concerné
      if (isAxiosError(err) && err.response?.status === 409) {
        setFieldErrors((prev) => ({ ...prev, email: getErrorMessage(err) }));
      } else {
        setError(getErrorMessage(err, 'Enregistrement impossible. Réessayez.'));
        setDetails(getErrorDetails(err));
      }
    } finally {
      setSubmitting(false);
    }
  };

  // Si l'organisation a une liste de services, le backend n'accepte que ceux-là :
  // on propose donc une liste. Sinon, saisie libre.
  const hasDepartmentList = departments.length > 0;

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
      {error && (
        <Alert variant="destructive">
          <AlertCircle />
          <AlertTitle>{error}</AlertTitle>
          {details.length > 0 && (
            <AlertDescription>
              <ul className="list-disc pl-4">
                {details.map((d) => (
                  <li key={d}>{d}</li>
                ))}
              </ul>
            </AlertDescription>
          )}
        </Alert>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <FormField label="Prénom" autoComplete="off" {...bind('firstName')} />
        <FormField label="Nom" autoComplete="off" {...bind('lastName')} />
      </div>

      <FormField label="E-mail professionnel" type="email" autoComplete="off" {...bind('email')} />

      <div className="grid gap-4 sm:grid-cols-2">
        <SelectField
          label="Rôle"
          disabled={roleLocked}
          hint={roleLocked ? 'Vous ne pouvez pas modifier votre propre rôle.' : undefined}
          {...bind('role')}
        >
          <option value="EMPLOYEE">Employé</option>
          <option value="HR_ADMIN">Responsable RH</option>
        </SelectField>

        {hasDepartmentList ? (
          <SelectField label="Service" optional {...bind('department')}>
            <option value="">Aucun service</option>
            {departments.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
            {/* Service actuel qui ne figure plus dans la liste de l'organisation */}
            {values.department && !departments.includes(values.department) && (
              <option value={values.department}>{values.department}</option>
            )}
          </SelectField>
        ) : (
          <FormField
            label="Service"
            optional
            hint="Ajoutez des services dans « Organisation » pour proposer une liste."
            {...bind('department')}
          />
        )}
      </div>

      {mode === 'create' && (
        <fieldset className="flex flex-col gap-4 rounded-lg border p-4">
          <legend className="px-1 text-sm font-semibold">Mot de passe provisoire</legend>
          <p className="-mt-1 text-sm text-muted-foreground">
            Communiquez-le à l’employé de façon sécurisée. Il pourra ensuite le changer.
          </p>

          <div className="grid gap-4 sm:grid-cols-2">
            <FormField
              label="Mot de passe"
              type={showPassword ? 'text' : 'password'}
              autoComplete="new-password"
              hint={PASSWORD_HINT}
              {...bind('password')}
            />
            <FormField
              label="Confirmer le mot de passe"
              type={showPassword ? 'text' : 'password'}
              autoComplete="new-password"
              {...bind('confirmPassword')}
            />
          </div>

          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="outline" size="sm" onClick={handleGenerate}>
              <KeyRound aria-hidden="true" /> Générer un mot de passe
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setShowPassword((v) => !v)}
              aria-pressed={showPassword}
            >
              {showPassword ? <EyeOff aria-hidden="true" /> : <Eye aria-hidden="true" />}
              {showPassword ? 'Masquer' : 'Afficher'}
            </Button>
          </div>
        </fieldset>
      )}

      <div className="flex flex-col-reverse gap-2 border-t pt-5 sm:flex-row sm:justify-end">
        <ButtonLink href={cancelHref} variant="outline">
          Annuler
        </ButtonLink>
        <Button type="submit" disabled={submitting}>
          {submitting && <Loader2 aria-hidden="true" className="animate-spin" />}
          {submitting ? 'Enregistrement…' : submitLabel}
        </Button>
      </div>
    </form>
  );
}