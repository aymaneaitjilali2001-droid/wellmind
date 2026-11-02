// Niveau d'un score de bien-être (sur 100), affiché avec un libellé : la couleur ne suffit jamais seule.
export type ScoreLevel = { label: string; className: string; bar: string };

export const getScoreLevel = (score: number): ScoreLevel => {
  if (score >= 70) return { label: 'Bon', className: 'bg-brand-50 text-brand-700', bar: 'bg-brand-600' };
  if (score >= 50) return { label: 'À surveiller', className: 'bg-amber-50 text-amber-800', bar: 'bg-amber-500' };
  return { label: 'Préoccupant', className: 'bg-destructive/10 text-destructive', bar: 'bg-destructive' };
};

// Écart entre deux scores, ex : « +6 pts » / « −3 pts » / « stable »
export const formatDelta = (delta: number) => {
  if (delta === 0) return 'stable';
  return `${delta > 0 ? '+' : '−'}${Math.abs(delta)} pt${Math.abs(delta) > 1 ? 's' : ''}`;
};