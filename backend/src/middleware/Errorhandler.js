import { HttpError } from '../utils/Httperror.js';

// Messages pour les doublons (erreur MongoDB 11000), selon l'index concerné
const DUPLICATE_MESSAGES = {
  email: 'Un compte existe déjà avec cet e-mail',
  slug: 'Cette organisation existe déjà',
  surveyId: 'Vous avez déjà répondu à ce sondage',
  recommendationId: 'Une action existe déjà pour cette recommandation',
};

// Route inconnue
export const notFound = (req, _res, next) => {
  next(new HttpError(404, `Route introuvable : ${req.method} ${req.originalUrl}`));
};

// Toutes les erreurs passent ici et sont renvoyées au format { error, details? }.
// Ne jamais logger req.body : il peut contenir des réponses de sondage.
// eslint-disable-next-line no-unused-vars
export const errorHandler = (err, req, res, _next) => {
  if (err instanceof HttpError) {
    return res.status(err.status).json({
      error: err.message,
      ...(err.details ? { details: err.details } : {}),
    });
  }

  // Validation Mongoose (champ manquant, enum invalide, etc.)
  if (err.name === 'ValidationError') {
    const details = Object.values(err.errors || {}).map((e) => ({ field: e.path, message: e.message }));
    return res.status(400).json({ error: 'Données invalides', details });
  }

  // Id MongoDB mal formé (ex : /api/surveys/abc)
  if (err.name === 'CastError') {
    return res.status(400).json({ error: 'Identifiant invalide' });
  }

  // Doublon sur un index unique
  if (err.code === 11000) {
    const field = Object.keys(err.keyPattern || {})[0];
    return res.status(409).json({ error: DUPLICATE_MESSAGES[field] || 'Cette valeur existe déjà' });
  }

  // JSON mal formé dans le body
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'JSON invalide' });
  }

  // Erreur inattendue : on logge seulement le nom et le message
  console.error(`[${req.method} ${req.originalUrl}] ${err.name}: ${err.message}`);
  return res.status(500).json({ error: 'Erreur interne du serveur' });
};

export default errorHandler;