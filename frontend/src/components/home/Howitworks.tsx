'use client';

import { motion } from 'motion/react';
import { ClipboardList, Lightbulb, MessageSquareText } from 'lucide-react';
import { useLanguage } from './LanguageProvider';
import { fadeUp, revealOnScroll, stagger } from './motion-variants';
import { SectionHeading } from './Sectionheading';

const ICONS = [ClipboardList, MessageSquareText, Lightbulb];

export function HowItWorks() {
  const { t } = useLanguage();
  const h = t.howItWorks;

  return (
    <section id="how-it-works" aria-labelledby="how-title" className="scroll-mt-16 bg-white py-20 lg:py-28">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <SectionHeading id="how-title" eyebrow={h.eyebrow} title={h.title} description={h.description} />

        <motion.ol variants={stagger} {...revealOnScroll} className="relative mt-16 grid gap-10 lg:grid-cols-3 lg:gap-8">
          {/* Ligne de connexion : horizontale sur ordinateur, verticale sur mobile.
              Elle se dessine au défilement (scaleX / scaleY). */}
          <motion.span
            aria-hidden="true"
            className="absolute top-7 right-[16.67%] left-[16.67%] hidden h-0.5 origin-left bg-linear-to-r from-brand-200 via-brand-300 to-brand-200 lg:block"
            initial={{ scaleX: 0 }}
            whileInView={{ scaleX: 1 }}
            viewport={{ once: true, amount: 0.5 }}
            transition={{ duration: 1, ease: 'easeInOut', delay: 0.3 }}
          />
          <motion.span
            aria-hidden="true"
            className="absolute top-7 bottom-7 left-7 w-0.5 origin-top bg-brand-200 lg:hidden"
            initial={{ scaleY: 0 }}
            whileInView={{ scaleY: 1 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 1, ease: 'easeInOut', delay: 0.3 }}
          />

          {h.steps.map((step, index) => {
            const Icon = ICONS[index];
            return (
              <motion.li
                key={step.title}
                variants={fadeUp}
                className="relative flex gap-5 lg:flex-col lg:items-center lg:text-center"
              >
                <span className="relative z-10 flex size-14 shrink-0 items-center justify-center rounded-full border-2 border-brand-200 bg-white shadow-sm ring-8 ring-white">
                  <Icon aria-hidden="true" className="size-6 text-brand-600" />
                  <span className="absolute -top-1 -right-1 flex size-6 items-center justify-center rounded-full bg-brand-600 text-xs font-bold text-white">
                    {index + 1}
                  </span>
                </span>
                <div>
                  <p className="text-sm font-semibold text-brand-600">
                    {h.stepLabel} {index + 1}
                  </p>
                  <h3 className="mt-1 text-xl font-semibold text-slate-900">{step.title}</h3>
                  <p className="mt-2 max-w-sm leading-relaxed text-slate-600 lg:mx-auto">{step.text}</p>
                </div>
              </motion.li>
            );
          })}
        </motion.ol>
      </div>
    </section>
  );
}