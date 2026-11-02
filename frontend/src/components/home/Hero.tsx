'use client';

import { motion, type Variants } from 'motion/react';
import { ShieldCheck, Sparkles } from 'lucide-react';
import { CtaLink } from './Ctalink';
import { DashboardPreview } from './Dashboardpreview';
import { useLanguage } from './LanguageProvider';

// Le texte apparaît élément par élément (fondu + léger glissement vers le haut)
const container: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1, delayChildren: 0.05 } },
};

const item: Variants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' } },
};

export function Hero() {
  const { t } = useLanguage();

  return (
    <section aria-labelledby="hero-title" className="relative isolate overflow-hidden">
      {/* Halos décoratifs en arrière-plan */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -top-48 left-1/2 size-[40rem] -translate-x-1/2 rounded-full bg-brand-100/70 blur-3xl" />
        <div className="absolute top-40 -right-40 size-[26rem] rounded-full bg-amber-100/50 blur-3xl" />
      </div>

      <div className="mx-auto grid max-w-6xl items-center gap-14 px-4 py-16 sm:px-6 lg:grid-cols-2 lg:gap-16 lg:py-24">
        {/* Colonne de gauche : le message */}
        <motion.div variants={container} initial="hidden" animate="visible" className="flex flex-col items-start">
          <motion.p
            variants={item}
            className="inline-flex items-center gap-2 rounded-full border border-brand-200 bg-white/80 px-3 py-1 text-xs font-semibold text-brand-700 shadow-sm sm:text-sm"
          >
            <Sparkles aria-hidden="true" className="size-4 text-amber-500" />
            {t.hero.badge}
          </motion.p>

          <motion.h1
            id="hero-title"
            variants={item}
            className="mt-6 text-4xl font-bold tracking-tight text-balance text-slate-900 sm:text-5xl lg:text-[3.5rem] lg:leading-[1.1]"
          >
            {t.hero.title}
          </motion.h1>

          <motion.p variants={item} className="mt-6 max-w-xl text-lg leading-relaxed text-slate-600">
            {t.hero.description}
          </motion.p>

          <motion.div variants={item} className="mt-8 flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
            <CtaLink href="/register" withArrow>
              {t.hero.ctaPrimary}
            </CtaLink>
            <CtaLink href="/login" variant="secondary">
              {t.hero.ctaSecondary}
            </CtaLink>
          </motion.div>

          <motion.p variants={item} className="mt-6 flex max-w-xl items-start gap-2 text-sm text-slate-600">
            <ShieldCheck aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-brand-600" />
            {t.hero.reassurance}
          </motion.p>
        </motion.div>

        {/* Colonne de droite : l'aperçu du tableau de bord */}
        <DashboardPreview />
      </div>
    </section>
  );
}