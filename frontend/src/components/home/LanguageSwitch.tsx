'use client';

import { cn } from '@/lib/utils';
import type { Lang } from '@/lib/home-translations';
import { useLanguage } from './LanguageProvider';

const LANGS: Lang[] = ['fr', 'en'];

// Sélecteur FR | EN
export function LanguageSwitch({ className }: { className?: string }) {
  const { lang, setLang, t } = useLanguage();

  return (
    <div
      role="group"
      aria-label={t.nav.languageLabel}
      className={cn('inline-flex rounded-lg border border-slate-200 bg-white p-0.5', className)}
    >
      {LANGS.map((code) => (
        <button
          key={code}
          type="button"
          onClick={() => setLang(code)}
          aria-pressed={lang === code}
          className={cn(
            'rounded-md px-2.5 py-1 text-xs font-semibold uppercase transition-colors',
            'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600',
            lang === code ? 'bg-brand-600 text-white' : 'text-slate-600 hover:text-brand-600'
          )}
        >
          {code}
        </button>
      ))}
    </div>
  );
}