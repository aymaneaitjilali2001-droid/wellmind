'use client';

import Link from 'next/link';
import { Logo } from './Logo';
import { useLanguage } from './LanguageProvider';
import { NAV_LINKS } from './nav-links';

const linkClass =
  'rounded text-sm text-brand-100 transition-colors hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-300';

// Pied de page : seulement des liens qui existent vraiment
// (pas de contact ni de mentions légales tant que ces pages n'existent pas)
export function Footer() {
  const { t } = useLanguage();
  const year = new Date().getFullYear();

  return (
    <footer className="bg-brand-800">
      <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
        <div className="grid gap-10 md:grid-cols-[2fr_1fr_1fr]">
          <div className="max-w-sm">
            <Logo label={t.nav.home} tone="light" />
            <p className="mt-4 text-sm leading-relaxed text-brand-100">{t.footer.description}</p>
          </div>

          <nav aria-label={t.footer.productNav}>
            <p className="text-sm font-semibold text-white">{t.footer.product}</p>
            <ul className="mt-4 flex flex-col gap-3">
              {NAV_LINKS.map(({ href, key }) => (
                <li key={href}>
                  <a href={href} className={linkClass}>
                    {t.nav[key]}
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          <nav aria-label={t.footer.accessNav}>
            <p className="text-sm font-semibold text-white">{t.footer.access}</p>
            <ul className="mt-4 flex flex-col gap-3">
              <li>
                <Link href="/login" className={linkClass}>
                  {t.footer.login}
                </Link>
              </li>
              <li>
                <Link href="/register" className={linkClass}>
                  {t.footer.register}
                </Link>
              </li>
            </ul>
          </nav>
        </div>

        <div className="mt-12 border-t border-white/10 pt-6 text-sm text-brand-200">
          © {year} WellMind. {t.footer.rights}
        </div>
      </div>
    </footer>
  );
}