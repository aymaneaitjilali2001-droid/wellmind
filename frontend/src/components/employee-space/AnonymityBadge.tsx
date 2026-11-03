import { EyeOff, UserCheck } from 'lucide-react';
import { cn } from '@/lib/utils';

// Badge visible AVANT de répondre : l'employé doit savoir si ses réponses sont anonymes
export function AnonymityBadge({ isAnonymous, className }: { isAnonymous: boolean; className?: string }) {
  return isAnonymous ? (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full bg-brand-50 px-2.5 py-0.5 text-xs font-medium text-brand-700',
        className
      )}
    >
      <EyeOff aria-hidden="true" className="size-3.5" /> Anonyme
    </span>
  ) : (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-medium text-amber-800',
        className
      )}
    >
      <UserCheck aria-hidden="true" className="size-3.5" /> Identifié
    </span>
  );
}