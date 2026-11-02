import test from 'node:test';
import assert from 'node:assert/strict';
import { sanitizeAiOutput } from '../utils/Aioutput.js';
import { AiServiceError } from '../utils/AIClient.js';

const comments = [
  { id: 0, text: 'Les priorités changent trop souvent cette année.' },
  { id: 1, text: 'La charge de travail est difficile à planifier.' },
  { id: 2, text: 'Bonne entraide dans [nom] et une ambiance agréable.' },
];

const theme = (overrides = {}) => ({
  name: 'Charge de travail',
  sentiment: 'CONCERN',
  description: 'Les priorités changent souvent.',
  commentIds: [0, 1],
  excerpts: ['Les priorités changent trop souvent'],
  recommendations: [{ content: 'Prioriser chaque semaine.', rationale: 'Priorités changeantes.' }],
  ...overrides,
});

const output = (overrides = {}) => ({ summary: 'Résumé neutre.', themes: [theme()], ...overrides });

test('conserve une sortie valide et recalcule les mentions', () => {
  const clean = sanitizeAiOutput(output({ themes: [theme({ commentIds: [0, 1, 1, 99], mentionCount: 50 })] }), comments);
  assert.equal(clean.themes.length, 1);
  assert.equal(clean.themes[0].mentionCount, 2);
});

test('rejette une réponse qui n’est pas un objet', () => {
  assert.throws(() => sanitizeAiOutput('texte', comments), AiServiceError);
});

test('rejette une réponse sans résumé', () => {
  assert.throws(() => sanitizeAiOutput({ themes: [] }, comments), AiServiceError);
});

test('rejette des thèmes qui ne citent aucun commentaire réel', () => {
  assert.throws(() => sanitizeAiOutput(output({ themes: [theme({ commentIds: [98, 99] })] }), comments), AiServiceError);
});

test('rejette un résumé avec un chiffre ou un pourcentage inventé', () => {
  assert.throws(() => sanitizeAiOutput(output({ summary: '42 employés sont concernés.' }), comments), AiServiceError);
  assert.throws(() => sanitizeAiOutput(output({ summary: 'Environ 80 % des retours.' }), comments), AiServiceError);
});

test('accepte les chiffres calculés par le backend ou présents dans le titre', () => {
  const clean = sanitizeAiOutput(output({ summary: '6 réponses au sondage de 2026 et 3 commentaires.' }), comments, {
    allowedNumbers: [6],
    referenceTexts: ['Baromètre T3 2026'],
  });
  assert.equal(clean.summary, '6 réponses au sondage de 2026 et 3 commentaires.');
});

test('rejette un résumé contenant un diagnostic', () => {
  assert.throws(() => sanitizeAiOutput(output({ summary: 'Plusieurs employés sont dépressifs.' }), comments), AiServiceError);
});

test('retire un thème mentionné dans un seul commentaire', () => {
  const clean = sanitizeAiOutput(output({ themes: [theme(), theme({ name: 'Isolé', commentIds: [2] })] }), comments);
  assert.deepEqual(clean.themes.map((t) => t.name), ['Charge de travail']);
});

test('retire un thème au texte non conforme', () => {
  const clean = sanitizeAiOutput(
    output({ themes: [theme(), theme({ name: 'Autre', description: 'Il faut sanctionner ce service.' })] }),
    comments
  );
  assert.equal(clean.themes.length, 1);
});

test('retire une recommandation qui vise une personne ou propose une sanction', () => {
  const recommendations = [
    { content: 'Parler à Madame Durand.', rationale: 'Retours.' },
    { content: 'Licencier le responsable.', rationale: 'Retours.' },
    { content: 'Atteindre 90 % de satisfaction.', rationale: 'Retours.' },
    { content: 'Organiser un point.', rationale: 'Retours.' },
  ];
  const clean = sanitizeAiOutput(output({ themes: [theme({ recommendations })] }), comments);
  assert.deepEqual(clean.themes[0].recommendations.map((r) => r.content), ['Organiser un point.']);
});

test('retire les extraits inventés ou identifiants', () => {
  const texts = [{ id: 0, text: 'Sara organise tout ici depuis longtemps.' }, ...comments.slice(1)];
  const clean = sanitizeAiOutput(
    output({
      themes: [theme({ excerpts: ['Une phrase jamais écrite par personne', 'Sara organise tout ici'] })],
    }),
    texts,
    { names: ['Sara'] }
  );
  assert.deepEqual(clean.themes[0].excerpts, []);
});

test('ne garde aucune recommandation si les données sont insuffisantes', () => {
  const clean = sanitizeAiOutput(output({ insufficientData: true }), comments);
  assert.deepEqual(clean.themes[0].recommendations, []);
});
