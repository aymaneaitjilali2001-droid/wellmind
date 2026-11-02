import Link from 'next/link';
import { Leaf } from 'lucide-react';
import { cn } from '@/lib/utils';

// Logo WellMind. tone="light" pour les fonds sombres (pied de page).
export function Logo({ label, tone = 'dark' }: { label: string; tone?: 'dark' | 'light' }) {
  return (
    <Link
      href="/"
      aria-label={label}
      className="flex shrink-0 items-center gap-2 rounded-lg focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-600"
    >
      <span className="flex size-9 items-center justify-center rounded-xl bg-linear-to-br from-brand-500 to-brand-700 text-white shadow-sm">
        <Leaf aria-hidden="true" className="size-5" />
      </span>
      <span className={cn('text-lg font-bold tracking-tight', tone === 'dark' ? 'text-slate-900' : 'text-white')}>
        Well<span className={tone === 'dark' ? 'text-brand-600' : 'text-brand-300'}>Mind</span>
      </span>
    </Link>
  );
}