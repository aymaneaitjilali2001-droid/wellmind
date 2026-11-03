'use client';

import { motion } from 'motion/react';
import { CtaLink } from './Ctalink';
import { useLanguage } from './LanguageProvider';
import { revealOnScroll } from './motion-variants';

// Appel à l'action final : un grand bloc vert en dégradé
export function FinalCTA() {
  const { t } = useLanguage();

  return (
    <section aria-labelledby="cta-title" className="bg-white px-4 pb-20 sm:px-6 lg:pb-28">
      <motion.div
        {...revealOnScroll}
        variants={{
          hidden: { opacity: 0, y: 24, scale: 0.98 },
          visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.6, ease: 'easeOut' } },
        }}
        className="relative isolate mx-auto max-w-6xl overflow-hidden rounded-3xl bg-linear-to-br from-brand-700 via-brand-600 to-brand-500 px-6 py-16 text-center shadow-xl shadow-brand-800/20 sm:px-12 lg:py-20"
      >
        {/* Halos décoratifs */}
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute -top-24 -left-24 size-72 rounded-full bg-white/10 blur-3xl" />
          <div className="absolute -right-16 -bottom-28 size-80 rounded-full bg-amber-200/20 blur-3xl" />
        </div>

        <h2
          id="cta-title"
          className="mx-auto max-w-2xl text-3xl font-bold tracking-tight text-balance text-white sm:text-4xl lg:text-[2.5rem] lg:leading-tight"
        >
          {t.cta.title}
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-lg leading-relaxed text-brand-50">{t.cta.description}</p>

        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <CtaLink href="/register" variant="light" withArrow>
            {t.cta.primary}
          </CtaLink>
          <CtaLink href="/login" variant="outlineLight">
            {t.cta.secondary}
          </CtaLink>
        </div>
      </motion.div>
    </section>
  );
}