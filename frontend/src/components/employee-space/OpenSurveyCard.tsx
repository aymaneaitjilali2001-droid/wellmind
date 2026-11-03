import Link from 'next/link';
import { ArrowRight, CircleCheck, Clock, ListChecks } from 'lucide-react';
import { estimateMinutes, getTimeLeft } from '@/lib/time-left';
import { cn } from '@/lib/utils';
import type { EmployeeSurveySummary } from '@/types/employee-survey';
import { AnonymityBadge } from './AnonymityBadge';

// Carte d'un sondage ouvert.
// - pas encore répondu : toute la carte est cliquable (lien étiré vers le formulaire)
// - déjà répondu : carte grisée, sans lien
export function OpenSurveyCard({ survey }: { survey: EmployeeSurveySummary }) {
  const timeLeft = getTimeLeft(survey.endDate);
  const done = survey.alreadySubmitted;

  return (
    <article
      className={cn(
        'group relative flex flex-col rounded-xl border bg-card p-5 shadow-xs',
        done
          ? 'bg-muted/40'
          : 'transition-shadow hover:shadow-md has-[a:focus-visible]:ring-[3px] has-[a:focus-visible]:ring-ring/50'
      )}
    >
      <div className="flex flex-wrap items-center gap-2">
        <AnonymityBadge isAnonymous={survey.isAnonymous} />
        {survey.topic && <span className="text-xs text-muted-foreground">{survey.topic}</span>}
      </div>

      <h3 className="mt-3 text-base font-semibold leading-snug">
        {done ? (
          survey.title
        ) : (
          <Link
            href={`/employee/surveys/${survey._id}`}
            className="group-hover:text-primary focus-visible:outline-none after:absolute after:inset-0 after:rounded-xl after:content-['']"
          >
            {survey.title}
          </Link>
        )}
      </h3>
      {survey.description && <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{survey.description}</p>}

      <div className="mt-4 flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
        <span className="inline-flex items-center gap-1.5">
          <ListChecks aria-hidden="true" className="size-4" />
          {survey.questionCount} question{survey.questionCount > 1 ? 's' : ''} · ≈ {estimateMinutes(survey.questionCount)} min
        </span>
        {!done && (
          <span className={cn('inline-flex items-center gap-1.5', timeLeft.urgent && 'font-medium text-amber-700')}>
            <Clock aria-hidden="true" className="size-4" />
            {timeLeft.label}
          </span>
        )}
      </div>

      <div className="mt-auto pt-4">
        {done ? (
          <span className="inline-flex items-center gap-1.5 text-sm font-medium text-brand-700">
            <CircleCheck aria-hidden="true" className="size-4" /> Vous avez répondu, merci !
          </span>
        ) : (
          <span aria-hidden="true" className="inline-flex items-center gap-1.5 text-sm font-medium text-primary">
            Répondre <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
          </span>
        )}
      </div>
    </article>
  );
}