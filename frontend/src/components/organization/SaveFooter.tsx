import { AlertCircle, Check, Loader2 } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';

// Bas de carte commun : erreur éventuelle, message « enregistré », Annuler / Enregistrer.
// Les boutons restent grisés tant que rien n'a été modifié.
export function SaveFooter({
  dirty,
  saving,
  saved,
  error,
  details = [],
  onReset,
}: {
  dirty: boolean;
  saving: boolean;
  saved: boolean;
  error: string | null;
  details?: string[];
  onReset: () => void;
}) {
  return (
    <div className="flex flex-col gap-3 border-t pt-4">
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

      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-end">
        <p role="status" className="flex items-center gap-1.5 text-sm text-brand-700 sm:mr-auto">
          {saved && (
            <>
              <Check aria-hidden="true" className="size-4" /> Modifications enregistrées
            </>
          )}
        </p>
        <Button type="button" variant="outline" onClick={onReset} disabled={!dirty || saving}>
          Annuler
        </Button>
        <Button type="submit" disabled={!dirty || saving}>
          {saving && <Loader2 aria-hidden="true" className="animate-spin" />}
          Enregistrer
        </Button>
      </div>
    </div>
  );
}