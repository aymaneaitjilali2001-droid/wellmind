# Déploiement de WellMind

| Composant | Dossier | Hébergeur |
|---|---|---|
| Frontend Next.js | `frontend/` | Vercel |
| Backend Express | `backend/` | Render |
| Service IA Flask | `ai-service/` | Render |
| Base de données | — | MongoDB Atlas |

Le navigateur n'appelle que le frontend Vercel. Next.js transmet `/api/*` au backend grâce à un rewrite : le cookie httpOnly `wellmind_token` reste ainsi sur le domaine du site. Le backend appelle ensuite Flask avec l'en-tête `X-Internal-Key`.

## 1. Ce qui a été modifié, et pourquoi

| Fichier | Modification | Raison |
|---|---|---|
| 11 fichiers de `frontend/src/` (13 imports, voir ci-dessous) | Casse des imports alignée sur le vrai nom des fichiers | `npm run build` échouait, et ces chemins n'existent pas sous Linux |
| `frontend/.env.example` | Format de `API_URL` documenté | Éviter une URL fausse (voir section 4) |
| `backend/.env.example` | Ajout en commentaire de `AI_SERVICE_MOCK` et `SEED_PASSWORD` | Lister toutes les variables lues par le code |
| `backend/package.json` | `"engines": { "node": "24.x" }` | Utiliser sur Render la version de Node testée en local |
| `.gitignore` | `*.tsbuildinfo` | Ne plus versionner ce fichier de cache |
| `.github/workflows/ci.yml` | Job backend : Node 24, `npm ci`, puis `node --check` sur chaque fichier | Il lançait `typecheck`, `lint` et `test`, trois scripts qui n'existent pas dans le backend |
| `render.yaml` (nouveau) | Description des deux services Render | Éviter les erreurs de saisie ; aucun secret (`sync: false`) |

Imports corrigés :

| Avant | Après | Fichiers |
|---|---|---|
| `@/components/ButtonLink` | `@/components/Buttonlink` | `ActionForm.tsx`, `ActionsOverviewCard.tsx`, `ParticipationChart.tsx` |
| `@/components/SelectField` | `@/components/Selectfield` | `ActionForm.tsx` |
| `@/lib/api` | `@/lib/Api` | `ActionForm.tsx`, `AnalysisCard.tsx`, `SurveyResultsCard.tsx` |
| `@/lib/swr` | `@/lib/Swr` | `useAnalyses.ts`, `useDashboard.ts`, `useEmployeeSurveys.ts`, `useStats.ts` |
| `@/types/auth` | `@/types/Auth` | `GeneralInfoCard.tsx`, `PrivacyThresholdCard.tsx` |

Aucun fichier n'a été renommé et aucune variable d'environnement n'a changé de nom. Aucun fichier n'a été modifié dans `ai-service/`.

**À faire avant le commit**, pour que Git cesse de suivre le fichier de cache :

```bash
git rm --cached frontend/tsconfig.tsbuildinfo
```

## 2. Résultat de `npm run build`

Lancé dans le vrai dossier `frontend/` après les corrections, sous Windows : **réussi (code de sortie 0)**, 17 pages générées.

```
 ✓ Compiled successfully in 5.4s
   Linting and checking validity of types ...
   Collecting page data ...
 ✓ Generating static pages (17/17)
   Finalizing page optimization ...
   Collecting build traces ...

Route (app)                                 Size  First Load JS
┌ ○ /                                      74 kB         219 kB
├ ○ /_not-found                             1 kB         104 kB
├ ○ /employee                            5.83 kB         154 kB
├ ○ /employee/actions                    4.47 kB         149 kB
├ ○ /employee/history                    4.34 kB         153 kB
├ ƒ /employee/surveys/[id]               7.48 kB         156 kB
├ ○ /hr                                  10.8 kB         159 kB
├ ○ /hr/actions                          6.43 kB         157 kB
├ ƒ /hr/actions/[id]                     7.78 kB         156 kB
├ ƒ /hr/actions/[id]/edit                1.29 kB         160 kB
├ ○ /hr/actions/new                      1.73 kB         160 kB
├ ○ /hr/employees                        6.62 kB         158 kB
├ ƒ /hr/employees/[id]                   4.39 kB         162 kB
├ ○ /hr/employees/new                    1.69 kB         159 kB
├ ○ /hr/organization                     7.59 kB         155 kB
├ ○ /hr/surveys                          6.71 kB         158 kB
├ ƒ /hr/surveys/[id]                     11.7 kB         170 kB
├ ƒ /hr/surveys/[id]/edit                1.76 kB         165 kB
├ ○ /hr/surveys/new                        688 B         164 kB
├ ○ /login                               5.32 kB         156 kB
└ ○ /register                             5.7 kB         157 kB
```

Le build affiche un avertissement sur la racine du projet, dû au fichier `C:\Users\DELL\package-lock.json` situé en dehors du dépôt. Il ne concerne que cette machine (voir section 7).

Autres vérifications :

| Vérification | Résultat |
|---|---|
| `tsc --noEmit` et `npm run lint` (frontend) | aucune erreur |
| Casse stricte de tous les imports | 0 erreur sur 501 (frontend) et 123 (backend) |
| Dépendances importées mais non déclarées | aucune |
| `npm ci --dry-run` (frontend et backend) | réussi |
| `node --check` sur les 44 fichiers du backend | aucune erreur |
| `pytest` (`ai-service`, sans `.env`) | 32 tests réussis |
| Fichier `.env` suivi par Git | aucun, seulement les `.env.example` |

## 3. Réglages de chaque service

### Service IA et backend sur Render

Le plus simple : **New > Blueprint**, en choisissant ce dépôt. Render lit `render.yaml` et demande les variables marquées `sync: false`. Pour une création manuelle, saisissez ces réglages :

| Réglage | `wellmind-ai` | `wellmind-backend` |
|---|---|---|
| Runtime | Python | Node |
| Root Directory | `ai-service` | `backend` |
| Build Command | `pip install -r requirements.txt` | `npm ci` |
| Start Command | `gunicorn app:app --bind 0.0.0.0:$PORT --timeout 90` | `npm start` |
| Health Check Path | `/health` | `/api/health` |

`render.yaml` choisit l'offre gratuite (`plan: free`). Le `--timeout 90` est nécessaire : gunicorn coupe par défaut une requête après 30 s, alors que l'appel à Groq peut durer jusqu'à 45 s.

Vérifiez la branche déployée : celle du dépôt par défaut est `main`, et ces corrections sont pour l'instant sur `feature/frontend`.

### Frontend sur Vercel

| Réglage | Valeur |
|---|---|
| Framework Preset | Next.js |
| Root Directory | `frontend` |
| Build Command | valeur par défaut (`next build`) |
| Output Directory | valeur par défaut |
| Install Command | valeur par défaut |

## 4. Variables d'environnement

Ne recopiez jamais de vraies valeurs dans ce fichier ni dans `render.yaml`.

### Vercel (frontend)

| Nom | Exemple | Obligatoire |
|---|---|---|
| `API_URL` | `https://wellmind-backend.onrender.com` | Oui |

`API_URL` est **l'URL de base du backend, sans `/api` et sans `/` final**. Le rewrite ajoute lui-même `/api/:path*` : avec `/api` à la fin, les requêtes partiraient vers `/api/api/...`.

Cette valeur est **figée au moment du build**. Après l'avoir modifiée, il faut redéployer le frontend.

### Render : `wellmind-backend`

| Nom | Exemple | Obligatoire |
|---|---|---|
| `NODE_ENV` | `production` | Oui : active l'option `secure` du cookie |
| `MONGO_URI` | `mongodb+srv://<utilisateur>:<mot_de_passe>@<cluster>.mongodb.net/` | Oui |
| `MONGO_DB_NAME` | `wellmind` | Oui : sinon la base utilisée s'appelle `chapitre` |
| `JWT_SECRET` | chaîne aléatoire d'au moins 32 caractères | Oui |
| `CORS_ORIGIN` | `https://wellmind.vercel.app` | Oui |
| `AI_SERVICE_URL` | `https://wellmind-ai.onrender.com` | Oui |
| `AI_SERVICE_TOKEN` | même valeur que `AI_INTERNAL_KEY` | Oui |
| `AI_SERVICE_TIMEOUT_MS` | `60000` | Non (60000 par défaut) |
| `PORT` | fourni par Render | Ne pas définir |
| `AI_SERVICE_MOCK` | — | Ne pas définir en production |
| `SEED_PASSWORD` | — | Ne pas définir : le seed est refusé en production |

### Render : `wellmind-ai`

| Nom | Exemple | Obligatoire |
|---|---|---|
| `AI_INTERNAL_KEY` | même valeur que `AI_SERVICE_TOKEN` | Oui : sans elle, `/analyze` répond toujours 401 |
| `AI_API_KEY` | clé Groq | Oui |
| `AI_MODEL` | `openai/gpt-oss-20b` | Non (même valeur par défaut) |
| `AI_TIMEOUT_SECONDS` | `45` | Non (45 par défaut) |
| `PYTHON_VERSION` | `3.12.10` | Non, mais recommandée : version testée |
| `PORT` | fourni par Render | Ne pas définir |

Pour générer `JWT_SECRET` et la clé interne (une valeur différente pour chacun) :

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

## 5. Ordre de déploiement

1. **MongoDB Atlas** : dans Network Access, autorisez `0.0.0.0/0`, puis récupérez l'URI de connexion.
2. **`ai-service`** : déployez-le, puis vérifiez que `https://<wellmind-ai>/health` répond `{"service":"wellmind-ai","status":"ok"}`.
3. **`backend`** : renseignez `AI_SERVICE_URL` avec l'adresse de l'étape 2. Comme l'URL Vercel n'existe pas encore, mettez une valeur provisoire dans `CORS_ORIGIN`.
4. **`frontend`** : déployez-le sur Vercel avec `API_URL` égale à l'adresse du backend.
5. **Mise à jour de `CORS_ORIGIN`** : remplacez la valeur provisoire par l'URL Vercel définitive, sans `/` final. Render redéploie alors le backend.

## 6. Tests après déploiement

Faites ces tests depuis l'URL Vercel. `npm run seed` étant refusé en production, le premier compte RH se crée par `/register`.

**Infrastructure**
- [ ] `https://<site-vercel>/api/health` répond `{"status":"ok"}` : le rewrite fonctionne.
- [ ] `https://<wellmind-ai>/health` répond `ok`.

**Authentification**
- [ ] Créer une organisation sur `/register`, ce qui connecte le compte RH.
- [ ] Dans les outils du navigateur, vérifier que le cookie `wellmind_token` est sur le domaine Vercel, avec `HttpOnly` et `Secure`.
- [ ] Recharger la page : la session reste ouverte.
- [ ] Se déconnecter puis se reconnecter.

**Parcours complet**

Les résultats et l'analyse exigent par défaut **au moins 5 réponses**, et l'IA n'est appelée qu'à partir de **5 commentaires écrits**. Il faut donc 5 employés.

- [ ] Créer 5 comptes employés depuis l'espace RH.
- [ ] Créer un sondage avec une question notée et une question texte, puis le publier avec des dates incluant aujourd'hui.
- [ ] Avec chaque compte employé, répondre au sondage en écrivant un commentaire.
- [ ] Vérifier qu'une seconde réponse du même employé est refusée.
- [ ] Clôturer le sondage depuis l'espace RH.
- [ ] Consulter les résultats : score et répartition s'affichent.
- [ ] Lancer l'analyse IA : thèmes et recommandations s'affichent.

Si l'analyse échoue, vérifiez dans cet ordre : `AI_SERVICE_URL`, l'égalité entre `AI_SERVICE_TOKEN` et `AI_INTERNAL_KEY`, puis les logs de `wellmind-ai`.

## 7. Limites connues et nettoyage facultatif

**Non vérifié avant le déploiement réel :**
- le build sur Linux : la casse des imports a été contrôlée par un script, mais le build n'a tourné que sous Windows ;
- le démarrage par gunicorn, qui ne fonctionne pas sous Windows : seul le chargement de `app:app` et de ses routes a été testé ;
- les déploiements sur Render et Vercel, et la syntaxe de `render.yaml` selon Render (le YAML lui-même est valide) ;
- le délai maximal de Vercel pour une requête transmise par rewrite, à surveiller pour l'analyse IA.

**Offre gratuite de Render :** un service inactif peut se mettre en veille. Le premier appel sera alors lent, et la première analyse IA peut dépasser les 60 s du backend. Il suffit de la relancer ; les statistiques restent disponibles.

**Nettoyage facultatif (rien n'a été changé) :**
- `axios`, `crypto` et `node-cron` sont déclarés dans `backend/package.json`, mais jamais importés dans `backend/src/` ;
- `backend/src/node_modules/` est un reste de l'ancienne organisation : il est ignoré par Git, mais peut masquer en local un problème de dépendance ;
- `C:\Users\DELL\package.json`, son `package-lock.json` et son `node_modules` provoquent l'avertissement du build, et peuvent masquer une dépendance manquante ;
- le port par défaut dans le code (5001) diffère de celui des `.env.example` (5000), sans effet sur Render ;
- `pytest` figure dans `ai-service/requirements.txt`, et s'installe donc aussi en production.
