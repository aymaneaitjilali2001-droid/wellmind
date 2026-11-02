'use client';

import { motion } from 'motion/react';
import { ClipboardList, LayoutDashboard, Sparkles, Target } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLanguage } from './LanguageProvider';
import { fadeUp, revealOnScroll, stagger } from './motion-variants';
import { SectionHeading } from './Sectionheading';

// Icône et couleur de fond de chaque fonctionnalité, dans le même ordre que les textes
const STYLES = [
  { icon: ClipboardList, tone: 'bg-brand-100 text-brand-700' },
  { icon: Sparkles, tone: 'bg-violet-100 text-violet-700' },
  { icon: Target, tone: 'bg-amber-100 text-amber-700' },
  { icon: LayoutDashboard, tone: 'bg-sky-100 text-sky-700' },
];

export function Features() {
  const { t } = useLanguage();

  return (
    <section id="features" aria-labelledby="features-title" className="scroll-mt-16 bg-slate-50 py-20 lg:py-28">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <SectionHeading
          id="features-title"
          eyebrow={t.features.eyebrow}
          title={t.features.title}
          description={t.features.description}
        />

        <motion.ul
          variants={stagger}
          {...revealOnScroll}
          className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4"
        >
          {t.features.items.map((feature, index) => {
            const { icon: Icon, tone } = STYLES[index];
            return (
              <motion.li
                key={feature.title}
                variants={fadeUp}
                // Au survol : la carte se soulève légèrement et son ombre s'accentue
                whileHover={{ y: -4 }}
                transition={{ type: 'spring', stiffness: 300, damping: 22 }}
                className="flex flex-col rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-shadow duration-300 hover:shadow-lg hover:shadow-slate-900/5"
              >
                <span className={cn('flex size-11 items-center justify-center rounded-xl', tone)}>
                  <Icon aria-hidden="true" className="size-5" />
                </span>
                <h3 className="mt-5 text-lg font-semibold text-slate-900">{feature.title}</h3>
                <p className="mt-2 text-[15px] leading-relaxed text-slate-600">{feature.text}</p>
              </motion.li>
            );
          })}
        </motion.ul>
      </div>
    </section>
  );
}