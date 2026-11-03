import { EyeOff, UserCheck } from 'lucide-react';
import { cn } from '@/lib/utils';

// Message d'anonymat affiché en haut du formulaire, AVANT toute réponse.
// Le texte vient du backend (anonymityNotice), qui le déduit du sondage lui-même.
export function AnonymityNotice({ isAnonymous, notice }: { isAnonymous: boolean; notice: string }) {
  return (
    <div
      role="note"
      className={cn(
        'flex items-start gap-3 rounded-xl border p-4 text-sm',
        isAnonymous ? 'border-brand-200 bg-brand-50 text-brand-800' : 'border-amber-200 bg-amber-50 text-amber-900'
      )}
    >
      {isAnonymous ? (
        <EyeOff aria-hidden="true" className="mt-0.5 size-5 shrink-0" />
      ) : (
        <UserCheck aria-hidden="true" className="mt-0.5 size-5 shrink-0" />
      )}
      <div>
        <p className="font-semibold">{isAnonymous ? 'Sondage anonyme' : 'Sondage identifié'}</p>
        <p className="mt-0.5">{notice}</p>
        {isAnonymous && (
          <p className="mt-1 opacity-80">
            Les RH ne voient que des résultats regroupés, et seulement à partir d’un nombre minimum de réponses.
          </p>
        )}
      </div>
    </div>
  );
}