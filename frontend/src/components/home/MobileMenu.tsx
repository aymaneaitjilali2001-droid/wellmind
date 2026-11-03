'use client';

import { useEffect, useId, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Menu, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { LanguageSwitch } from './LanguageSwitch';
import { useLanguage } from './LanguageProvider';
import { NAV_LINKS } from './nav-links';
import { CtaLink } from './Ctalink';

// Menu des petits écrans : bouton hamburger + panneau déroulant
export function MobileMenu({ className }: { className?: string }) {
  const { t } = useLanguage();
  const [open, setOpen] = useState(false);
  const panelId = useId();
  const buttonRef = useRef<HTMLButtonElement>(null);

  const close = () => setOpen(false);

  // Menu ouvert : Échap le ferme et rend le focus au bouton ;
  // il se ferme aussi si l'écran s'élargit jusqu'à la navbar complète
  useEffect(() => {
    if (!open) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false);
        buttonRef.current?.focus();
      }
    };
    const desktop = window.matchMedia('(min-width: 1024px)');
    const onResize = () => {
      if (desktop.matches) setOpen(false);
    };

    window.addEventListener('keydown', onKeyDown);
    desktop.addEventListener('change', onResize);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      desktop.removeEventListener('change', onResize);
    };
  }, [open]);

  return (
    <div className={className}>
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-controls={panelId}
        aria-label={open ? t.nav.closeMenu : t.nav.openMenu}
        className={cn(
          'flex size-10 items-center justify-center rounded-lg text-slate-700 transition-colors hover:bg-slate-100',
          'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600'
        )}
      >
        {open ? <X aria-hidden="true" className="size-5" /> : <Menu aria-hidden="true" className="size-5" />}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            id={panelId}
            key="mobile-menu"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="absolute inset-x-0 top-16 border-b border-slate-200 bg-white px-4 pt-2 pb-6 shadow-lg sm:px-6"
          >
            <nav aria-label={t.nav.mainNav} className="flex flex-col">
              {NAV_LINKS.map(({ href, key }) => (
                <a
                  key={href}
                  href={href}
                  onClick={close}
                  className={cn(
                    'rounded-lg px-3 py-3 text-base font-medium text-slate-700 transition-colors hover:bg-brand-50 hover:text-brand-600',
                    'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600'
                  )}
                >
                  {t.nav[key]}
                </a>
              ))}
            </nav>

            <div className="mt-4 flex flex-col gap-3 border-t border-slate-200 pt-4">
              <LanguageSwitch className="self-start" />
              <CtaLink href="/login" variant="secondary" onClick={close}>
                {t.nav.login}
              </CtaLink>
              <CtaLink href="/register" withArrow onClick={close}>
                {t.nav.start}
              </CtaLink>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}