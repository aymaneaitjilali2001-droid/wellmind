import { useEffect, useState } from 'react';

// Renvoie la valeur seulement après `delay` ms sans changement.
// Utilisé pour la recherche : on n'appelle pas l'API à chaque lettre tapée.
export function useDebouncedValue<T>(value: T, delay = 300): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debounced;
}