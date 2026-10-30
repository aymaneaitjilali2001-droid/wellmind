
import { AiServiceError } from './AIClient.js';

// ===============================================================
// SANITISATION ET VALIDATION DES RÉSULTATS DE L'IA
// ===============================================================
//
// Rôle :
// Cette fonction vérifie et nettoie les résultats renvoyés par
// le service IA (Flask) avant leur enregistrement dans MongoDB.
//
// Pourquoi ?
// La réponse de l'IA n'est pas toujours fiable. Elle peut contenir
// des données incorrectes, des extraits inventés, des recommandations
// inappropriées ou des informations qui ne respectent pas les règles
// de confidentialité de WellMind.
//
// Le backend applique donc ses propres règles :
// - Vérifier la structure de la réponse.
// - Limiter le nombre de thèmes et de recommandations.
// - Vérifier que les extraits existent réellement dans les commentaires.
// - Recalculer le nombre de mentions à partir des identifiants valides.
// - Éliminer les recommandations qui ciblent une personne.
// - Nettoyer et limiter la longueur des textes.
//
// Important :
// Les chiffres de validation sont calculés par le backend, et non
// acceptés directement depuis l'IA.
//
// Paramètres :
// raw      : réponse brute renvoyée par le service IA.
// comments : commentaires anonymisés envoyés à l'IA.
//
// Retour :
// Un objet propre contenant le résumé, les limites, le modèle IA
// et les thèmes validés, prêt à être enregistré dans MongoDB.
// ===============================================================


// Sentiments autorisés pour les thèmes
export const SENTIMENTS = ['CONCERN', 'POSITIVE', 'MIXED'];

// Limites appliquées aux résultats de l'IA
const MAX_THEMES = 8;
const MAX_RECOMMENDATIONS_PER_THEME = 3;
const MAX_EXCERPTS = 3;

// Un thème doit être mentionné dans au moins 2 commentaires
// pour que ses extraits puissent être affichés.
// Cela réduit le risque d'identifier l'auteur d'un commentaire.
const MIN_MENTIONS_FOR_EXCERPTS = 2;


// ---------------------------------------------------------------
// Fonction str()
// Nettoie une valeur textuelle et limite sa longueur.
//
// Exemple :
// str('  Bonjour WellMind  ', 10) retourne 'Bonjour We'
//
// Si la valeur n'est pas une chaîne de caractères, retourne ''.
// ---------------------------------------------------------------
const str = (value, max) =>
  typeof value === 'string'
    ? value.trim().slice(0, max)
    : '';


// ---------------------------------------------------------------
// Fonction normalize()
// Normalise un texte pour faciliter la comparaison de deux textes.
//
// Elle :
// - transforme les majuscules en minuscules ;
// - remplace certains guillemets et caractères typographiques ;
// - remplace plusieurs espaces par un seul ;
// - supprime les espaces au début et à la fin.
//
// Utilisée principalement pour vérifier les extraits.
// ---------------------------------------------------------------
const normalize = (s) =>
  s
    .toLowerCase()
    .replace(/[«»"“”'’…]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();


// ---------------------------------------------------------------
// Fonction mentionsPerson()
// Vérifie si un texte contient une référence à une personne.
//
// Objectif : éviter de conserver une recommandation qui cible
// directement un employé.
//
// IMPORTANT : l'expression régulière doit être définie et vérifiée
// dans le code original pour que cette détection fonctionne.
// ---------------------------------------------------------------
const mentionsPerson = (s) =>
  /\b(?:mr|mme|madame|monsieur|mademoiselle)\s+[A-ZÀ-ÖØ-Þ][a-zà-öø-ÿ'-]+/i.test(s);


/**
 * Fonction principale : sanitizeAiOutput()
 *
 * Vérifie, nettoie et filtre les résultats renvoyés par le service IA.
 * Elle ne fait pas l'analyse elle-même : elle contrôle les résultats
 * de l'analyse avant leur enregistrement dans MongoDB.
 *
 * @param {object} raw
 * Réponse brute renvoyée par le service IA.
 *
 * @param {Array} comments
 * Commentaires anonymisés envoyés à l'IA :
 * [{ id, text }]
 *
 * @returns {object}
 * Résultat nettoyé et validé.
 */
export const sanitizeAiOutput = (raw, comments) => {

  // 1. Vérifier que la réponse de l'IA est bien un objet.
  // On rejette null, les chaînes de caractères et les tableaux.
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    throw new AiServiceError('Réponse du service IA invalide');
  }

  // Si themes existe, il doit obligatoirement être un tableau.
  if (raw.themes !== undefined && !Array.isArray(raw.themes)) {
    throw new AiServiceError(
      'Réponse du service IA invalide : themes doit être une liste'
    );
  }


  // 2. Préparer les données des commentaires pour les vérifications.

  // Créer un ensemble contenant les identifiants des commentaires
  // réellement envoyés à l'IA.
  const validIds = new Set(comments.map((c) => c.id));

  // Normaliser tous les commentaires pour faciliter la comparaison
  // avec les extraits proposés par l'IA.
  const normalizedTexts = comments.map((c) => normalize(c.text));


  // 3. Vérifier qu'un extrait proposé par l'IA existe réellement
  // dans au moins un commentaire.
  const isRealExcerpt = (excerpt) => {
    const e = normalize(excerpt);

    // L'extrait doit contenir au moins 10 caractères
    // et être présent dans un commentaire réel.
    return (
      e.length >= 10 &&
      normalizedTexts.some((t) => t.includes(e))
    );
  };


  // 4. Vérifier si l'IA indique que les données sont insuffisantes.
  // La valeur doit être exactement true.
  const insufficientData = raw.insufficientData === true;


  // 5. Nettoyer les thèmes proposés par l'IA.
  const themes = (raw.themes || [])

    // Éliminer les éléments qui ne sont pas des objets valides.
    .filter((t) => t && typeof t === 'object')

    // Traiter chaque thème individuellement.
    .map((t) => {

      // 5.1. Récupérer les identifiants des commentaires
      // associés à ce thème.
      // Si commentIds n'est pas un tableau, utiliser [].
      const ids = Array.isArray(t.commentIds)
        ? t.commentIds
        : [];


      // 5.2. Recalculer le nombre de mentions côté backend.
      // On garde uniquement les identifiants valides et uniques.
      // On ne fait pas confiance au nombre envoyé par l'IA.
      const mentionCount = new Set(
        ids.filter((id) => validIds.has(id))
      ).size;


      // 5.3. Vérifier les extraits proposés par l'IA.
      // Aucun extrait n'est affiché si le thème a moins de
      // 2 mentions, ou si excerpts n'est pas un tableau.
      const excerpts =
        mentionCount >= MIN_MENTIONS_FOR_EXCERPTS &&
        Array.isArray(t.excerpts)
          ? t.excerpts

              // Nettoyer chaque extrait et limiter sa longueur.
              .map((e) => str(e, 500))

              // Garder uniquement les extraits non vides
              // qui existent réellement dans les commentaires.
              .filter((e) => e && isRealExcerpt(e))

              // Garder maximum 3 extraits par thème.
              .slice(0, MAX_EXCERPTS)
          : [];


      // 5.4. Nettoyer les recommandations proposées par l'IA.
      // Si les données sont insuffisantes, aucune recommandation
      // ne doit être conservée.
      const recommendations = insufficientData
        ? []

        // Sinon, vérifier que recommendations est un tableau.
        : (Array.isArray(t.recommendations)
            ? t.recommendations
            : []
          )

            // Construire un nouvel objet avec uniquement
            // content et rationale, après nettoyage.
            .map((r) => ({
              content: str(r?.content, 1000),
              rationale: str(r?.rationale, 1500),
            }))

            // Éliminer les recommandations vides ou qui ciblent
            // directement une personne.
            .filter(
              (r) =>
                r.content &&
                !mentionsPerson(r.content) &&
                !mentionsPerson(r.rationale)
            )

            // Garder maximum 3 recommandations par thème.
            .slice(0, MAX_RECOMMENDATIONS_PER_THEME);


      // 5.5. Construire le thème final avec uniquement
      // les propriétés autorisées.
      return {
        // Nom du thème, limité à 150 caractères.
        name: str(t.name, 150),

        // Accepter uniquement les sentiments autorisés.
        // Si le sentiment est invalide, utiliser MIXED.
        sentiment: SENTIMENTS.includes(t.sentiment)
          ? t.sentiment
          : 'MIXED',

        // Description du thème, limitée à 2000 caractères.
        description: str(t.description, 2000),

        // Nombre de commentaires calculé par le backend.
        mentionCount,

        // Extraits vérifiés.
        excerpts,

        // Recommandations nettoyées.
        recommendations,
      };
    })

    // 6. Éliminer les thèmes sans nom ou sans mention valide.
    .filter((t) => t.name && t.mentionCount > 0)

    // Trier les thèmes du plus mentionné au moins mentionné.
    .sort((a, b) => b.mentionCount - a.mentionCount)

    // Garder les 8 thèmes les plus mentionnés.
    .slice(0, MAX_THEMES);


  // 7. Retourner le résultat final nettoyé.
  return {

    // Résumé généré par l'IA, limité à 5000 caractères.
    summary: str(raw.summary, 5000),

    // Indique si les données sont insuffisantes.
    insufficientData,

    // Nettoyer les limitations et en garder maximum 10.
    limitations: (Array.isArray(raw.limitations)
      ? raw.limitations
      : []
    )
      .map((l) => str(l, 300))
      .filter(Boolean)
      .slice(0, 10),

    // Nom du modèle IA utilisé, ou null s'il est absent.
    model: str(raw.model, 100) || null,

    // Liste des thèmes validés et nettoyés.
    themes,
  };
};
