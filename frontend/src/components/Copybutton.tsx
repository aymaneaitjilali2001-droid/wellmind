'use client';

import { useEffect, useState } from 'react';
import { Check, Copy } from 'lucide-react';
import { Button } from '@/components/ui/button';

// Bouton qui copie un texte dans le presse-papiers et affiche « Copié » 2 secondes
export function CopyButton({
  text,
  label = 'Copier',
  className,
}: {
  text: string;
  label?: string;
  className?: string;
}) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return;
    const timer = setTimeout(() => setCopied(false), 2000);
    return () => clearTimeout(timer);
  }, [copied]);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
    } catch {
      // Copie refusée par le navigateur : le texte reste sélectionnable à l'écran
    }
  };

  return (
    <>
      <Button type="button" variant="outline" onClick={copy} className={className}>
        {copied ? <Check aria-hidden="true" /> : <Copy aria-hidden="true" />}
        {copied ? 'Copié' : label}
      </Button>
      {/* Annonce pour les lecteurs d'écran */}
      <span role="status" className="sr-only">
        {copied ? 'Copié dans le presse-papiers' : ''}
      </span>
    </>
  );
}