'use client';

import { motion } from 'motion/react';
import { Building2, Eraser, EyeOff, Info, Percent, ShieldCheck } from 'lucide-react';
import { useLanguage } from './LanguageProvider';
import { fadeUp, revealOnScroll, stagger } from './motion-variants';
import { SectionHeading } from './Sectionheading';

// Une icône par règle, dans le même ordre que les textes
const ICONS = [EyeOff, Percent, Eraser, Building2, ShieldCheck];

// Les règles décrites ici sont celles du backend (anonymat, seuil, désidentification,
// séparation des organisations). Ne rien promettre de plus que ce qu'il applique.
export function PrivacySection() {
  const { t } = useLanguage();
  const p = t.privacy;

  return (
    <section
      id="privacy"
      aria-labelledby="privacy-title"
      className="relative isolate scroll-mt-16 overflow-hidden bg-brand-800 py-20 lg:py-28"
    >
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -top-32 -left-32 size-[30rem] rounded-full bg-brand-600/40 blur-3xl" />
        <div className="absolute -right-24 -bottom-40 size-[26rem] rounded-full bg-brand-500/30 blur-3xl" />
      </div>

      <div className="mx-auto grid max-w-6xl gap-12 px-4 sm:px-6 lg:grid-cols-5 lg:gap-16">
        <div className="lg:col-span-2">
          <SectionHeading
            id="privacy-title"
            eyebrow={p.eyebrow}
            title={p.title}
            description={p.description}
            tone="light"
            className="mx-0 text-left"
          />

          <motion.aside
            variants={fadeUp}
            {...revealOnScroll}
            className="mt-8 rounded-2xl border border-amber-300/30 bg-amber-300/10 p-5"
          >
            <p className="flex items-center gap-2 text-sm font-semibold text-amber-200">
              <Info aria-hidden="true" className="size-4" />
              {p.noteTitle}
            </p>
            <p className="mt-2 text-sm leading-relaxed text-brand-50">{p.note}</p>
          </motion.aside>
        </div>

        <motion.ul variants={stagger} {...revealOnScroll} className="grid gap-4 sm:grid-cols-2 lg:col-span-3">
          {p.items.map((item, index) => {
            const Icon = ICONS[index];
            return (
              <motion.li
                key={item.title}
                variants={fadeUp}
                // La dernière règle occupe toute la largeur sur 2 colonnes (5 cartes)
                className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-sm last:sm:col-span-2"
              >
                <span className="flex size-10 items-center justify-center rounded-xl bg-white/10">
                  <Icon aria-hidden="true" className="size-5 text-brand-200" />
                </span>
                <h3 className="mt-4 font-semibold text-white">{item.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-brand-100">{item.text}</p>
              </motion.li>
            );
          })}
        </motion.ul>
      </div>
    </section>
  );
}