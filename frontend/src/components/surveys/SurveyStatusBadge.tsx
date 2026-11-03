import type { SurveyTiming } from '@/lib/survey-dates';
import { cn } from '@/lib/utils';

const TIMING_BADGES: Record<SurveyTiming, { label: string; badge: string; dot: string }> = {
  draft: { label: 'Brouillon', badge: 'bg-slate-100 text-slate-700', dot: 'bg-slate-400' },
  scheduled: { label: 'À venir', badge: 'bg-amber-50 text-amber-800', dot: 'bg-amber-500' },
  open: { label: 'Ouvert', badge: 'bg-brand-50 text-brand-700', dot: 'bg-brand-500' },
  ended: { label: 'Terminé', badge: 'bg-orange-50 text-orange-800', dot: 'bg-orange-500' },
  closed: { label: 'Clôturé', badge: 'bg-slate-100 text-slate-700', dot: 'bg-slate-500' },
};

// Pastille indiquant le « moment » d'un sondage (voir getSurveyTiming)
export function SurveyStatusBadge({ timing }: { timing: SurveyTiming }) {
  const { label, badge, dot } = TIMING_BADGES[timing];
  return (
    <span className={cn('inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium', badge)}>
      <span aria-hidden="true" className={cn('size-1.5 rounded-full', dot)} />
      {label}
    </span>
  );
}
