import { useCallback, useEffect, useState } from 'react';
import { getErrorDetails, getErrorMessage } from '@/lib/Api';

// État d'un enregistrement : en cours, réussi (pendant 3 s), ou en erreur.
//   const { run, saving, saved, error } = useSaveAction();
//   await run(() => updateOrganization({ name }));
export function useSaveAction() {
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [details, setDetails] = useState<string[]>([]);

  // Le message « enregistré » disparaît après 3 secondes
  useEffect(() => {
    if (!saved) return;
    const timer = setTimeout(() => setSaved(false), 3000);
    return () => clearTimeout(timer);
  }, [saved]);

  const run = useCallback(async (action: () => Promise<unknown>): Promise<boolean> => {
    setSaving(true);
    setSaved(false);
    setError(null);
    setDetails([]);
    try {
      await action();
      setSaved(true);
      return true;
    } catch (err) {
      setError(getErrorMessage(err, 'Enregistrement impossible. Réessayez.'));
      setDetails(getErrorDetails(err));
      return false;
    } finally {
      setSaving(false);
    }
  }, []);

  return { run, saving, saved, error, details };
}