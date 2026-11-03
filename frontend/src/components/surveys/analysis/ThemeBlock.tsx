import { cn } from '@/lib/utils';
import type { AnalysisTheme, ThemeSentiment } from '@/types/analysis';
import { RecommendationItem } from './RecommendationItem';

export const SENTIMENTS: Record<ThemeSentiment, { label: string; className: string; bar: string }> = {
  CONCERN: { label: 'Point d’attention', className: 'bg-amber-50 text-amber-800', bar: 'bg-amber-500' },
  MIXED: { label: 'Avis partagés', className: 'bg-sky-50 text-sky-800', bar: 'bg-sky-500' },
  POSITIVE: { label: 'Point positif', className: 'bg-brand-50 text-brand-700', bar: 'bg-brand-600' },
};

// Un thème trouvé par l'IA : description, extraits désidentifiés et recommandations
export function ThemeBlock({
  theme,
  commentCount,
  analysisId,
  onChanged,
}: {
  theme: AnalysisTheme;
  commentCount: number;
  analysisId: string;
  onChanged: () => Promise<void>;
}) {
  const sentiment = SENTIMENTS[theme.sentiment];
  const share = commentCount > 0 ? Math.round((theme.mentionCount / commentCount) * 100) : 0;

  return (
    <article className="rounded-xl border p-4">
      <div className="flex flex-wrap items-center gap-2">
        <span className={cn('rounded-full px-2.5 py-0.5 text-xs font-medium', sentiment.className)}>
          {sentiment.label}
        </span>
        <h4 className="font-semibold">{theme.name}</h4>
      </div>

      {/* Nombre de mentions : compté par le backend à partir des commentaires, pas estimé par l'IA */}
      <div className="mt-3 flex items-center gap-3">
        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted" aria-hidden="true">
          <div className={cn('h-full rounded-full', sentiment.bar)} style={{ width: `${share}%` }} />
        </div>
        <span className="shrink-0 text-xs text-muted-foreground">
          {theme.mentionCount} commentaire{theme.mentionCount > 1 ? 's' : ''} sur {commentCount}
        </span>
      </div>

      {theme.description && <p className="mt-3 text-sm text-muted-foreground">{theme.description}</p>}

      {theme.excerpts.length > 0 && (
        <div className="mt-3 flex flex-col gap-2">
          {theme.excerpts.map((excerpt) => (
            <blockquote key={excerpt} className="border-l-2 pl-3 text-sm text-muted-foreground italic">
              « {excerpt} »
            </blockquote>
          ))}
        </div>
      )}

      {theme.recommendations.length > 0 && (
        <div className="mt-4">
          <p className="mb-2 text-sm font-medium">Recommandations</p>
          <ul className="flex flex-col gap-2">
            {theme.recommendations.map((rec) => (
              <RecommendationItem key={rec._id} analysisId={analysisId} recommendation={rec} onChanged={onChanged} />
            ))}
          </ul>
        </div>
      )}
    </article>
  );
}