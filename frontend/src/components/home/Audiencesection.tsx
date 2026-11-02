'use client';

import { motion } from 'motion/react';
import { Briefcase, Check, Users } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLanguage } from './LanguageProvider';
import { fadeUp, revealOnScroll, stagger } from './motion-variants';
import { SectionHeading } from './Sectionheading';

export function AudienceSection() {
  const { t } = useLanguage();
  const a = t.audience;

  const cards = [
    { ...a.hr, icon: Briefcase, dark: true },
    { ...a.employee, icon: Users, dark: false },
  ];

  return (
    <section aria-labelledby="audience-title" className="bg-slate-50 py-20 lg:py-28">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <SectionHeading id="audience-title" eyebrow={a.eyebrow} title={a.title} />

        <motion.div variants={stagger} {...revealOnScroll} className="mt-14 grid gap-6 lg:grid-cols-2">
          {cards.map(({ title, text, points, icon: Icon, dark }) => (
            <motion.article
              key={title}
              variants={fadeUp}
              className={cn(
                'relative overflow-hidden rounded-3xl p-8 sm:p-10',
                dark
                  ? 'bg-linear-to-br from-brand-800 via-brand-700 to-brand-600 text-white shadow-xl shadow-brand-800/20'
                  : 'border border-brand-200 bg-white shadow-sm'
              )}
            >
              {/* Halo décoratif dans la carte RH */}
              {dark && (
                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute -top-20 -right-20 size-64 rounded-full bg-brand-300/20 blur-3xl"
                />
              )}

              <span
                className={cn(
                  'relative flex size-12 items-center justify-center rounded-2xl',
                  dark ? 'bg-white/10 ring-1 ring-white/20' : 'bg-brand-50 ring-1 ring-brand-100'
                )}
              >
                <Icon aria-hidden="true" className={cn('size-6', dark ? 'text-white' : 'text-brand-600')} />
              </span>
              <h3 className={cn('relative mt-6 text-2xl font-semibold', dark ? 'text-white' : 'text-slate-900')}>
                {title}
              </h3>
              <p className={cn('relative mt-2 leading-relaxed', dark ? 'text-brand-100' : 'text-slate-600')}>{text}</p>

              <ul className="relative mt-6 flex flex-col gap-3">
                {points.map((point) => (
                  <li key={point} className="flex items-start gap-3">
                    <span
                      className={cn(
                        'mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full',
                        dark ? 'bg-white/15' : 'bg-brand-100'
                      )}
                    >
                      <Check aria-hidden="true" className={cn('size-3.5', dark ? 'text-white' : 'text-brand-700')} />
                    </span>
                    <span className={dark ? 'text-white' : 'text-slate-700'}>{point}</span>
                  </li>
                ))}
              </ul>
            </motion.article>
          ))}
        </motion.div>
      </div>
    </section>
  );
}