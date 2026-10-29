import { HttpError } from '/HttpError.js';

// Lance la validation Mongoose d'un document.
// Les erreurs lancées dans les hooks pre('validate') des modèles
// (ex : "au moins 2 options sont nécessaires") deviennent des erreurs 400.
export const runValidation = async (doc) => {
  try {
    await doc.validate();
  } catch (err) {
    if (err.name === 'ValidationError') throw err; // géré par errorHandler
    throw new HttpError(400, err.message);
  }
};

// Garde seulement les champs autorisés présents dans body
export const pick = (body = {}, allowed = []) => {
  const out = {};
  for (const key of allowed) {
    if (body[key] !== undefined) out[key] = body[key];
  }
  return out;
};

// Vérifie que les champs obligatoires sont présents et non vides
export const requireFields = (body = {}, fields = []) => {
  const missing = fields.filter(
    (f) => body[f] === undefined || body[f] === null || String(body[f]).trim() === ''
  );
  if (missing.length) {
    throw new HttpError(400, 'Champs obligatoires manquants', { missing });
  }
};

// Échappe une chaîne pour l'utiliser dans une RegExp (recherche)
export const escapeRegex = (s) => String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// Pagination : ?page=1&limit=20 (limite max 100)
export const getPagination = (query = {}) => {
  const page = Math.max(1, parseInt(query.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(query.limit, 10) || 20));
  return { page, limit, skip: (page - 1) * limit };
};