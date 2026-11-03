const DAY = 24 * 60 * 60 * 1000;

// Temps restant avant la fin d'un sondage, en jours calendaires.
// urgent = se termine aujourd'hui ou demain (affiché en orange).
export const getTimeLeft = (endDate: string, now: Date = new Date()) => {
  const end = new Date(endDate);
  const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const days = Math.round((startOfDay(end) - startOfDay(now)) / DAY);

  if (end <= now) return { label: 'Terminé', urgent: false };
  if (days <= 0) return { label: 'Se termine aujourd’hui', urgent: true };
  if (days === 1) return { label: 'Se termine demain', urgent: true };
  return { label: `Encore ${days} jours`, urgent: false };
};

// Durée estimée pour répondre : environ 20 secondes par question, 1 minute au minimum
export const estimateMinutes = (questionCount: number) => Math.max(1, Math.round((questionCount * 20) / 60));