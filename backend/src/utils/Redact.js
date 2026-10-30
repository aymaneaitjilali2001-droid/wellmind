// Désidentifie un commentaire avant de l'envoyer à l'IA ou de l'afficher
// en extrait : e-mails, numéros de téléphone et noms des membres de
// l'organisation sont remplacés par des marqueurs neutres.

const EMAIL = /[\p{L}0-9._%+-]+@[\p{L}0-9.-]+\.[\p{L}]{2,}/giu;
const PHONE = /(?:\+?\d[\s.-]?){8,}\d/g;

const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// names : prénoms et noms des membres de l'organisation
export const redact = (text, names = []) => {
  if (typeof text !== 'string') return text;

  let out = text.replace(EMAIL, '[e-mail]').replace(PHONE, '[téléphone]');

  const unique = [...new Set(names.filter((n) => typeof n === 'string' && n.trim().length >= 2))]
    .map((n) => n.trim())
    // Les noms longs d'abord, pour ne pas masquer "Ana" avant "Anaïs"
    .sort((a, b) => b.length - a.length);

  for (const name of unique) {
    // Mot entier uniquement, insensible à la casse et aux lettres accentuées autour
    const re = new RegExp(`(?<![\\p{L}])${escapeRegex(name)}(?![\\p{L}])`, 'giu');
    out = out.replace(re, '[nom]');
  }

  return out;
};

export default redact;
