'use client';

import { motion } from 'motion/react';
import { HeartHandshake, ListChecks, SearchCheck, TrendingUp } from 'lucide-react';
import { useLanguage } from './LanguageProvider';
import { fadeUp, revealOnScroll, stagger } from './motion-variants';
import { SectionHeading } from './Sectionheading';

// Une icône par avantage, dans le même ordre que les textes
const ICONS = [HeartHandshake, SearchCheck, ListChecks, TrendingUp];

export function Benefits() {
  const { t } = useLanguage();

  return (
    <section aria-labelledby="benefits-title" className="bg-white py-20 lg:py-28">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <SectionHeading
          id="benefits-title"
          eyebrow={t.benefits.eyebrow}
          title={t.benefits.title}
          description={t.benefits.description}
        />

        <motion.ul
          variants={stagger}
          {...revealOnScroll}
          className="mt-14 grid gap-10 sm:grid-cols-2 lg:grid-cols-4 lg:gap-8"
        >
          {t.benefits.items.map((benefit, index) => {
            const Icon = ICONS[index];
            return (
              <motion.li key={benefit.title} variants={fadeUp} className="flex flex-col items-center text-center sm:items-start sm:text-left">
                <span className="flex size-12 items-center justify-center rounded-2xl bg-brand-50 ring-1 ring-brand-100">
                  <Icon aria-hidden="true" className="size-6 text-brand-600" />
                </span>
                <h3 className="mt-5 text-lg font-semibold text-slate-900">{benefit.title}</h3>
                <p className="mt-2 leading-relaxed text-slate-600">{benefit.text}</p>
              </motion.li>
            );
          })}
        </motion.ul>
      </div>
    </section>
  );
}