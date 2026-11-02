import test from 'node:test';
import assert from 'node:assert/strict';
import { withBreakdown } from '../utils/Statistics.js';

test('une note affiche toute l’échelle, même à 0 réponse', () => {
  const stat = { responseCount: 6, distribution: { 2: 3, 3: 2, 4: 1 } };
  const { breakdown } = withBreakdown(stat, { type: 'RATING', scaleMin: 1, scaleMax: 5 });

  assert.deepEqual(breakdown.map((l) => l.count), [0, 3, 2, 1, 0]);
  assert.deepEqual(breakdown.map((l) => l.percent), [0, 50, 33.3, 16.7, 0]);
});

test('un choix affiche les libellés dans l’ordre du sondage', () => {
  const stat = { responseCount: 4, distribution: { b: 3, a: 1 } };
  const question = {
    type: 'CHOICE',
    options: [
      { _id: 'b', label: 'Non', position: 1 },
      { _id: 'a', label: 'Oui', position: 0 },
      { _id: 'c', label: 'Peut-être', position: 2 },
    ],
  };

  const { breakdown } = withBreakdown(stat, question);
  assert.deepEqual(breakdown.map((l) => l.label), ['Oui', 'Non', 'Peut-être']);
  assert.deepEqual(breakdown.map((l) => l.percent), [25, 75, 0]);
});

test('aucune réponse ne provoque pas de division par zéro', () => {
  const { breakdown } = withBreakdown(
    { responseCount: 0, distribution: {} },
    { type: 'RATING', scaleMin: 1, scaleMax: 2 }
  );
  assert.deepEqual(breakdown.map((l) => l.percent), [0, 0]);
});