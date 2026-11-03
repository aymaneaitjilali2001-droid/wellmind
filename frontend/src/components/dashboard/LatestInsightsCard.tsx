'use client';

import Link from 'next/link';
import { ArrowRight, Loader2, Sparkles } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAnalysis } from '@/hooks/useAnalyses';
import type { AnalysisListItem } from '@/types/analysis';

const dateFormat = new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'long' });

// Principaux points d'attention de la dernière analyse IA utilisable,
// et nombre de recommandations qui attendent une décision des RH
export function LatestInsightsCard({ analyses }: { analyses: AnalysisListItem[] }) {
  const latest = analyses.find((a) => a.status === 'DONE' && !a.insufficientData) ?? null;
  const { data: analysis, isLoading } = useAnalysis(latest?._id ?? null);

  const concerns = [...(analysis?.concerns ?? [])].sort((a, b) => b.mentionCount - a.mentionCount).slice(0, 3);
  const pending =
    analysis?.themes.reduce(
      (n, t) => n + t.recommendations.filter((r) => r.status === 'PROPOSED' && !r.actionId).length,
      0
    ) ?? 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Sparkles aria-hidden="true" className="size-4" /> Dernière analyse IA
        </CardTitle>
        <CardDescription>
          {latest
            ? `${latest.surveyTitle ?? 'Sondage'} · ${dateFormat.format(new Date(latest.completedAt ?? latest.createdAt))}`
            : 'Lancez une analyse depuis la page d’un sondage clôturé.'}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {latest && isLoading && (
          <Loader2 className="size-5 animate-spin text-muted-foreground" aria-label="Chargement de l’analyse" />
        )}

        {analysis && (
          <>
            {concerns.length > 0 ? (
              <div>
                <p className="mb-2 text-sm font-medium">Principaux points d’attention</p>
                <ul className="flex flex-col gap-2">
                  {concerns.map((t) => (
                    <li key={t._id} className="flex items-start justify-between gap-3 text-sm">
                      <span>{t.name}</span>
                      <span className="shrink-0 text-xs text-muted-foreground tabular-nums">
                        {t.mentionCount} / {analysis.commentCount} comm.
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Aucun point d’attention relevé dans cette analyse.</p>
            )}

            {pending > 0 && (
              <p className="rounded-lg bg-amber-50 p-3 text-sm text-amber-900">
                {pending} recommandation{pending > 1 ? 's' : ''} en attente de votre décision.
              </p>
            )}

            <Link
              href={`/hr/surveys/${analysis.surveyId}`}
              className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
            >
              Voir l’analyse complète <ArrowRight aria-hidden="true" className="size-4" />
            </Link>
          </>
        )}
      </CardContent>
    </Card>
  );
}