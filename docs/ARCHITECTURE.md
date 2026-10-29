# WellMind — Architecture et schéma de base de données

Document de conception (MongoDB). À placer dans `docs/ARCHITECTURE.md` du dépôt.

---

## 1. Vue d'ensemble

```
┌────────────────────┐      HTTPS / JSON      ┌─────────────────────────┐
│  Frontend          │ ─────────────────────▶ │  Backend Express (TS)   │
│  Next.js (App      │ ◀───────────────────── │  - Auth + RBAC          │
│  Router, TS)       │      cookie httpOnly   │  - Sondages, réponses   │
└────────────────────┘                        │  - Règles confidentialité│
                                              │  - Statistiques         │
                                              │  - Plans d'amélioration │
                                              └───────┬─────────┬───────┘
                                                      │         │ HTTP (clé interne)
                                                      │         ▼
                                              ┌───────▼───┐  ┌──────────────────┐
                                              │ MongoDB   │  │ Service IA Flask │
                                              │ (Atlas)   │  │ - Thèmes         │
                                              └───────────┘  │ - Résumés        │
                                                             │ - Recommandations│
                                                             └──────────────────┘
```

Répartition des responsabilités (conforme au cahier des charges) :

| Composant | Responsabilités | Ne fait JAMAIS |
|---|---|---|
| Next.js | Interfaces RH et Employé, formulaires, tableaux de bord | Calcul de statistiques, règles de confidentialité |
| Express | Auth, RBAC, sondages, réponses, seuils, **tous les calculs chiffrés**, désidentification, validation de la sortie IA, actions d'amélioration | — |
| Flask | Analyse de commentaires **déjà désidentifiés** : thèmes, résumés, recommandations | Accès à la base, calcul de chiffres, accès aux identités |
| MongoDB | Persistance | — |

Principe clé : **Flask n'a pas accès à MongoDB.** Express lui envoie uniquement des textes filtrés. Une panne de Flask n'affecte ni l'envoi des réponses ni les statistiques.

---

## 2. Arborescence du dépôt (monorepo)

```
wellmind/
├── README.md
├── docs/
│   └── ARCHITECTURE.md
├── frontend/                 # Next.js + TypeScript (App Router)
│   └── src/app/
│       ├── (auth)/login
│       ├── (hr)/dashboard, surveys, analyses, actions, employees
│       └── (employee)/surveys, improvements, profile
├── backend/                  # Express + TypeScript
│   └── src/
│       ├── config/           # env, db, constantes
│       ├── models/           # schémas Mongoose
│       ├── modules/
│       │   ├── auth/
│       │   ├── organizations/
│       │   ├── users/
│       │   ├── surveys/
│       │   ├── responses/
│       │   ├── stats/
│       │   ├── privacy/      # seuils, désidentification, suppression complémentaire
│       │   ├── ai/           # client Flask, validation de sortie
│       │   └── actions/
│       ├── middlewares/      # authenticate, requireRole, tenantScope, errorHandler
│       └── tests/
├── ai-service/               # Flask
│   ├── app.py
│   ├── analysis/
│   └── tests/
└── seed/                     # données fictives de démonstration
```

Choix techniques recommandés : Mongoose (schémas + validation), Zod (validation des entrées API), argon2 ou bcrypt (mots de passe), JWT court dans un cookie `httpOnly` + `SameSite`, Jest + Supertest (backend), pytest (Flask).

---

## 3. Modèle de données MongoDB

Règle transversale : **tout document métier porte `organizationId`**, et toute requête passe par un filtre tenant imposé par le middleware (jamais par un paramètre fourni par le client).

### 3.1 `organizations`

```ts
{
  _id: ObjectId,
  name: string,
  minResponseThreshold: number,   // défaut 5, minimum imposé 3 côté validation
  createdAt: Date
}
```

### 3.2 `users`

```ts
{
  _id: ObjectId,
  organizationId: ObjectId,
  email: string,                  // unique (index global)
  passwordHash: string,
  firstName: string,
  lastName: string,
  role: "hr_admin" | "employee",
  group?: string,                 // libellé simple (ex. "Ingénierie"), PAS de hiérarchie
  isActive: boolean,
  createdAt: Date
}
```

`group` est un simple libellé optionnel, utilisé uniquement pour les ventilations soumises au seuil.

### 3.3 `surveys`

```ts
{
  _id: ObjectId,
  organizationId: ObjectId,
  seriesId?: ObjectId,            // lien vers survey_series (questionnaires récurrents)
  title: string,
  description: string,
  anonymity: "anonymous" | "identified",   // IMMUABLE après publication
  status: "draft" | "published" | "closed",
  availability: { startsAt: Date, endsAt: Date },
  questions: [{
    _id: ObjectId,                // identifiant stable de la question
    order: number,
    type: "rating" | "multiple_choice" | "free_text",
    text: string,
    required: boolean,
    theme?: "workload" | "communication" | "recognition" | "collaboration"
          | "work_life_balance" | "organization" | "conditions",
    rating?: { min: number, max: number, minLabel?: string, maxLabel?: string },
    options?: [{ _id: ObjectId, label: string }]
  }],
  publishedAt?: Date,
  closedAt?: Date,
  createdBy: ObjectId,
  createdAt: Date,
  updatedAt: Date
}
```

Règles d'intégrité :
- `draft` : tout est modifiable.
- `published` : questions, types, échelles et anonymat **verrouillés** (seules la date de fin et la description peuvent être ajustées). Évite d'invalider les réponses déjà reçues.
- `closed` : lecture seule.
- Les questions sont embarquées : un sondage reste lisible en un seul document et ses `_id` de questions servent de clés stables pour les réponses.

### 3.4 `survey_series` (Souhaitable : questionnaires récurrents)

```ts
{ _id, organizationId, title, frequency: "weekly" | "monthly" | "quarterly", createdAt }
```

Les sondages d'une même série partagent les mêmes questions → comparaison entre périodes par `questionId` ou par `theme`.

### 3.5 `survey_participations` — QUI a répondu (jamais CE qu'il a répondu)

```ts
{
  _id: ObjectId,
  organizationId: ObjectId,
  surveyId: ObjectId,
  userId: ObjectId,
  submittedAt: Date
}
// Index unique : { surveyId: 1, userId: 1 }  → empêche la double soumission
```

Sert au taux de participation et à la protection contre les doublons. **Aucune référence à la réponse.**

### 3.6 `survey_responses` — CE qui a été répondu

```ts
{
  _id: string,                    // UUID v4 aléatoire (PAS un ObjectId)
  organizationId: ObjectId,
  surveyId: ObjectId,
  respondentId?: ObjectId,        // présent UNIQUEMENT si survey.anonymity === "identified"
  group?: string,                 // snapshot du groupe, uniquement si le sondage le prévoit
  submittedDay: Date,             // date tronquée au jour (00:00 UTC), pas d'horodatage précis
  answers: [{
    questionId: ObjectId,
    ratingValue?: number,
    selectedOptionId?: ObjectId,
    text?: string                 // commentaire brut (protégé)
  }]
}
```

Points de conception anti-ré-identification (à expliquer en soutenance) :

1. **`_id` en UUID v4** : un `ObjectId` contient un horodatage à la seconde et un compteur croissant ; il permettrait de corréler une réponse avec la ligne de `survey_participations` insérée au même instant.
2. **Pas d'horodatage précis** : seulement le jour (`submittedDay`).
3. **Pas de `userId`, d'e-mail ni d'adresse IP** dans les réponses anonymes ; les journaux applicatifs ne contiennent jamais `answers`.
4. **Écriture atomique** : participation + réponse insérées dans une transaction MongoDB (Atlas fournit un replica set). Les deux documents ne partagent aucun champ permettant de les relier.
5. **Ordre d'insertion** : pour les sondages anonymes, les réponses sont toujours lues triées aléatoirement ou par un champ non lié à l'ordre de soumission (jamais d'ordre naturel).
6. Les réponses d'un sondage **identifié** conservent `respondentId`, mais restent invisibles des autres employés.

### 3.7 `ai_analyses`

```ts
{
  _id: ObjectId,
  organizationId: ObjectId,
  surveyId: ObjectId,
  requestedBy: ObjectId,
  status: "pending" | "completed" | "failed" | "insufficient_data",
  eligibleCommentCount: number,   // calculé par le backend
  model: string,                  // traçabilité
  promptVersion: string,
  summary?: string,
  themes: [{
    _id: ObjectId,
    title: string,
    kind: "positive" | "concern" | "mixed",
    summary: string,
    mentionCount: number,         // recalculé/validé par le backend, pas pris tel quel de l'IA
    excerpts: string[]            // extraits désidentifiés et vérifiés
  }],
  recommendations: [{
    _id: ObjectId,
    themeId: ObjectId,
    title: string,
    rationale: string,
    reviewStatus: "proposed" | "accepted" | "edited" | "rejected"
  }],
  errorMessage?: string,
  createdAt: Date
}
```

Les contenus IA sont stockés dans cette collection, **séparés des résultats mesurés** : l'interface affiche deux blocs distincts, « Résultats mesurés » et « Interprétation générée par l'IA ».

### 3.7 bis `comment_corpus` (optionnel mais recommandé)

Pour éviter de désidentifier à chaque analyse, on peut stocker les commentaires nettoyés :

```ts
{ _id, organizationId, surveyId, questionId, sanitizedText, createdAt }
```

Sans `_id` lié à la réponse d'origine, sans horodatage précis. Les index ne doivent pas permettre de remonter à la réponse source.

### 3.8 `improvement_actions`

```ts
{
  _id: ObjectId,
  organizationId: ObjectId,
  title: string,
  objective: string,
  origin: { analysisId?: ObjectId, themeId?: ObjectId, recommendationId?: ObjectId, surveyId?: ObjectId },
  ownerUserId: ObjectId,
  targetDate: Date,
  status: "planned" | "in_progress" | "completed" | "cancelled",
  updates: [{ at: Date, authorId: ObjectId, note: string, status?: string }],
  sharedWithEmployees: boolean,
  publicSummary?: string,         // texte écrit pour les employés (jamais de contenu de réponses)
  followUp: { baselineSurveyId?: ObjectId, comparisonSurveyIds: ObjectId[] },
  createdBy: ObjectId,
  createdAt: Date,
  updatedAt: Date
}
```

### 3.9 Index

| Collection | Index |
|---|---|
| `users` | `{ email: 1 }` unique ; `{ organizationId: 1, role: 1 }` |
| `surveys` | `{ organizationId: 1, status: 1 }` ; `{ organizationId: 1, seriesId: 1 }` |
| `survey_participations` | `{ surveyId: 1, userId: 1 }` unique ; `{ surveyId: 1 }` |
| `survey_responses` | `{ surveyId: 1 }` |
| `ai_analyses` | `{ organizationId: 1, surveyId: 1, createdAt: -1 }` |
| `improvement_actions` | `{ organizationId: 1, status: 1 }` ; `{ ownerUserId: 1 }` |

---

## 4. Règles de confidentialité (module `privacy`)

Ce module est le cœur du projet : toutes les lectures de résultats passent par lui.

1. **Seuil minimal** : `N = organization.minResponseThreshold` (5 par défaut). Si le nombre de réponses admissibles d'un périmètre est `< N`, le résultat détaillé est masqué ou regroupé avec un groupe plus large.
2. **Suppression complémentaire** : si un groupe est masqué mais que le total et tous les autres groupes sont affichés, on peut le déduire par soustraction. Règle : si un seul groupe est masqué, masquer aussi le plus petit autre groupe (ou ne pas afficher de ventilation du tout).
3. **Pas de filtres croisés fins** : maximum un critère de ventilation (`group`) ; pas de filtre par jour ni de chronologie détaillée sur un sondage anonyme.
4. **Analyse IA** : refusée (`insufficient_data`) si le nombre de commentaires admissibles est `< N`.
5. **Comparaison de périodes** : affichée seulement si **les deux** périodes respectent le seuil.
6. **Désidentification des commentaires** avant tout envoi à Flask ou affichage d'extraits : masquage des e-mails, numéros de téléphone, noms et prénoms de la base `users` de l'organisation, mentions `@`, URLs. Un commentaire dont l'identification résiduelle reste probable (très court et très spécifique) est écarté plutôt qu'affiché.
7. **Exports, tableaux de bord, rapports IA** : tous passent par les mêmes fonctions de filtrage.
8. **Journaux** : jamais de contenu de `answers` ni de commentaires dans les logs.
9. **Interdits côté API** : aucune route ne retourne une réponse individuelle d'un sondage anonyme ; pour un sondage identifié, aucune route n'expose les réponses individuelles aux autres employés.

---

## 5. API Express (aperçu)

| Domaine | Routes principales | Rôle |
|---|---|---|
| Auth | `POST /auth/register-organization`, `POST /auth/login`, `POST /auth/logout`, `GET /me`, `PATCH /me` | public / tous |
| Employés | `GET/POST/PATCH /employees` | RH |
| Sondages (RH) | `GET/POST /surveys`, `PATCH /surveys/:id`, `POST /surveys/:id/publish`, `POST /surveys/:id/close` | RH |
| Sondages (Employé) | `GET /my/surveys`, `GET /my/surveys/:id`, `POST /my/surveys/:id/submit` | Employé |
| Résultats | `GET /surveys/:id/results`, `GET /dashboard`, `GET /surveys/compare?a=&b=` | RH |
| IA | `POST /surveys/:id/analysis`, `GET /analyses/:id`, `PATCH /analyses/:id/recommendations/:rid` | RH |
| Actions | `GET/POST /actions`, `PATCH /actions/:id`, `POST /actions/:id/updates` | RH |
| Visibilité | `GET /my/improvements` | Employé |

Middlewares, dans l'ordre : `authenticate` → `requireRole` → `tenantScope` (injecte `organizationId` depuis le token) → validation Zod → contrôleur → `errorHandler`.

---

## 6. Contrat Express ⇄ Flask

**Requête** `POST /analyze` (clé interne partagée dans l'en-tête `X-Internal-Key`, réseau privé si possible) :

```json
{
  "surveyTitle": "Bien-être au travail T4",
  "comments": [
    { "id": "c1", "text": "Les priorités changent constamment pendant la semaine..." }
  ],
  "language": "fr"
}
```

`id` est un identifiant temporaire généré pour la requête (c1, c2…), sans lien avec la base.

**Réponse attendue** (JSON strict) :

```json
{
  "status": "ok",
  "summary": "…",
  "themes": [
    { "title": "Organisation de la charge de travail", "kind": "concern",
      "summary": "…", "commentIds": ["c1", "c2"], "excerpts": ["…"] }
  ],
  "recommendations": [
    { "themeTitle": "Organisation de la charge de travail",
      "title": "Définir des priorités hebdomadaires", "rationale": "…" }
  ]
}
```

**Validation côté Express** avant enregistrement :
- schéma JSON respecté (Zod) ;
- `mentionCount` = nombre de `commentIds` valides, recalculé par le backend ;
- aucun pourcentage ou nombre inventé dans les textes (détection de chiffres non issus des données) ;
- extraits : doivent apparaître dans le corpus désidentifié et repasser le filtre d'identification ;
- thèmes sous le seuil de mentions (ex. `< 2`) : ignorés ;
- tout le texte est passé au filtre « pas de diagnostic, pas d'évaluation individuelle, pas de sanction » ;
- en cas d'échec : statut `failed` avec message, sans impact sur le reste de l'application.

**Côté Flask** : prompt système qui impose le ton neutre, l'interdiction de diagnostiquer, d'inventer des chiffres, d'attribuer un problème à une personne précise, et d'indiquer « éléments insuffisants » en cas de doute.

Pistes gratuites pour le modèle : API gratuite (Gemini, Groq, Hugging Face Inference) avec sortie JSON, ou approche locale open source (embeddings `sentence-transformers` + clustering pour trouver les thèmes, puis LLM pour les nommer). Prévoir une couche d'abstraction pour changer de fournisseur sans toucher au reste.

---

## 7. Statistiques (calculées par le backend)

Par agrégation MongoDB sur `survey_responses` :
- Taux de participation = `count(survey_participations) / nombre d'employés admissibles`.
- Question à échelle : moyenne et répartition par valeur.
- Choix multiple : nombre et pourcentage par option.
- Comparaison : écart de moyenne entre deux sondages d'une même série, formulé prudemment (« évolution observée », jamais « effet de l'action X »).

Tout passe par `privacy` avant d'être renvoyé.

---

## 8. Plan de développement par étapes

| Étape | Contenu | Résultat vérifiable |
|---|---|---|
| 0 | Monorepo, README, ESLint/Prettier, `.env.example`, connexion MongoDB, CI GitHub | Les 3 services démarrent en local |
| 1 | Organisation, utilisateurs, auth, RBAC, isolation par organisation | Tests : un employé ne peut pas appeler une route RH ; deux organisations ne se voient pas |
| 2 | CRUD sondages, 3 types de questions, brouillon → publié → clôturé, verrouillage | Un sondage publié refuse les modifications destructrices |
| 3 | Parcours employé : liste, remplissage, validation, confirmation, anti-doublon | Double soumission refusée ; sondage anonyme clairement signalé |
| 4 | Séparation participations/réponses, UUID, transaction | Test : impossible de relier réponse et utilisateur en base |
| 5 | Statistiques + module `privacy` (seuils, suppression complémentaire) + tableau de bord | Résultats masqués sous le seuil |
| 6 | Désidentification + service Flask + validation de sortie + analyse IA | Analyse affichée séparément des chiffres ; échec Flask sans impact |
| 7 | Actions d'amélioration, lien avec thèmes, suivi, visibilité employés | Recommandation → action → suivi |
| 8 | Comparaison entre périodes, séries récurrentes | Comparaison bloquée si seuil non atteint |
| 9 | Données de démonstration (Atlas Digital, 40 employés), tests finaux, déploiement (Vercel + Railway + Atlas), README final, support de présentation | Application en ligne et scénario complet démontrable |

Facultatifs à ajouter en fin de parcours : modèles de sondage, rappels d'échéance, export de rapports, canal de suggestions.

---

## 9. Tests prioritaires

- **Contrôle d'accès** : employé vs RH, isolation entre organisations, accès à un sondage non publié.
- **Anonymat** : aucune donnée d'identité dans `survey_responses` d'un sondage anonyme ; aucune route ne permet de lister les réponses individuelles ; pas d'`ObjectId` ni d'horodatage précis.
- **Seuils** : 4 réponses → masqué, 5 réponses → affiché ; suppression complémentaire ; comparaison bloquée.
- **Intégrité des sondages** : modifications refusées après publication ; dates de disponibilité respectées.
- **IA** : sortie invalide rejetée, chiffres inventés détectés, extrait identifiant bloqué, Flask indisponible sans effet sur les soumissions.
- **Parcours** : création du sondage → participation → résultats → analyse → action → sondage de suivi.

---

## 10. Décisions à valider en équipe

1. Seuil par défaut et minimum autorisé (proposition : 5 par défaut, plancher à 3).
2. Utilisation ou non du champ `group` dans les sondages anonymes (plus il y a de ventilation, plus le risque de ré-identification augmente ; proposition : désactivé par défaut).
3. Fournisseur de modèle d'IA pour Flask (API gratuite vs open source local).
4. Stockage ou non de `comment_corpus` (gain de performance vs surface d'exposition supplémentaire).
