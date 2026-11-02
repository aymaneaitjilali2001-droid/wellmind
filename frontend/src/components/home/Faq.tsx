'use client';

import { useId, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLanguage } from './LanguageProvider';
import { fadeUp, revealOnScroll } from './motion-variants';
import { SectionHeading } from './Sectionheading';

// Une question de la FAQ : bouton (aria-expanded) + zone de réponse (role="region")
function FaqItem({
  question,
  answer,
  open,
  onToggle,
}: {
  question: string;
  answer: string;
  open: boolean;
  onToggle: () => void;
}) {
  const id = useId();
  const buttonId = `${id}-button`;
  const panelId = `${id}-panel`;

  return (
    <li className="border-b border-slate-200 last:border-b-0">
      <h3>
        <button
          id={buttonId}
          type="button"
          onClick={onToggle}
          aria-expanded={open}
          aria-controls={panelId}
          className={cn(
            'flex w-full items-center justify-between gap-6 py-5 text-left text-base font-semibold text-slate-900 transition-colors hover:text-brand-600 sm:text-lg',
            'rounded-md focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-600'
          )}
        >
          {question}
          <ChevronDown
            aria-hidden="true"
            className={cn(
              'size-5 shrink-0 text-slate-400 transition-transform duration-200 motion-reduce:transition-none',
              open && 'rotate-180 text-brand-600'
            )}
          />
        </button>
      </h3>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            id={panelId}
            key="panel"
            role="region"
            aria-labelledby={buttonId}
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="overflow-hidden"
          >
            <p className="pr-10 pb-5 leading-relaxed text-slate-600">{answer}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </li>
  );
}

export function FAQ() {
  const { t } = useLanguage();
  // Une seule question ouverte à la fois (null = toutes fermées)
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section id="faq" aria-labelledby="faq-title" className="scroll-mt-16 bg-white py-20 lg:py-28">
      <div className="mx-auto max-w-3xl px-4 sm:px-6">
        <SectionHeading id="faq-title" eyebrow={t.faq.eyebrow} title={t.faq.title} />

        <motion.ul
          variants={fadeUp}
          {...revealOnScroll}
          className="mt-12 rounded-2xl border border-slate-200 bg-white px-6 shadow-sm sm:px-8"
        >
          {t.faq.items.map((item, index) => (
            <FaqItem
              key={item.question}
              question={item.question}
              answer={item.answer}
              open={openIndex === index}
              onToggle={() => setOpenIndex(openIndex === index ? null : index)}
            />
          ))}
        </motion.ul>
      </div>
    </section>
  );
}