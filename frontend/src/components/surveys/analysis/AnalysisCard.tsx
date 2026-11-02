'use client';

import { useState } from 'react';
import { useSWRConfig } from 'swr';
import { isAxiosError } from 'axios';
import { AlertCircle, Info, Loader2, ShieldAlert, Sparkles } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { isActionsKey } from '@/hooks/useActions';
import { useLatestAnalysis } from '@/hooks/useAnalyses';
import { getErrorMessage } from '@/lib/api';
import { requestAnalysis } from '@/services/analyses';
import type { AnalysisTheme, ThemeSentiment } from '@/types/analysis';
import type { Survey } from '@/types/survey';
import { ThemeBlock } from './ThemeBlock';

const dateTime = new Intl.DateTimeFormat('fr-FR', { dateStyle: 'long', timeStyle: 'short' });

// Préoccupations d'abord, puis avis partagés, puis points positifs ; les plus cités en premier
const ORDER: Record<ThemeSentiment, number> = { CONCERN: 0, MIXED: 1, POSITIVE: 2 };
const sortThemes = (themes: AnalysisTheme[]) =>
  [...themes].sort((a, b) => ORDER[a.sentiment] - ORDER[b.sentiment] || b.mentionCount - a.mentionCount);

// Analyse IA des commentaires d'un sondage clôturé (le backend refuse les autres)
export function AnalysisCard({
  survey,
  participants,
  threshold,
}: {
  survey: Survey;
  participants?: number;
  threshold?: number;
}) {
  const { data: analysis, error, isLoading, mutate } = useLatestAnalysis(survey._id);
  const { mutate: mutateCache } = useSWRConfig();
  const [running, setRunning] = useState(false);
  const [runError, setRunError] = useState<string | null>(null);

  // 404 = aucune analyse terminée pour l'instant (cas normal, pas une erreur)
  const noAnalysisYet = isAxiosError(error) && error.response?.status === 404;
  const loadError = error && !noAnalysisYet ? error : null;

  const missing = participants !== undefined && threshold !== undefined ? Math.max(0, threshold - participants) : 0;

  const handleRun = async () => {
    setRunning(true);
    setRunError(null);
    try {
      const result = await requestAnalysis(survey._id);
      await mutate(result, { revalidate: false });
    } catch (err) {
      // 422 : seuil non atteint ; 409 : analyse déjà en cours ou sondage pas clôturé ; 502 : service IA indisponible
      setRunError(getErrorMessage(err));
    } finally {
      setRunning(false);
    }
  };

  // Après une action sur une recommandation : recharger l'analyse et la liste des actions
  const handleChanged = async () => {
    await mutate();
    await mutateCache(isActionsKey);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Sparkles aria-hidden="true" className="size-4" /> Analyse IA des commentaires
        </CardTitle>
        <CardDescription>
          Seuls les commentaires désidentifiés sont envoyés à l’IA, sans aucun lien avec les employés. Les nombres
          de réponses et de mentions sont comptés par WellMind, pas par l’IA.
        </CardDescription>
      </CardHeader>

      <CardContent className="flex flex-col gap-5">
        {/* ---------- Lancement ---------- */}
        <div className="flex flex-col gap-3 rounded-lg bg-muted/40 p-4">
          {missing > 0 ? (
            <p className="flex items-start gap-2 text-sm text-amber-900">
              <ShieldAlert aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
              Encore {missing} réponse{missing > 1 ? 's' : ''} avant de pouvoir lancer l’analyse (seuil de
              confidentialité : {threshold}).
            </p>
          ) : null}

          <div className="flex flex-wrap items-center gap-3">
            <Button onClick={handleRun} disabled={running || missing > 0 || isLoading}>
              {running ? <Loader2 aria-hidden="true" className="animate-spin" /> : <Sparkles aria-hidden="true" />}
              {analysis ? 'Relancer l’analyse' : 'Lancer l’analyse IA'}
            </Button>
            <p aria-live="polite" className="text-sm text-muted-foreground">
              {running && 'Analyse en cours… cela peut prendre jusqu’à une minute.'}
            </p>
          </div>

          {runError && (
            <Alert variant="destructive">
              <AlertCircle />
              <AlertTitle>L’analyse n’a pas pu être réalisée</AlertTitle>
              <AlertDescription>{runError}</AlertDescription>
            </Alert>
          )}
        </div>

        {/* ---------- Résultat ---------- */}
        {isLoading && (
          <Loader2 className="size-5 animate-spin self-center text-muted-foreground" aria-label="Chargement de l’analyse" />
        )}

        {loadError && (
          <Alert variant="destructive">
            <AlertCircle />
            <AlertTitle>Impossible de charger l’analyse</AlertTitle>
            <AlertDescription>
              <p>{getErrorMessage(loadError)}</p>
              <Button variant="outline" size="sm" className="mt-3" onClick={() => mutate()}>
                Réessayer
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {noAnalysisYet && !running && (
          <p className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
            Aucune analyse pour ce sondage pour l’instant.
          </p>
        )}

        {analysis && (
          <div className="flex flex-col gap-5">
            <p className="text-xs text-muted-foreground">
              Analyse du {dateTime.format(new Date(analysis.completedAt ?? analysis.createdAt))} ·{' '}
              {analysis.responseCount} réponse{analysis.responseCount > 1 ? 's' : ''} · {analysis.commentCount}{' '}
              commentaire{analysis.commentCount > 1 ? 's' : ''} écrit{analysis.commentCount > 1 ? 's' : ''}
              {analysis.aiModel && ` · ${analysis.aiModel}`}
            </p>

            {analysis.insufficientData ? (
              <div className="flex items-start gap-2 rounded-lg bg-amber-50 p-4 text-sm text-amber-900">
                <Info aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
                <div>
                  <p className="font-medium">{analysis.summary}</p>
                  {analysis.limitations.length > 0 && (
                    <ul className="mt-1 list-disc pl-4">
                      {analysis.limitations.map((l) => (
                        <li key={l}>{l}</li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            ) : (
              <>
                <div>
                  <h3 className="text-sm font-medium">Résumé</h3>
                  <p className="mt-1 text-sm whitespace-pre-line text-muted-foreground">{analysis.summary}</p>
                </div>

                {analysis.themes.length > 0 && (
                  <div className="flex flex-col gap-3">
                    <h3 className="text-sm font-medium">Thèmes ({analysis.themes.length})</h3>
                    {sortThemes(analysis.themes).map((theme) => (
                      <ThemeBlock
                        key={theme._id}
                        theme={theme}
                        commentCount={analysis.commentCount}
                        analysisId={analysis._id}
                        onChanged={handleChanged}
                      />
                    ))}
                  </div>
                )}

                {analysis.limitations.length > 0 && (
                  <div className="rounded-lg border p-4">
                    <h3 className="text-sm font-medium">Limites de l’analyse</h3>
                    <ul className="mt-1 list-disc pl-4 text-sm text-muted-foreground">
                      {analysis.limitations.map((l) => (
                        <li key={l}>{l}</li>
                      ))}
                    </ul>
                  </div>
                )}

                <p className="text-xs text-muted-foreground">
                  L’IA aide à repérer des tendances ; elle ne remplace pas l’échange avec les équipes. Vérifiez chaque
                  recommandation avant d’en faire une action.
                </p>
              </>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}