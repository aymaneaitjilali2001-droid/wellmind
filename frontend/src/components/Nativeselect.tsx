import type { SelectHTMLAttributes } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

// Liste déroulante native, stylée comme les champs shadcn (mêmes couleurs de thème).
// Native = accessible au clavier et sur mobile sans aucune bibliothèque.
export function NativeSelect({ className, children, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <div className={cn('relative', className)}>
      <select
        className={cn(
          'h-9 w-full appearance-none rounded-md border border-input bg-background py-1 pr-9 pl-3 text-sm shadow-xs',
          'transition-colors outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50',
          'aria-invalid:border-destructive aria-invalid:ring-destructive/20',
          'disabled:cursor-not-allowed disabled:opacity-50'
        )}
        {...props}
      >
        {children}
      </select>
      <ChevronDown
        aria-hidden="true"
        className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-muted-foreground"
      />
    </div>
  );
}