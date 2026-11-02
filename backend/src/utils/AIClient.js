// ---------------------------------------------------------------
// Client du service IA (Flask).
//
// Contrat de l'API Flask :  POST {AI_SERVICE_URL}/analyze
//
// Requête envoyée (aucun identifiant d'employé, commentaires désidentifiés) :
// {
//   "survey":   { "title": "...", "topic": "...", "questions": ["Question texte 1", ...] },
//   "comments": [ { "id": 0, "text": "..." }, { "id": 1, "text": "..." } ]
// }
//
// Réponse attendue :
// {
//   "summary": "Résumé neutre...",
//   "insufficientData": false,
//   "limitations": ["..."],
//   "model": "llama-3.1-8b-instant",
//   "themes": [
//     {
//       "name": "Organisation de la charge de travail",
//       "sentiment": "CONCERN" | "POSITIVE" | "MIXED",
//       "description": "...",
//       "commentIds": [0, 3, 7],          // numéros des commentaires concernés
//       "excerpts": ["extrait exact d'un commentaire"],
//       "recommendations": [ { "content": "...", "rationale": "..." } ]
//     }
//   ]
// }
//
// Variables .env :
//   AI_SERVICE_URL=http://localhost:5000
//   AI_INTERNAL_KEY=un_secret_partage    (envoyé dans X-Internal-Key)
//   AI_SERVICE_TIMEOUT_MS=60000
//   AI_SERVICE_MOCK=true                 (réponse simulée, sans Flask : pour développer)
// ---------------------------------------------------------------

export class AiServiceError extends Error {
  constructor(message) {
    super(message);
    this.name = 'AiServiceError';
  }
}

// ---------- Mode simulé (sans Flask) ----------
// Regroupe les commentaires par mots-clés. Sert uniquement à développer
// et tester le backend avant que le service Flask soit prêt.
const MOCK_GROUPS = [
  {
    name: 'Organisation de la charge de travail',
    sentiment: 'CONCERN',
    keywords: ['charge', 'priorit', 'délai', 'delai', 'surcharge', 'heures', 'urgent', 'stress'],
    description: 'Plusieurs commentaires évoquent des priorités changeantes et une charge difficile à planifier.',
    recommendations: [
      {
        content: "Organiser un point hebdomadaire de priorisation au sein de chaque équipe.",
        rationale: 'Les retours mentionnent des changements de priorités fréquents.',
      },
    ],
  },
  {
    name: 'Communication interne',
    sentiment: 'CONCERN',
    keywords: ['communication', 'information', 'réunion', 'reunion', 'manager', 'transparence'],
    description: "Des commentaires signalent des informations qui circulent tard ou de façon incomplète.",
    recommendations: [
      {
        content: 'Partager un compte rendu court après les réunions de décision.',
        rationale: "Les retours indiquent un manque d'information sur les décisions.",
      },
    ],
  },
  {
    name: 'Reconnaissance du travail',
    sentiment: 'CONCERN',
    keywords: ['reconnaissance', 'valoris', 'merci', 'feedback', 'retour'],
    description: 'Certains commentaires expriment un besoin de retours sur le travail réalisé.',
    recommendations: [
      {
        content: "Prévoir des retours réguliers sur les réalisations lors des points d'équipe.",
        rationale: 'Plusieurs retours évoquent le manque de reconnaissance.',
      },
    ],
  },
  {
    name: "Entraide au sein de l'équipe",
    sentiment: 'POSITIVE',
    keywords: ['équipe', 'equipe', 'collègue', 'collegue', 'entraide', 'ambiance', 'soutien'],
    description: "L'entraide entre collègues est souvent citée comme un point fort.",
    recommendations: [],
  },
];

const mockAnalyze = ({ comments }) => {
  const themes = [];
  for (const g of MOCK_GROUPS) {
    const matching = comments.filter((c) => g.keywords.some((k) => c.text.toLowerCase().includes(k)));
    if (!matching.length) continue;
    themes.push({
      name: g.name,
      sentiment: g.sentiment,
      description: g.description,
      commentIds: matching.map((c) => c.id),
      excerpts: matching.slice(0, 2).map((c) => c.text.slice(0, 200)),
      recommendations: g.recommendations,
    });
  }
  return {
    summary: themes.length
      ? `Analyse simulée : ${themes.length} thème(s) identifié(s) dans ${comments.length} commentaires.`
      : 'Analyse simulée : aucun thème récurrent identifié.',
    insufficientData: false,
    limitations: ['Résultat simulé (AI_SERVICE_MOCK=true), non produit par un modèle de langage.'],
    model: 'mock',
    themes,
  };
};

// ---------- Appel réel ----------
export const analyzeComments = async (payload) => {
  if (process.env.AI_SERVICE_MOCK === 'true') return mockAnalyze(payload);

  const baseUrl = process.env.AI_SERVICE_URL || 'http://localhost:5000';
  const timeoutMs = Number(process.env.AI_SERVICE_TIMEOUT_MS) || 60000;

  let res;
  try {
    res = await fetch(`${baseUrl}/analyze`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(process.env.AI_INTERNAL_KEY && { 'X-Internal-Key': process.env.AI_INTERNAL_KEY }),
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(timeoutMs),
    });
  } catch (err) {
    if (err.name === 'TimeoutError') throw new AiServiceError("Le service IA n'a pas répondu à temps");
    throw new AiServiceError('Service IA injoignable');
  }

  if (!res.ok) throw new AiServiceError(`Le service IA a renvoyé une erreur (${res.status})`);

  try {
    return await res.json();
  } catch {
    throw new AiServiceError("La réponse du service IA n'est pas un JSON valide");
  }
};