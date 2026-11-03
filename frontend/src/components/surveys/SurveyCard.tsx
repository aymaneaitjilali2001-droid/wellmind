'use client';

import Link from 'next/link';
import { CalendarDays, CopyPlus, EyeOff, ListChecks, Loader2, UserRound, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatDateRange, getSurveyTiming } from '@/lib/survey-dates';
import type { SurveySummary } from '@/types/survey';
import { SurveyStatusBadge } from './SurveyStatusBadge';

// Carte d'un sondage dans la liste. Toute la carte est cliquable (lien étiré vers la page du sondage) ;
// le bouton « Dupliquer » est placé au-dessus du lien (relative z-10) pour rester cliquable.
export function SurveyCard({
  survey,
  duplicating,
  onDuplicate,
}: {
  survey: SurveySummary;
  duplicating: boolean;
  onDuplicate: (survey: SurveySummary) => void;
}) {
  const timing = getSurveyTiming(survey);

  return (
    <article className="group relative flex flex-col rounded-xl border bg-card p-5 shadow-xs transition-shadow hover:shadow-md has-[a:focus-visible]:ring-[3px] has-[a:focus-visible]:ring-ring/50">
      <div className="flex flex-wrap items-center gap-2">
        <SurveyStatusBadge timing={timing} />
        <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
          {survey.isAnonymous ? (
            <>
              <EyeOff aria-hidden="true" className="size-3.5" /> Anonyme
            </>
          ) : (
            <>
              <UserRound aria-hidden="true" className="size-3.5" /> Identifié
            </>
          )}
        </span>
      </div>

      <h2 className="mt-3 text-base font-semibold leading-snug">
        <Link
          href={`/hr/surveys/${survey._id}`}
          className="group-hover:text-primary focus-visible:outline-none after:absolute after:inset-0 after:rounded-xl after:content-['']"
        >
          {survey.title}
        </Link>
      </h2>
      {survey.topic && <p className="mt-1 text-sm text-muted-foreground">{survey.topic}</p>}

      <dl className="mt-4 flex flex-col gap-2 text-sm text-muted-foreground">
        <div className="flex items-center gap-2">
          <dt className="sr-only">Période</dt>
          <CalendarDays aria-hidden="true" className="size-4 shrink-0" />
          <dd>{formatDateRange(survey.startDate, survey.endDate)}</dd>
        </div>
        <div className="flex items-center gap-2">
          <dt className="sr-only">Questions</dt>
          <ListChecks aria-hidden="true" className="size-4 shrink-0" />
          <dd>
            {survey.questionCount} question{survey.questionCount > 1 ? 's' : ''}
          </dd>
        </div>
        {survey.status !== 'DRAFT' && (
          <div className="flex items-center gap-2">
            <dt className="sr-only">Participants</dt>
            <Users aria-hidden="true" className="size-4 shrink-0" />
            <dd>
              {survey.participantCount} participant{survey.participantCount > 1 ? 's' : ''}
            </dd>
          </div>
        )}
      </dl>

      <div className="mt-auto flex justify-end pt-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onDuplicate(survey)}
          disabled={duplicating}
          className="relative z-10"
          aria-label={`Dupliquer le sondage ${survey.title}`}
        >
          {duplicating ? <Loader2 aria-hidden="true" className="animate-spin" /> : <CopyPlus aria-hidden="true" />}
          Dupliquer
        </Button>
      </div>
    </article>
  );
}