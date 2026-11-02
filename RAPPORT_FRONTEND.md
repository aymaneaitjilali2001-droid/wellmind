# Rapport d'état — frontend WellMind

Date : 2026-11-01 — Branche git : `feature/frontend` — Généré en lecture seule (seul ce fichier a été créé).

## 1. Arborescence de `frontend/` (sans node_modules, .next, .git)

```
frontend/
├── .env.example
├── eslint.config.mjs
├── next-env.d.ts
├── next.config.mjs
├── package-lock.json
├── package.json
├── tsconfig.json
└── src/
    ├── app/
    │   ├── employee/        (dossier vide)
    │   ├── hr/              (dossier vide)
    │   ├── login/           (dossier vide)
    │   ├── register/        (dossier vide)
    │   ├── globals.css
    │   ├── layout.tsx
    │   └── page.tsx
    ├── components/          (dossier vide)
    ├── context/
    │   └── Authcontext.tsx  (0 octet — fichier vide)
    ├── lib/
    │   ├── Api.ts
    │   ├── Routes.ts
    │   └── Swr.ts
    ├── styles/              (dossier vide)
    └── types/
        └── Auth.ts          (0 octet — fichier vide)
```

Suivi git (`git ls-files frontend`) : seuls `.env.example`, `eslint.config.mjs`, `next.config.mjs`, `package.json`, `src/app/globals.css`, `src/app/layout.tsx`, `src/app/page.tsx`, `tsconfig.json` sont suivis. `package-lock.json`, `src/context/`, `src/lib/`, `src/types/` ne sont pas suivis ; `.env.example`, `next.config.mjs`, `package.json`, `src/app/layout.tsx` sont modifiés et non commités.

## 2. Présence des fichiers attendus

| Fichier | Présent / absent |
|---|---|
| frontend/package.json | présent |
| frontend/next.config.mjs (.js / .ts) | présent (`next.config.mjs`) |
| frontend/postcss.config.mjs (.js) | **absent** |
| frontend/tsconfig.json | présent |
| frontend/.env | absent |
| frontend/.env.local | absent |
| frontend/.env.example | présent |
| src/app/globals.css | présent |
| src/app/layout.tsx | présent |
| src/app/page.tsx | présent |
| src/app/login/page.tsx | **absent** (le dossier `login/` existe, vide) |
| src/app/register/page.tsx | **absent** (le dossier `register/` existe, vide) |
| src/app/hr/layout.tsx | **absent** (le dossier `hr/` existe, vide) |
| src/app/hr/page.tsx | **absent** |
| src/app/employee/layout.tsx | **absent** (le dossier `employee/` existe, vide) |
| src/app/employee/page.tsx | **absent** |
| src/lib/api.ts | **absent sous ce nom** — présent sous `src/lib/Api.ts` (A majuscule) |
| src/lib/swr.ts | **absent sous ce nom** — présent sous `src/lib/Swr.ts` (S majuscule) |
| src/lib/routes.ts | **absent sous ce nom** — présent sous `src/lib/Routes.ts` (R majuscule) |
| src/types/auth.ts | **absent sous ce nom** — présent sous `src/types/Auth.ts` (A majuscule), **fichier vide (0 octet)** |
| src/context/AuthContext.tsx | **absent sous ce nom** — présent sous `src/context/Authcontext.tsx` (c minuscule), **fichier vide (0 octet)** |
| src/components/Providers.tsx | absent |
| src/components/AuthCard.tsx | absent |
| src/components/AppHeader.tsx | absent |
| src/components/RequireRole.tsx | absent |
| src/components/ui/Button.tsx | absent (le dossier `ui/` n'existe pas) |
| src/components/ui/TextField.tsx | absent |
| src/components/ui/Alert.tsx | absent |
| src/components/ui/Loading.tsx | absent |
| Fichiers `*.module.css` | aucun |
| Dossier `src/styles/` | présent, **vide** |

Autres fichiers présents dans `src/` hors liste : aucun, en dehors des 5 variantes de casse ci-dessus (`Api.ts`, `Swr.ts`, `Routes.ts`, `Auth.ts`, `Authcontext.tsx`).
Hors `src/`, à la racine de `frontend/` : `eslint.config.mjs`, `next-env.d.ts`, `package-lock.json`.

Contenu de `.env.example` (valeurs masquées) :

```
# URL publique du backend Express
NEXT_PUBLIC_API_URL=***
```

## 3. Contenu des fichiers

### `frontend/package.json`

```json
{
  "name": "wellmind-frontend",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "typecheck": "tsc --noEmit",
    "lint": "eslint src"
  },
  "dependencies": {
    "axios": "^1.21.0",
    "next": "^15.1.0",
    "react": "^19.0.0",
    "react-dom": "^19.0.0"
  },
  "devDependencies": {
    "@eslint/eslintrc": "^3.2.0",
    "@types/node": "^20.17.0",
    "@types/react": "^19.0.0",
    "@types/react-dom": "^19.0.0",
    "eslint": "^9.17.0",
    "eslint-config-next": "^15.1.0",
    "typescript": "^5.7.2"
  },
  "engines": {
    "node": ">=20"
  }
}
```

### `frontend/next.config.mjs`

```js
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  // Toutes les requêtes vers /api/... sont transmises au backend Express.
  // Pour le navigateur, l'API est donc sur le même domaine que le site :
  // le cookie d'authentification est envoyé automatiquement.
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${process.env.API_URL ?? 'http://localhost:4000'}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
```

### `frontend/tsconfig.json`

```json
{
  "compilerOptions": {
    "target": "ES2017",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [{ "name": "next" }],
    "paths": { "@/*": ["./src/*"] }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

### `frontend/eslint.config.mjs`

```js
import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({ baseDirectory: __dirname });

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  { ignores: [".next/**", "node_modules/**", "next-env.d.ts"] },
];

export default eslintConfig;
```

### `frontend/src/app/globals.css`

```css
:root {
  --bg: #f7f8fa;
  --fg: #1c2430;
  --muted: #5b6676;
  --ok: #1f7a4d;
  --ko: #b3261e;
}

* {
  box-sizing: border-box;
}

body {
  margin: 0;
  background: var(--bg);
  color: var(--fg);
  font-family: system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
  line-height: 1.5;
}

main {
  max-width: 40rem;
  margin: 0 auto;
  padding: 3rem 1.25rem;
}

.muted {
  color: var(--muted);
}

.ok {
  color: var(--ok);
}

.ko {
  color: var(--ko);
}
```

### `frontend/src/app/layout.tsx`

```tsx
import type { Metadata } from "next";


export const metadata: Metadata = {
  title: "WellMind",
  description: "Plateforme de retours d'expérience et d'amélioration du bien-être au travail",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  );
}
```

### `frontend/src/app/page.tsx`

```tsx
export const dynamic = "force-dynamic";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

async function getBackendStatus(): Promise<boolean> {
  try {
    const res = await fetch(`${API_URL}/health`, { cache: "no-store" });
    return res.ok;
  } catch {
    return false;
  }
}

export default async function HomePage() {
  const backendOk = await getBackendStatus();

  return (
    <main>
      <h1>WellMind</h1>
      <p className="muted">
        Plateforme de retours d&apos;expérience au travail et d&apos;amélioration continue.
      </p>
      <p>
        Backend :{" "}
        <strong className={backendOk ? "ok" : "ko"}>{backendOk ? "disponible" : "indisponible"}</strong>
      </p>
    </main>
  );
}
```

### `frontend/src/lib/Api.ts`

```ts
import axios, { isAxiosError, type AxiosError } from 'axios';

// ---------------------------------------------------------------
// Client HTTP unique pour appeler le backend.
// baseURL '/api' : les requêtes passent par les rewrites de Next.js
// (next.config.mjs), donc l'API est sur le même domaine que le site
// et le cookie httpOnly est envoyé automatiquement.
// ---------------------------------------------------------------

export const api = axios.create({
  baseURL: '/api',
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
  timeout: 30000,
});

// Format des erreurs renvoyées par errorHandler côté backend
export interface ApiErrorBody {
  error?: string;
  details?: unknown;
}

// Appelé quand une route protégée répond 401 (session expirée) :
// AuthContext s'y abonne pour vider l'utilisateur et renvoyer vers /login
let onUnauthorized: (() => void) | null = null;

export const setUnauthorizedHandler = (handler: (() => void) | null) => {
  onUnauthorized = handler;
};

api.interceptors.response.use(
  (response) => response,
  (error: AxiosError<ApiErrorBody>) => {
    const url = error.config?.url ?? '';
    // Un 401 sur /auth/login (mauvais mot de passe) n'est pas une session expirée
    if (error.response?.status === 401 && !url.startsWith('/auth/')) {
      onUnauthorized?.();
    }
    return Promise.reject(error);
  }
);

// Message lisible à afficher à l'utilisateur
export const getErrorMessage = (error: unknown, fallback = 'Une erreur est survenue. Réessayez.'): string => {
  if (isAxiosError<ApiErrorBody>(error)) {
    if (error.code === 'ECONNABORTED') return 'Le serveur met trop de temps à répondre. Réessayez.';
    if (!error.response) return 'Serveur injoignable. Vérifiez que le backend est démarré.';
    if (error.response.status >= 500 && !error.response.data?.error) {
      return 'Le serveur rencontre un problème. Réessayez plus tard.';
    }
    return error.response.data?.error ?? fallback;
  }
  return error instanceof Error && error.message ? error.message : fallback;
};

// Détails éventuels d'une erreur de validation, en liste de phrases
export const getErrorDetails = (error: unknown): string[] => {
  if (!isAxiosError<ApiErrorBody>(error)) return [];
  const details = error.response?.data?.details;

  if (Array.isArray(details)) {
    return details
      .map((d) => (d && typeof d === 'object' && 'message' in d ? String((d as { message: unknown }).message) : ''))
      .filter(Boolean);
  }
  if (details && typeof details === 'object' && 'missing' in details) {
    const missing = (details as { missing: unknown }).missing;
    if (Array.isArray(missing) && missing.length) return [`Champs manquants : ${missing.join(', ')}`];
  }
  return [];
};
```

### `frontend/src/lib/Routes.ts`

```ts
import type { Role } from '../types/auth';
 
// Page d'accueil de chaque rôle après la connexion
export const homeForRole = (role: Role): string => (role === 'HR_ADMIN' ? '/hr' : '/employee');
```

### `frontend/src/lib/Swr.ts`

```ts
import useSWR, { type SWRConfiguration } from 'swr';
import { isAxiosError, type AxiosError } from 'axios';
import { api, type ApiErrorBody } from './Api';

// ---------------------------------------------------------------
// SWR : chargement des données avec cache.
// La clé SWR est le chemin de l'API (ex : '/users'), passé au fetcher.
// ---------------------------------------------------------------

export type ApiError = AxiosError<ApiErrorBody>;

export const fetcher = <T>(url: string): Promise<T> => api.get<T>(url).then((res) => res.data);

// Configuration commune, appliquée par <SWRConfig> dans Providers.tsx
export const swrConfig: SWRConfiguration = {
  fetcher,
  revalidateOnFocus: false,
  dedupingInterval: 2000,
  // Pas de nouvel essai pour une erreur 4xx (accès refusé, introuvable…) :
  // elle ne se corrigera pas seule. 3 essais maximum pour les autres.
  onErrorRetry: (error, _key, _config, revalidate, { retryCount }) => {
    const status = isAxiosError(error) ? error.response?.status : undefined;
    if (status !== undefined && status >= 400 && status < 500) return;
    if (retryCount >= 3) return;
    setTimeout(() => void revalidate({ retryCount }), 2000 * 2 ** retryCount);
  },
};

// Lecture typée d'une route GET.
//   const { data, error, isLoading, mutate } = useApi<User[]>('/users');
// Clé null = ne rien charger (ex : un id pas encore disponible).
export const useApi = <T>(key: string | null, config?: SWRConfiguration<T, ApiError>) =>
  useSWR<T, ApiError>(key, config);
```

### `frontend/src/types/Auth.ts`

*(fichier vide — 0 octet)*

### `frontend/src/context/Authcontext.tsx`

*(fichier vide — 0 octet)*

`postcss.config.*` : absent.

## 4. Dépendances

`frontend/node_modules` : **existe**.

Sortie de `npm ls --depth=0` :

```
wellmind-frontend@0.1.0 C:\Users\DELL\Downloads\wellmind-etape0\wellmind\frontend
+-- @eslint/eslintrc@3.3.7
+-- @types/node@20.19.43
+-- @types/react-dom@19.3.0
+-- @types/react@19.3.0
+-- axios@1.21.0
+-- eslint-config-next@15.5.28
+-- eslint@9.39.5
+-- next@15.5.28
+-- react-dom@19.3.1
+-- react@19.3.1
`-- typescript@5.9.3

```

| Paquet | Déclaré dans package.json | Installé dans frontend/node_modules | Version |
|---|---|---|---|
| next | oui (`^15.1.0`) | oui | 15.5.28 |
| react | oui (`^19.0.0`) | oui | 19.3.1 |
| react-dom | oui (`^19.0.0`) | oui | 19.3.1 |
| typescript | oui (`^5.7.2`, dev) | oui | 5.9.3 |
| axios | oui (`^1.21.0`) | oui | 1.21.0 |
| swr | **non** | **non** | — (voir remarque) |
| tailwindcss | **non** | **non** | — |
| @tailwindcss/postcss | **non** | **non** | — |
| postcss | non (pas en direct) | oui, seulement comme dépendance interne de next (`next@15.5.28 → postcss@8.4.31`) | 8.4.31 |

**Remarque importante sur `swr`** : il n'est pas dans `frontend/node_modules`, mais Node et TypeScript le trouvent quand même dans un dossier **extérieur au projet** : `C:\Users\DELL\node_modules\swr` (version 2.5.1). C'est pour cela que `tsc` ne signale pas d'erreur sur `import useSWR from 'swr'` dans `Swr.ts`. Sur une autre machine (ou en CI), cet import échouerait.

## 5. Vérifications de configuration

**a. Rewrites dans `next.config.mjs`** : oui.
- source : `'/api/:path*'`
- destination : `` `${process.env.API_URL ?? 'http://localhost:4000'}/api/:path*` ``
- La variable utilisée est `API_URL` (pas `NEXT_PUBLIC_API_URL`). `.env.example` ne déclare que `NEXT_PUBLIC_API_URL`.

**b. `globals.css`** : ne contient **pas** `@import "tailwindcss"` et **pas** de bloc `@theme` (aucune couleur brand). C'est du CSS classique avec des variables `:root` (`--bg`, `--fg`, `--muted`, `--ok`, `--ko`).
En outre, `src/app/layout.tsx` **n'importe pas** `globals.css` (aucune ligne `import "./globals.css"`).

**c. `postcss.config`** : fichier absent, donc pas de plugin `@tailwindcss/postcss`.

**d. Alias dans `tsconfig.json`** : oui.

```json
"paths": { "@/*": ["./src/*"] }
```

(Aucun fichier de `src/` n'utilise actuellement l'alias `@/`.)

**e. Imports relatifs** :

| Fichier | Import | Cible réelle | État |
|---|---|---|---|
| src/lib/Routes.ts (l. 1) | `'../types/auth'` | `src/types/Auth.ts` | **CASSÉ** : casse différente (`auth` ≠ `Auth`) **et** le fichier cible est vide (pas d'export `Role`) |
| src/lib/Swr.ts (l. 3) | `'./Api'` | `src/lib/Api.ts` | OK (même casse) |

Import de paquet à signaler : `src/lib/Swr.ts` importe `'swr'`, non installé dans le projet (résolu hors projet, voir §4).

**f. Recherche dans `src/`** :

| Fichier | Ligne | Code |
|---|---|---|
| src/app/page.tsx | 3 | `const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";` |
| src/app/page.tsx | 7 | ``const res = await fetch(`${API_URL}/health`, { cache: "no-store" });`` |
| src/lib/Api.ts | 5 | `// baseURL '/api' : les requêtes passent par les rewrites de Next.js` |
| src/lib/Api.ts | 11 | `baseURL: '/api',` |
| src/lib/Api.ts | 12 | `withCredentials: true,` |

Aucune occurrence de `localStorage`, `sessionStorage`, `document.cookie`.

## 6. Exécution en lecture seule

### `npx tsc --noEmit` (code de sortie 2)

```
src/lib/Routes.ts(1,27): error TS1261: Already included file name 'C:/Users/DELL/Downloads/wellmind-etape0/wellmind/frontend/src/types/auth.ts' differs from file name 'C:/Users/DELL/Downloads/wellmind-etape0/wellmind/frontend/src/types/Auth.ts' only in casing.
  The file is in the program because:
    Imported via '../types/auth' from file 'C:/Users/DELL/Downloads/wellmind-etape0/wellmind/frontend/src/lib/Routes.ts'
    Matched by include pattern '**/*.ts' in 'C:/Users/DELL/Downloads/wellmind-etape0/wellmind/frontend/tsconfig.json'
src/lib/Routes.ts(1,27): error TS2306: File 'C:/Users/DELL/Downloads/wellmind-etape0/wellmind/frontend/src/types/auth.ts' is not a module.
```

### `npm run lint` (code de sortie 0)

```

> wellmind-frontend@0.1.0 lint
> eslint src

```

(Aucune erreur ni avertissement ESLint.)

## 7. Résumé

- En place : Next 15.5 / React 19 / TypeScript / axios installés ; rewrite `/api/:path*` vers le backend ; client axios (`Api.ts` : `withCredentials`, intercepteur 401) ; helpers SWR (`Swr.ts`) ; `Routes.ts` ; page d'accueil qui teste `/health`.
- Manquant : Tailwind v4 (paquets, `postcss.config`, `@import`/`@theme`), `swr` dans package.json, contenu de `types/auth.ts` et `AuthContext.tsx` (vides), toutes les pages login/register/hr/employee, tous les composants (`components/` et `styles/` vides).
- Erreurs : casse des noms de fichiers différente de l'attendu (`Api.ts`, `Swr.ts`, `Routes.ts`, `Auth.ts`, `Authcontext.tsx`) ; `tsc` échoue (2 erreurs dans `Routes.ts` : casse de `../types/auth` + module vide) ; `swr` résolu depuis `C:\Users\DELL\node_modules`, hors projet.
- Autres : `layout.tsx` n'importe pas `globals.css` ; `page.tsx` appelle `${NEXT_PUBLIC_API_URL}/health` en direct, sans passer par le rewrite ; le rewrite lit `API_URL`, que `.env.example` ne déclare pas.
- Lint : OK, aucune erreur.

### Points non vérifiés

- Build et démarrage (`npm run build` / `npm run dev`) non lancés (interdit).
- Fonctionnement réel du rewrite et du backend (aucun serveur démarré) ; existence de la route `/health` côté backend non vérifiée.
- Contenu de `.next/` (build précédent) non examiné.
- Variables d'environnement définies au niveau du système (hors fichiers .env) non consultées.
- Origine de l'installation de `C:\Users\DELL\node_modules` non examinée.
