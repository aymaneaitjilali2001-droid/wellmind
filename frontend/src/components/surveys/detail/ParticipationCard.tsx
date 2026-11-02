'use client';

import { Loader2, ShieldAlert, ShieldCheck } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { SurveyParticipation } from '@/types/survey';

// Participation d'un sondage publié ou clôturé : chiffres globaux seulement,
// jamais la liste des participants (règle de confidentialité du backend).
export function ParticipationCard({
  participation,
  isLoading,
  threshold,
}: {
  participation?: SurveyParticipation;
  isLoading: boolean;
  threshold?: number;
}) {
  const rate = participation?.participationRate ?? 0;
  const missing = threshold && participation ? Math.max(0, threshold - participation.participants) : 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Participation</CardTitle>
        <CardDescription>Par confidentialité, la liste des participants n’est pas affichée.</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {isLoading || !participation ? (
          <Loader2 className="size-5 animate-spin text-muted-foreground" aria-label="Chargement de la participation" />
        ) : (
          <>
            <div>
              <p className="text-3xl font-bold">{rate.toLocaleString('fr-FR')} %</p>
              <p className="text-sm text-muted-foreground">
                {participation.participants} sur {participation.eligible} employé
                {participation.eligible > 1 ? 's' : ''} actif{participation.eligible > 1 ? 's' : ''}
              </p>
            </div>

            <div
              role="progressbar"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={Math.round(rate)}
              aria-label="Taux de participation"
              className="h-2 overflow-hidden rounded-full bg-muted"
            >
              <div className="h-full rounded-full bg-primary transition-[width]" style={{ width: `${Math.min(100, rate)}%` }} />
            </div>

            {threshold !== undefined &&
              (missing > 0 ? (
                <p className="flex items-start gap-2 rounded-lg bg-amber-50 p-3 text-sm text-amber-900">
                  <ShieldAlert aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
                  Encore {missing} réponse{missing > 1 ? 's' : ''} avant que les résultats détaillés soient visibles
                  (seuil : {threshold}).
                </p>
              ) : (
                <p className="flex items-start gap-2 rounded-lg bg-brand-50 p-3 text-sm text-brand-800">
                  <ShieldCheck aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
                  Seuil de confidentialité atteint ({threshold} réponses) : les résultats peuvent être consultés.
                </p>
              ))}
          </>
        )}
      </CardContent>
    </Card>
  );
}