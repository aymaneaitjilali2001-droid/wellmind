// Prépare les statistiques d'une question pour l'affichage :
// libellés lisibles, pourcentages et valeurs à 0 réponse.

const toPercent = (count, total) =>
  total ? Math.round((count / total) * 1000) / 10 : 0;

const buildLines = (question, distribution) => {
  if (question.type === 'RATING') {
    const lines = [];
    for (let value = question.scaleMin; value <= question.scaleMax; value++) {
      lines.push({ value: String(value), label: String(value), count: distribution[String(value)] || 0 });
    }
    return lines;
  }

  return [...question.options]
    .sort((a, b) => a.position - b.position)
    .map((option) => ({
      value: option._id.toString(),
      label: option.label,
      count: distribution[option._id.toString()] || 0,
    }));
};

export const withBreakdown = (stat, question) => ({
  ...stat,
  breakdown: buildLines(question, stat.distribution).map((line) => ({
    ...line,
    percent: toPercent(line.count, stat.responseCount),
  })),
});