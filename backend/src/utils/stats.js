// ---------------------------------------------------------------
// Calculs des statistiques de sondage, à partir de comptes agrégés
// (jamais de réponse individuelle). Utilisé par stats.controller.js.
// ---------------------------------------------------------------

const round = (value, decimals = 1) => Number(value.toFixed(decimals));

const percentOf = (count, total) => (total > 0 ? round((count / total) * 100) : 0);

// Question notée. rows : [{ value, count }]
// Toutes les notes de l'échelle sont renvoyées, même celles à 0 réponse.
export const ratingResult = (question, rows) => {
  const min = question.scaleMin ?? 1;
  const max = question.scaleMax ?? 5;

  const answered = rows.reduce((sum, r) => sum + r.count, 0);
  const total = rows.reduce((sum, r) => sum + r.value * r.count, 0);

  const distribution = [];
  for (let value = min; value <= max; value += 1) {
    const count = rows.find((r) => r.value === value)?.count ?? 0;
    distribution.push({ value, count, percent: percentOf(count, answered) });
  }

  return { answered, average: answered > 0 ? round(total / answered, 2) : null, distribution };
};

// Question à choix. rows : [{ optionId, count }]
// Toutes les options sont renvoyées, dans leur ordre d'affichage.
export const choiceResult = (question, rows) => {
  const answered = rows.reduce((sum, r) => sum + r.count, 0);

  const options = [...question.options]
    .sort((a, b) => a.position - b.position)
    .map((option) => {
      const count = rows.find((r) => String(r.optionId) === String(option._id))?.count ?? 0;
      return { optionId: option._id, label: option.label, count, percent: percentOf(count, answered) };
    });

  return { answered, options };
};

// Score de bien-être sur 100 : moyenne de toutes les notes, chacune ramenée
// à son échelle (le minimum vaut 0, le maximum vaut 100). Ainsi, une question
// de 1 à 5 et une question de 1 à 10 pèsent pareil.
// rows : [{ questionId, value, count }], scales : Map questionId → { min, max }
// Renvoie null s'il n'y a aucune note.
export const wellbeingScore = (rows, scales) => {
  let sum = 0;
  let count = 0;

  for (const row of rows) {
    const scale = scales.get(String(row.questionId));
    if (!scale) continue; // question qui ne fait plus partie du sondage
    sum += ((row.value - scale.min) / (scale.max - scale.min)) * row.count;
    count += row.count;
  }

  return count > 0 ? round((sum / count) * 100) : null;
};

// Seuil de confidentialité par groupe (service). groups : [{ department, responseCount, score }]
// Un groupe sous le seuil est masqué. Masquage complémentaire : en retirant les groupes visibles
// du total du sondage, on pourrait déduire les résultats des groupes masqués. Tant que
// l'ensemble masqué reste sous le seuil, on masque donc aussi le plus petit groupe visible.
export const applyGroupThreshold = (groups, threshold) => {
  const visible = groups.filter((g) => g.responseCount >= threshold).sort((a, b) => a.responseCount - b.responseCount);
  const hidden = groups.filter((g) => g.responseCount < threshold);

  let hiddenTotal = hidden.reduce((sum, g) => sum + g.responseCount, 0);
  let hiddenCount = hidden.length;

  while (hiddenTotal > 0 && hiddenTotal < threshold && visible.length > 0) {
    hiddenTotal += visible.shift().responseCount;
    hiddenCount += 1;
  }

  // Ordre alphabétique : l'ordre d'affichage ne révèle pas la taille des services
  visible.sort((a, b) => a.department.localeCompare(b.department, 'fr'));

  return { visible, hiddenCount };
};
