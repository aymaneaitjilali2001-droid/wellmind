import Link from 'next/link';
import { ChartColumn } from 'lucide-react';
import { SurveyStatusBadge } from '@/components/surveys/SurveyStatusBadge';
import { ButtonLink } from '@/components/Buttonlink';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { ParticipationOverview } from '@/hooks/useDashboard';
import { getSurveyTiming } from '@/lib/survey-dates';

// Taux de participation des derniers sondages : une barre horizontale par sondage.
// Une seule série (une couleur), valeurs écrites à côté de chaque barre : pas besoin de légende.
export function ParticipationChart({ overview }: { overview: ParticipationOverview }) {
  const rows = overview.surveys.slice(0, 6);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Participation par sondage</CardTitle>
        <CardDescription>
          Part des {overview.eligibleEmployees} employés actifs qui ont répondu, pour les {rows.length} derniers
          sondages publiés.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {rows.length === 0 ? (
          <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed py-10 text-center">
            <ChartColumn aria-hidden="true" className="size-7 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Aucun sondage publié pour l’instant.</p>
            <ButtonLink href="/hr/surveys/new" variant="outline">
              Créer un sondage
            </ButtonLink>
          </div>
        ) : (
          <>
            <ul className="flex flex-col gap-4">
              {rows.map((s) => (
                <li key={s.surveyId} className="group">
                  <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
                    <Link
                      href={`/hr/surveys/${s.surveyId}`}
                      className="min-w-0 truncate text-sm font-medium hover:text-primary hover:underline"
                    >
                      {s.title}
                    </Link>
                    <SurveyStatusBadge timing={getSurveyTiming(s)} />
                  </div>
                  <div className="mt-1.5 flex items-center gap-3">
                    <div
                      className="h-2 flex-1 overflow-hidden rounded-full bg-muted"
                      title={`${s.participants} participant${s.participants > 1 ? 's' : ''} sur ${overview.eligibleEmployees}`}
                    >
                      <div
                        className="h-full rounded-full bg-primary transition-[width] group-hover:bg-brand-700"
                        style={{ width: `${Math.min(100, s.participationRate)}%` }}
                      />
                    </div>
                    <span className="w-28 shrink-0 text-right text-xs text-muted-foreground tabular-nums">
                      <span className="font-medium text-foreground">{s.participationRate.toLocaleString('fr-FR')} %</span>
                      {' · '}
                      {s.participants} rép.
                    </span>
                  </div>
                </li>
              ))}
            </ul>

            {/* Les mêmes chiffres en tableau, pour les lecteurs d'écran */}
            <table className="sr-only">
              <caption>Participation par sondage</caption>
              <thead>
                <tr>
                  <th scope="col">Sondage</th>
                  <th scope="col">Participants</th>
                  <th scope="col">Taux</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((s) => (
                  <tr key={s.surveyId}>
                    <td>{s.title}</td>
                    <td>{s.participants}</td>
                    <td>{s.participationRate} %</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}
      </CardContent>
    </Card>
  );
}