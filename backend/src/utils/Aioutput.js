import { AiServiceError } from './AIClient.js';

// ---------------------------------------------------------------
// Validation de la réponse du service IA AVANT enregistrement.
// L'IA peut renvoyer n'importe quoi : on ne garde que ce qui est
// conforme, et on recalcule nous-mêmes tout ce qui est un chiffre.
// ---------------------------------------------------------------

export const SENTIMENTS = ['CONCERN', 'POSITIVE', 'MIXED'];

const MAX_THEMES = 8;
const MAX_RECOMMENDATIONS_PER_THEME = 3;
const MAX_EXCERPTS = 3;
// Pas d'extraits pour un thème cité par moins de 2 commentaires :
// un extrait isolé est plus facile à rattacher à son auteur
const MIN_MENTIONS_FOR_EXCERPTS = 2;

// Chaîne propre et tronquée, ou '' si ce n'est pas une chaîne
const str = (value, max) => (typeof value === 'string' ? value.trim().slice(0, max) : '');

// Pour comparer un extrait au texte des commentaires
const normalize = (s) =>
  s
    .toLowerCase()
    .replace(/[«»"“”'’…]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

// Une recommandation ne doit jamais viser une personne
const mentionsPerson = (s) => /\[nom\]/i.test(s);

/**
 * @param {object} raw      réponse brute du service IA
 * @param {Array}  comments commentaires envoyés : [{ id, text }]
 */
export const sanitizeAiOutput = (raw, comments) => {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    throw new AiServiceError('Réponse du service IA invalide');
  }
  if (raw.themes !== undefined && !Array.isArray(raw.themes)) {
    throw new AiServiceError('Réponse du service IA invalide : themes doit être une liste');
  }

  const validIds = new Set(comments.map((c) => c.id));
  const normalizedTexts = comments.map((c) => normalize(c.text));

  // Un extrait est gardé seulement s'il apparaît réellement dans un commentaire
  const isRealExcerpt = (excerpt) => {
    const e = normalize(excerpt);
    return e.length >= 10 && normalizedTexts.some((t) => t.includes(e));
  };

  const insufficientData = raw.insufficientData === true;

  const themes = (raw.themes || [])
    .filter((t) => t && typeof t === 'object')
    .map((t) => {
      // Nombre de mentions recalculé par le backend : ids valides et uniques
      const ids = Array.isArray(t.commentIds) ? t.commentIds : [];
      const mentionCount = new Set(ids.filter((id) => validIds.has(id))).size;

      const excerpts =
        mentionCount >= MIN_MENTIONS_FOR_EXCERPTS && Array.isArray(t.excerpts)
          ? t.excerpts
              .map((e) => str(e, 500))
              .filter((e) => e && isRealExcerpt(e))
              .slice(0, MAX_EXCERPTS)
          : [];

      const recommendations = insufficientData
        ? []
        : (Array.isArray(t.recommendations) ? t.recommendations : [])
            .map((r) => ({ content: str(r?.content, 1000), rationale: str(r?.rationale, 1500) }))
            .filter((r) => r.content && !mentionsPerson(r.content) && !mentionsPerson(r.rationale))
            .slice(0, MAX_RECOMMENDATIONS_PER_THEME);

      return {
        name: str(t.name, 150),
        sentiment: SENTIMENTS.includes(t.sentiment) ? t.sentiment : 'MIXED',
        description: str(t.description, 2000),
        mentionCount,
        excerpts,
        recommendations,
      };
    })
    // Un thème sans nom ou sans aucun commentaire réel est écarté
    .filter((t) => t.name && t.mentionCount > 0)
    .sort((a, b) => b.mentionCount - a.mentionCount)
    .slice(0, MAX_THEMES);

  return {
    summary: str(raw.summary, 5000),
    insufficientData,
    limitations: (Array.isArray(raw.limitations) ? raw.limitations : [])
      .map((l) => str(l, 300))
      .filter(Boolean)
      .slice(0, 10),
    model: str(raw.model, 100) || null,
    themes,
  };
};