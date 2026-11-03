'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState, type ChangeEvent, type FormEvent } from 'react';
import { AlertCircle, Loader2, UserPlus } from 'lucide-react';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/context/Authcontext';
import { getErrorDetails, getErrorMessage } from '@/lib/Api';
import { homeForRole } from '@/lib/Routes';
import { FormField } from '@/components/FormField';

// ---------------------------------------------------------------
// Inscription : un responsable RH crée son organisation et son compte.
// Les employés ne s'inscrivent pas : c'est le RH qui crée leurs comptes.
// ---------------------------------------------------------------

interface FormValues {
  organizationName: string;
  industry: string;
  size: string;
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;
}

type FieldErrors = Partial<Record<keyof FormValues, string>>;

const INITIAL: FormValues = {
  organizationName: '',
  industry: '',
  size: '',
  firstName: '',
  lastName: '',
  email: '',
  password: '',
  confirmPassword: '',
};

// Mêmes règles que le backend (validatePassword et modèles Mongoose)
const validate = (v: FormValues): FieldErrors => {
  const errors: FieldErrors = {};

  if (v.organizationName.trim().length < 2) errors.organizationName = 'Au moins 2 caractères.';
  if (v.size && (!/^\d+$/.test(v.size) || Number(v.size) < 1)) errors.size = 'Un nombre entier supérieur à 0.';
  if (v.firstName.trim().length < 2) errors.firstName = 'Au moins 2 caractères.';
  if (v.lastName.trim().length < 2) errors.lastName = 'Au moins 2 caractères.';
  if (!/^\S+@\S+\.\S+$/.test(v.email.trim())) errors.email = 'Adresse e-mail invalide.';

  if (v.password.length < 8) errors.password = 'Au moins 8 caractères.';
  else if (!/[A-Za-z]/.test(v.password) || !/\d/.test(v.password)) {
    errors.password = 'Au moins une lettre et un chiffre.';
  }
  if (v.confirmPassword !== v.password) errors.confirmPassword = 'Les mots de passe ne correspondent pas.';

  return errors;
};

export default function RegisterPage() {
  const { register, status, user } = useAuth();
  const router = useRouter();

  const [values, setValues] = useState<FormValues>(INITIAL);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [error, setError] = useState<string | null>(null);
  const [details, setDetails] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (status === 'authenticated' && user) router.replace(homeForRole(user.role));
  }, [status, user, router]);

  // Propriétés communes d'un champ. L'erreur s'efface dès que l'utilisateur corrige.
  const bind = (name: keyof FormValues) => ({
    name,
    value: values[name],
    error: fieldErrors[name],
    onChange: (event: ChangeEvent<HTMLInputElement>) => {
      setValues((prev) => ({ ...prev, [name]: event.target.value }));
      setFieldErrors((prev) => ({ ...prev, [name]: undefined }));
    },
  });

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setDetails([]);

    const errors = validate(values);
    setFieldErrors(errors);
    if (Object.keys(errors).length) return;

    setSubmitting(true);
    try {
      const newUser = await register({
        organizationName: values.organizationName.trim(),
        industry: values.industry.trim() || undefined,
        size: values.size ? Number(values.size) : undefined,
        firstName: values.firstName.trim(),
        lastName: values.lastName.trim(),
        email: values.email.trim(),
        password: values.password,
      });
      router.replace(homeForRole(newUser.role));
    } catch (err) {
      setError(getErrorMessage(err, 'Inscription impossible. Réessayez.'));
      setDetails(getErrorDetails(err));
      setSubmitting(false);
    }
  };

  if (status !== 'anonymous') {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <Loader2 className="size-6 animate-spin text-muted-foreground" aria-label="Chargement" />
      </main>
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-8">
      <Card className="w-full max-w-xl">
        <CardHeader>
          <p className="mb-2 text-xl font-bold text-brand-600">WellMind</p>
          <CardTitle className="text-2xl">Créer votre organisation</CardTitle>
          <CardDescription>
            Vous serez l’administrateur RH. Vous ajouterez ensuite les comptes de vos employés.
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
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

            <h2 className="mt-1 text-xs font-semibold tracking-wide text-muted-foreground uppercase">Organisation</h2>
            <FormField label="Nom de l'organisation" autoComplete="organization" {...bind('organizationName')} />
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField label="Secteur d'activité" optional {...bind('industry')} />
              <FormField label="Nombre de salariés" optional inputMode="numeric" {...bind('size')} />
            </div>

            <h2 className="mt-2 text-xs font-semibold tracking-wide text-muted-foreground uppercase">Votre compte RH</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField label="Prénom" autoComplete="given-name" {...bind('firstName')} />
              <FormField label="Nom" autoComplete="family-name" {...bind('lastName')} />
            </div>
            <FormField label="E-mail professionnel" type="email" autoComplete="email" {...bind('email')} />
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                label="Mot de passe"
                type="password"
                autoComplete="new-password"
                hint="8 caractères minimum, avec une lettre et un chiffre."
                {...bind('password')}
              />
              <FormField
                label="Confirmer le mot de passe"
                type="password"
                autoComplete="new-password"
                {...bind('confirmPassword')}
              />
            </div>

            <Button type="submit" disabled={submitting} className="mt-2 w-full">
              {submitting ? <Loader2 className="animate-spin" /> : <UserPlus />}
              {submitting ? 'Création…' : "Créer l'organisation"}
            </Button>
          </form>
        </CardContent>

        <CardFooter className="justify-center text-sm text-muted-foreground">
          Déjà un compte ?&nbsp;
          <Link href="/login" className="font-semibold text-primary hover:underline">
            Se connecter
          </Link>
        </CardFooter>
      </Card>
    </main>
  );
}