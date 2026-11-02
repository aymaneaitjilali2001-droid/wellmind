'use client';

import { useState } from 'react';
import Link from 'next/link';
import { TrendingUp } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { formatDelta, getScoreLevel } from '@/lib/score';
import { cn } from '@/lib/utils';
import type { StatsOverview } from '@/types/stats';

const dateFormat = new Intl.DateTimeFormat('fr-FR', { month: 'short', year: '2-digit' });

// Évolution du score de bien-être, un point par sondage clôturé.
// Une seule série : pas de légende, le titre la nomme. Survol / focus d'un point = info-bulle.
// La ligne est en SVG étiré (preserveAspectRatio="none") ; les points et textes sont en HTML
// pour rester nets et lisibles à toutes les largeurs.
export function ScoreTrendChart({ overview }: { overview: StatsOverview }) {
  const points = overview.surveys.filter((s) => s.score !== null) as (StatsOverview['surveys'][number] & {
    score: number;
  })[];
  const masked = overview.surveys.length - points.length;
  const [active, setActive] = useState<number | null>(null);

  // Positions en % : x réparti régulièrement, y de 0 (bas) à 100 (haut)
  const x = (i: number) => (points.length === 1 ? 50 : 4 + (i * 92) / (points.length - 1));
  const y = (score: number) => 100 - score;

  const last = points.at(-1);
  const prev = points.at(-2);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <TrendingUp aria-hidden="true" className="size-4" /> Évolution du score de bien-être
        </CardTitle>
        <CardDescription>
          Score sur 100 de chaque sondage clôturé.
          {masked > 0 &&
            ` ${masked} sondage${masked > 1 ? 's' : ''} sans score (encore ouvert${masked > 1 ? 's' : ''} ou moins de ${overview.threshold} réponses).`}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {points.length === 0 ? (
          <p className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
            Le score apparaîtra après la clôture d’un sondage d’au moins {overview.threshold} réponses.
          </p>
        ) : (
          <>
            {last && (
              <p className="mb-4 text-sm text-muted-foreground">
                Dernier score : <strong className="text-foreground tabular-nums">{last.score} / 100</strong>
                {prev && <> · {formatDelta(last.score - prev.score)} par rapport au sondage précédent</>}
              </p>
            )}

            <div className="flex gap-2">
              {/* Axe vertical : 3 repères seulement, discrets */}
              <div className="relative h-48 w-6 text-right text-[11px] text-muted-foreground tabular-nums" aria-hidden="true">
                {[100, 50, 0].map((v) => (
                  <span key={v} className="absolute right-0 -translate-y-1/2" style={{ top: `${y(v)}%` }}>
                    {v}
                  </span>
                ))}
              </div>

              <div className="relative h-48 flex-1" onMouseLeave={() => setActive(null)}>
                {/* Lignes de repère */}
                {[0, 50, 100].map((v) => (
                  <div key={v} aria-hidden="true" className="absolute inset-x-0 border-t border-dashed border-border" style={{ top: `${y(v)}%` }} />
                ))}

                {points.length > 1 && (
                  <svg className="absolute inset-0 size-full overflow-visible" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
                    <polyline
                      points={points.map((p, i) => `${x(i)},${y(p.score)}`).join(' ')}
                      fill="none"
                      stroke="var(--primary)"
                      strokeWidth="2"
                      strokeLinejoin="round"
                      strokeLinecap="round"
                      vectorEffect="non-scaling-stroke"
                    />
                  </svg>
                )}

                {points.map((p, i) => (
                  <Link
                    key={p.surveyId}
                    href={`/hr/surveys/${p.surveyId}`}
                    aria-label={`${p.title} : ${p.score} sur 100, ${getScoreLevel(p.score).label}`}
                    onMouseEnter={() => setActive(i)}
                    onFocus={() => setActive(i)}
                    onBlur={() => setActive(null)}
                    className="absolute flex size-6 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none"
                    style={{ left: `${x(i)}%`, top: `${y(p.score)}%` }}
                  >
                    <span
                      className={cn(
                        'size-2.5 rounded-full border-2 border-card bg-primary ring-1 ring-primary transition-transform',
                        active === i && 'scale-150'
                      )}
                    />
                  </Link>
                ))}

                {active !== null && points[active] && (
                  <div
                    role="tooltip"
                    className="pointer-events-none absolute z-10 w-max max-w-48 -translate-x-1/2 rounded-md border bg-card px-2.5 py-1.5 text-xs shadow-md"
                    style={{
                      left: `${Math.min(85, Math.max(15, x(active)))}%`,
                      top: `calc(${y(points[active].score)}% ${points[active].score > 70 ? '+ 16px' : '- 56px'})`,
                    }}
                  >
                    <p className="truncate font-medium">{points[active].title}</p>
                    <p className="text-muted-foreground tabular-nums">
                      {points[active].score} / 100 · {getScoreLevel(points[active].score).label} · {points[active].responseCount} rép.
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Dates sous chaque point */}
            <div className="relative mt-2 ml-8 h-4 text-[11px] text-muted-foreground" aria-hidden="true">
              {points.map((p, i) => (
                <span key={p.surveyId} className="absolute -translate-x-1/2 whitespace-nowrap" style={{ left: `${x(i)}%` }}>
                  {p.endDate ? dateFormat.format(new Date(p.endDate)) : ''}
                </span>
              ))}
            </div>

            {/* Même données en tableau, pour les lecteurs d'écran */}
            <table className="sr-only">
              <caption>Score de bien-être par sondage clôturé</caption>
              <thead>
                <tr>
                  <th scope="col">Sondage</th>
                  <th scope="col">Score sur 100</th>
                  <th scope="col">Réponses</th>
                </tr>
              </thead>
              <tbody>
                {points.map((p) => (
                  <tr key={p.surveyId}>
                    <td>{p.title}</td>
                    <td>{p.score}</td>
                    <td>{p.responseCount}</td>
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