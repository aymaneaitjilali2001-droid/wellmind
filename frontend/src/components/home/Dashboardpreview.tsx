'use client';

import { useEffect, useId, useRef } from 'react';
import {
  animate,
  motion,
  useInView,
  useMotionValue,
  useReducedMotion,
  useTransform,
} from 'motion/react';
import { ShieldCheck, Smile, Sparkles, TrendingUp, Users } from 'lucide-react';
import { useLanguage } from './LanguageProvider';

// ---------------------------------------------------------------
// Illustration marketing STATIQUE : ces chiffres sont fictifs.
// Ce n'est pas un tableau de bord connecté aux données, et la carte
// l'indique clairement (« Données d'illustration »).
// ---------------------------------------------------------------

const SCORE = 7.4;
const PARTICIPATION = 78;
const TREND = [6.4, 6.6, 6.5, 6.9, 7.1, 7.4];
const THEMES = [
  { key: 'communication', value: 71 },
  { key: 'workload', value: 62 },
  { key: 'recognition', value: 58 },
] as const;

// Compteur animé de 0 jusqu'à la valeur, au format de la langue (7,4 en français, 7.4 en anglais)
function Counter({ value, decimals, suffix, locale }: { value: number; decimals: number; suffix: string; locale: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });
  const reduceMotion = useReducedMotion();
  const count = useMotionValue(0);
  const formatter = new Intl.NumberFormat(locale, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
  const text = useTransform(count, (v) => `${formatter.format(v)}${suffix}`);

  useEffect(() => {
    if (reduceMotion) {
      count.set(value); // animations réduites : valeur finale directement
      return;
    }
    if (!inView) return;
    const controls = animate(count, value, { duration: 1.2, ease: 'easeOut' });
    return () => controls.stop();
  }, [count, inView, reduceMotion, value]);

  return <motion.span ref={ref}>{text}</motion.span>;
}

// Changer de langue recrée le compteur (key), pour qu'il utilise le bon format
function AnimatedNumber({ value, decimals = 0, suffix = '' }: { value: number; decimals?: number; suffix?: string }) {
  const { lang } = useLanguage();
  return <Counter key={lang} value={value} decimals={decimals} suffix={suffix} locale={lang} />;
}

// Barre de progression qui se remplit de gauche à droite
function ProgressBar({ value, delay = 0 }: { value: number; delay?: number }) {
  return (
    <div className="h-2 overflow-hidden rounded-full bg-slate-100">
      <motion.div
        className="h-full origin-left rounded-full bg-linear-to-r from-brand-500 to-brand-600"
        style={{ width: `${value}%` }}
        initial={{ scaleX: 0 }}
        whileInView={{ scaleX: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.9, ease: 'easeOut', delay }}
      />
    </div>
  );
}

// Courbe d'évolution du score, tracée progressivement
function TrendChart({ months, label }: { months: string[]; label: string }) {
  const gradientId = useId();
  const reduceMotion = useReducedMotion();

  const width = 300;
  const height = 96;
  const pad = 8;
  const min = 6;
  const max = 8;

  const points = TREND.map((v, i) => ({
    x: pad + (i * (width - 2 * pad)) / (TREND.length - 1),
    y: height - pad - ((v - min) / (max - min)) * (height - 2 * pad),
  }));
  const line = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ');
  const first = points[0];
  const last = points[points.length - 1];
  const area = `${line} L${last.x.toFixed(1)} ${height} L${first.x.toFixed(1)} ${height} Z`;

  return (
    <div>
      <svg viewBox={`0 0 ${width} ${height}`} className="h-24 w-full" aria-label={label}>
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#2f7a67" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#2f7a67" stopOpacity="0" />
          </linearGradient>
        </defs>
        <motion.path
          d={area}
          fill={`url(#${gradientId})`}
          initial={reduceMotion ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.9, duration: 0.6 }}
        />
        <motion.path
          d={line}
          fill="none"
          stroke="#1f5f50"
          strokeWidth={2.5}
          strokeLinecap="round"
          strokeLinejoin="round"
          initial={reduceMotion ? false : { pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 1.2, ease: 'easeInOut', delay: 0.4 }}
        />
        <circle cx={last.x} cy={last.y} r={4} fill="#1f5f50" stroke="#ffffff" strokeWidth={2} />
      </svg>
      <div className="mt-1 flex justify-between text-[11px] text-slate-500">
        {months.map((m) => (
          <span key={m}>{m}</span>
        ))}
      </div>
    </div>
  );
}

export function DashboardPreview() {
  const { t } = useLanguage();
  const d = t.dashboard;

  return (
    <motion.div
      initial={{ opacity: 0, y: 32, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.7, ease: 'easeOut', delay: 0.2 }}
      className="relative mx-auto w-full max-w-xl lg:max-w-none"
      // Illustration : lue comme une seule image par les lecteurs d'écran
      role="img"
      aria-label={d.ariaLabel}
    >
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl shadow-slate-900/10">
        {/* Barre de fenêtre */}
        <div className="flex items-center gap-3 border-b border-slate-100 bg-slate-50/80 px-4 py-3">
          <div className="flex gap-1.5" aria-hidden="true">
            <span className="size-2.5 rounded-full bg-slate-300" />
            <span className="size-2.5 rounded-full bg-slate-300" />
            <span className="size-2.5 rounded-full bg-slate-300" />
          </div>
          <p className="text-sm font-semibold text-slate-700">{d.windowTitle}</p>
          <span className="ml-auto rounded-full bg-amber-100 px-2.5 py-0.5 text-[11px] font-semibold text-amber-800">
            {d.illustrative}
          </span>
        </div>

        <div className="grid gap-3 p-4 sm:p-5">
          {/* Indicateurs principaux */}
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl border border-slate-100 bg-brand-50/60 p-4">
              <div className="flex items-center gap-2 text-xs font-medium text-slate-600">
                <Smile aria-hidden="true" className="size-4 text-brand-600" />
                {d.wellbeingScore}
              </div>
              <p className="mt-2 text-3xl font-bold text-slate-900">
                <AnimatedNumber value={SCORE} decimals={1} />
                <span className="ml-1 text-sm font-medium text-slate-500">{d.outOf}</span>
              </p>
            </div>
            <div className="rounded-xl border border-slate-100 bg-white p-4">
              <div className="flex items-center gap-2 text-xs font-medium text-slate-600">
                <Users aria-hidden="true" className="size-4 text-brand-600" />
                {d.participation}
              </div>
              <p className="mt-2 text-3xl font-bold text-slate-900">
                <AnimatedNumber value={PARTICIPATION} suffix=" %" />
              </p>
              <p className="mt-1 text-[11px] text-slate-500">{d.participationNote}</p>
            </div>
          </div>

          {/* Courbe d'évolution */}
          <div className="rounded-xl border border-slate-100 p-4">
            <div className="mb-2 flex items-center gap-2 text-xs font-medium text-slate-600">
              <TrendingUp aria-hidden="true" className="size-4 text-brand-600" />
              {d.trend}
            </div>
            <TrendChart months={d.months} label={d.trend} />
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {/* Satisfaction par thème */}
            <div className="rounded-xl border border-slate-100 p-4">
              <p className="mb-3 text-xs font-medium text-slate-600">{d.themes}</p>
              <ul className="flex flex-col gap-3">
                {THEMES.map((theme, index) => (
                  <li key={theme.key}>
                    <div className="mb-1 flex justify-between text-xs">
                      <span className="text-slate-700">{d.themeLabels[theme.key]}</span>
                      <span className="font-semibold text-slate-900">{theme.value} %</span>
                    </div>
                    <ProgressBar value={theme.value} delay={0.5 + index * 0.15} />
                  </li>
                ))}
              </ul>
            </div>

            {/* Recommandation IA */}
            <div className="flex flex-col rounded-xl border border-brand-200 bg-linear-to-br from-brand-50 to-white p-4">
              <div className="flex items-center gap-2 text-xs font-semibold text-brand-700">
                <Sparkles aria-hidden="true" className="size-4 text-amber-500" />
                {d.aiTitle}
              </div>
              <p className="mt-2 text-sm leading-snug text-slate-800">{d.aiText}</p>
              <p className="mt-auto pt-3 text-[11px] text-slate-500">{d.aiNote}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Badge flottant : une vraie règle de l'application */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut', delay: 1 }}
        className="absolute -bottom-6 -left-4 hidden items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-lg sm:flex"
      >
        <span className="flex size-9 items-center justify-center rounded-lg bg-brand-100">
          <ShieldCheck aria-hidden="true" className="size-5 text-brand-700" />
        </span>
        <span className="leading-tight">
          <span className="block text-sm font-semibold text-slate-900">{d.privacyTitle}</span>
          <span className="block text-xs text-slate-500">{d.privacyText}</span>
        </span>
      </motion.div>
    </motion.div>
  );
}