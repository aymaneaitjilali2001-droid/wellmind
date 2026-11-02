import Link from 'next/link';
import { CircleCheck, Clock, Lock, Sparkles, TriangleAlert } from 'lucide-react';
import type { ReactNode } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { ParticipationOverview } from '@/hooks/useDashboard';
import { getSurveyTiming } from '@/lib/survey-dates';
import { getTimeLeft } from '@/lib/time-left';
import type { ActionListItem } from '@/types/action';
import type { AnalysisListItem } from '@/types/analysis';

export interface Todo {
  key: string;
  icon: ReactNode;
  text: ReactNode;
  href: string;
}

// Construit la liste « À faire » à partir des données déjà chargées (aucune requête en plus)
export const buildTodos = ({
  overview,
  analyses,
  actions,
  threshold,
  now = new Date(),
}: {
  overview: ParticipationOverview;
  analyses: AnalysisListItem[];
  actions: ActionListItem[];
  threshold: number;
  now?: Date;
}): Todo[] => {
  const todos: Todo[] = [];
  const analysed = new Set(analyses.filter((a) => a.status === 'DONE').map((a) => a.surveyId));

  for (const s of overview.surveys) {
    const timing = getSurveyTiming(s, now);

    // 1. Date de fin passée mais pas clôturé
    if (timing === 'ended') {
      todos.push({
        key: `close-${s.surveyId}`,
        icon: <Lock className="text-amber-600" />,
        text: (
          <>
            <strong className="font-medium">{s.title}</strong> est terminé : clôturez-le pour figer les résultats.
          </>
        ),
        href: `/hr/surveys/${s.surveyId}`,
      });
    }

    // 2. Se termine bientôt avec une participation faible
    if (timing === 'open' && s.endDate) {
      const left = getTimeLeft(s.endDate, now);
      if (left.urgent && s.participationRate < 50) {
        todos.push({
          key: `soon-${s.surveyId}`,
          icon: <Clock className="text-amber-600" />,
          text: (
            <>
              <strong className="font-medium">{s.title}</strong> : {left.label.toLowerCase()}, {s.participationRate} %
              de participation. Pensez à relancer les équipes.
            </>
          ),
          href: `/hr/surveys/${s.surveyId}`,
        });
      }
    }

    // 3. Clôturé, assez de réponses, mais jamais analysé
    if (timing === 'closed' && s.participants >= threshold && !analysed.has(s.surveyId)) {
      todos.push({
        key: `analyse-${s.surveyId}`,
        icon: <Sparkles className="text-brand-600" />,
        text: (
          <>
            <strong className="font-medium">{s.title}</strong> a {s.participants} réponses : lancez l’analyse IA.
          </>
        ),
        href: `/hr/surveys/${s.surveyId}`,
      });
    }
  }

  // 4. Actions en retard (les 3 plus anciennes)
  for (const a of actions.filter((x) => x.isOverdue).slice(0, 3)) {
    todos.push({
      key: `action-${a._id}`,
      icon: <TriangleAlert className="text-destructive" />,
      text: (
        <>
          Action en retard : <strong className="font-medium">{a.title}</strong>
        </>
      ),
      href: `/hr/actions/${a._id}`,
    });
  }

  return todos;
};

export function TodoCard({ todos }: { todos: Todo[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">À faire</CardTitle>
        <CardDescription>Ce qui demande votre attention en ce moment.</CardDescription>
      </CardHeader>
      <CardContent>
        {todos.length === 0 ? (
          <p className="flex items-center gap-2 text-sm text-muted-foreground">
            <CircleCheck aria-hidden="true" className="size-4 text-brand-600" /> Rien d’urgent. Tout est à jour.
          </p>
        ) : (
          <ul className="flex flex-col divide-y">
            {todos.map((t) => (
              <li key={t.key}>
                <Link
                  href={t.href}
                  className="-mx-2 flex items-start gap-3 rounded-md px-2 py-2.5 text-sm hover:bg-muted/60 focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none"
                >
                  <span aria-hidden="true" className="mt-0.5 shrink-0 [&_svg]:size-4">
                    {t.icon}
                  </span>
                  <span>{t.text}</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}