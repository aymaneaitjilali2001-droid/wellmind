'use client';

import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { CtaLink } from './Ctalink';
import { LanguageSwitch } from './LanguageSwitch';
import { Logo } from './Logo';
import { useLanguage } from './LanguageProvider';
import { NAV_LINKS } from './nav-links';
import { MobileMenu } from './MobileMenu';

// Barre de navigation publique : fixe en haut, s'opacifie avec une ombre au défilement
export function Navbar() {
  const { t } = useLanguage();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll(); // page rechargée au milieu : état correct dès le départ
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header
      className={cn(
        'sticky top-0 z-50 border-b transition-[background-color,box-shadow,border-color] duration-300',
        scrolled
          ? 'border-slate-200/80 bg-white/80 shadow-sm backdrop-blur-md'
          : 'border-transparent bg-white/60 backdrop-blur-sm'
      )}
    >
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-6 px-4 sm:px-6">
        <Logo label={t.nav.home} />

        {/* Navbar complète à partir de lg (1024 px) */}
        <nav aria-label={t.nav.mainNav} className="hidden flex-1 items-center justify-center gap-1 lg:flex">
          {NAV_LINKS.map(({ href, key }) => (
            <a
              key={href}
              href={href}
              className={cn(
                'rounded-md px-3 py-2 text-sm font-medium text-slate-700 transition-colors hover:text-brand-600',
                'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600'
              )}
            >
              {t.nav[key]}
            </a>
          ))}
        </nav>

        <div className="hidden items-center gap-2 lg:flex">
          <LanguageSwitch className="mr-1" />
          <CtaLink href="/login" variant="ghost" size="sm">
            {t.nav.login}
          </CtaLink>
          <CtaLink href="/register" size="sm" withArrow>
            {t.nav.start}
          </CtaLink>
        </div>

        {/* Menu hamburger en dessous de lg */}
        <MobileMenu className="ml-auto lg:hidden" />
      </div>
    </header>
  );
}