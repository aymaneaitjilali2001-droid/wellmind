import test from 'node:test';
import assert from 'node:assert/strict';
import { redact } from '../utils/Redact.js';

test('masque e-mails, liens, mentions et téléphones', () => {
  const out = redact('Écrire à a.b@exemple.fr, voir https://exemple.fr/x, demander à @sara ou au 06 12 34 56 78');
  assert.equal(out, 'Écrire à [e-mail], voir [lien], demander à [mention] ou au [téléphone]');
});

test('masque les noms sans toucher aux mots qui les contiennent', () => {
  assert.equal(redact('Ana et Anaïs ont vu Banane', ['Ana']), '[nom] et Anaïs ont vu Banane');
});

test('laisse un texte sans donnée identifiante inchangé', () => {
  const text = 'La charge de travail est forte en fin de mois.';
  assert.equal(redact(text, ['Sara']), text);
});