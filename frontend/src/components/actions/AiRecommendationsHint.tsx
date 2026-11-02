'use client';

import Link from 'next/link';
import { ArrowRight, Sparkles } from 'lucide-react';
import { useAnalysesList } from '@/hooks/useAnalyses';
import type { AnalysisListItem } from '@/types/analysis';

// Encadré de /hr/actions/new : rappelle qu'une action peut partir d'une recommandation de l'IA,
// avec un lien vers chaque sondage déjà analysé (là où se trouvent les recommandations).
export function AiRecommendationsHint() {
  const { data } = useAnalysesList();

  // Une seule ligne par sondage : la plus récente (le backend trie déjà par date décroissante)
  const surveys = new Map<string, AnalysisListItem>();
  for (const a of data ?? []) {
    if (a.status === 'DONE' && !a.insufficientData && !surveys.has(a.surveyId)) surveys.set(a.surveyId, a);
  }
  const items = [...surveys.values()].slice(0, 5);

  return (
    <aside className="flex flex-col gap-3 rounded-xl border bg-brand-50/60 p-4 text-sm">
      <p className="flex items-center gap-2 font-medium">
        <Sparkles aria-hidden="true" className="size-4 text-brand-600" /> Partir d’une recommandation de l’IA
      </p>
      <p className="text-muted-foreground">
        Sur la page d’un sondage analysé, chaque recommandation a un bouton « Créer une action » : le titre,
        l’objectif et le thème sont préremplis, vous choisissez le responsable et l’échéance.
      </p>
      {items.length > 0 ? (
        <ul className="flex flex-col gap-1">
          {items.map((a) => (
            <li key={a.surveyId}>
              <Link
                href={`/hr/surveys/${a.surveyId}`}
                className="inline-flex items-center gap-1.5 font-medium text-primary hover:underline"
              >
                {a.surveyTitle ?? 'Sondage'}
                <span className="font-normal text-muted-foreground">
                  · {a.themeCount} thème{a.themeCount > 1 ? 's' : ''}
                  {a.concernCount > 0 && `, dont ${a.concernCount} point${a.concernCount > 1 ? 's' : ''} d’attention`}
                </span>
                <ArrowRight aria-hidden="true" className="size-3.5" />
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        data && <p className="text-muted-foreground">Aucun sondage n’a encore été analysé.</p>
      )}
    </aside>
  );
}