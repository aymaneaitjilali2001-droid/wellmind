import Link from 'next/link';
import type { ReactNode } from 'react';
import { ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';

type Variant = 'primary' | 'secondary' | 'ghost' | 'light' | 'outlineLight';
type Size = 'sm' | 'lg';

const VARIANTS: Record<Variant, string> = {
  // Bouton principal : vert WellMind
  primary: 'bg-brand-600 text-white shadow-sm hover:bg-brand-700 active:bg-brand-800',
  // Bouton secondaire : fond blanc, bordure verte claire
  secondary: 'border border-brand-200 bg-white text-brand-600 hover:bg-brand-50 active:bg-brand-100',
  // Lien discret (navbar)
  ghost: 'text-slate-700 hover:bg-slate-100 hover:text-brand-600 active:bg-slate-200',
  // Bouton clair, pour les fonds verts foncés (appel à l'action final)
  light: 'bg-white text-brand-700 shadow-sm hover:bg-brand-50 active:bg-brand-100',
  // Contour blanc, pour les fonds verts foncés
  outlineLight: 'border border-white/40 text-white hover:bg-white/10 active:bg-white/20',
};

const SIZES: Record<Size, string> = {
  sm: 'h-10 px-4 text-sm',
  lg: 'h-12 px-6 text-base',
};

// Lien avec l'apparence d'un bouton. withArrow ajoute une flèche qui glisse au survol.
export function CtaLink({
  href,
  variant = 'primary',
  size = 'lg',
  withArrow = false,
  className,
  onClick,
  children,
}: {
  href: string;
  variant?: Variant;
  size?: Size;
  withArrow?: boolean;
  className?: string;
  onClick?: () => void;
  children: ReactNode;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className={cn(
        'group inline-flex items-center justify-center gap-2 rounded-xl font-semibold whitespace-nowrap',
        'transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600',
        VARIANTS[variant],
        SIZES[size],
        className
      )}
    >
      {children}
      {withArrow && (
        <ArrowRight
          aria-hidden="true"
          className="size-4 transition-transform duration-200 group-hover:translate-x-0.5 motion-reduce:transition-none"
        />
      )}
    </Link>
  );
}