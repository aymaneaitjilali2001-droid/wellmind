'use client';

import { motion } from 'motion/react';
import { cn } from '@/lib/utils';
import { fadeUp, revealOnScroll } from './motion-variants';

// Titre de section : sur-titre, titre H2 et description, centrés par défaut
export function SectionHeading({
  id,
  eyebrow,
  title,
  description,
  tone = 'dark',
  className,
}: {
  id: string;
  eyebrow: string;
  title: string;
  description?: string;
  tone?: 'dark' | 'light';
  className?: string;
}) {
  return (
    <motion.div variants={fadeUp} {...revealOnScroll} className={cn('mx-auto max-w-2xl text-center', className)}>
      <p className={cn('text-sm font-semibold tracking-wide uppercase', tone === 'dark' ? 'text-brand-600' : 'text-brand-300')}>
        {eyebrow}
      </p>
      <h2
        id={id}
        className={cn(
          'mt-3 text-3xl font-bold tracking-tight text-balance sm:text-4xl lg:text-[2.5rem] lg:leading-tight',
          tone === 'dark' ? 'text-slate-900' : 'text-white'
        )}
      >
        {title}
      </h2>
      {description && (
        <p className={cn('mt-4 text-lg leading-relaxed', tone === 'dark' ? 'text-slate-600' : 'text-brand-100')}>
          {description}
        </p>
      )}
    </motion.div>
  );
}