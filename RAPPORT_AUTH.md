# Rapport — système d’authentification WellMind

Généré le 2026-10-31T13:25:10.967Z à partir du dossier `wellmind/`, branche `feature/frontend` (dernier commit : `e37a26f Backend : corrections des imports, seed de développement, route stats`).

Toutes les valeurs de secrets sont remplacées par `***`. Le code est recopié tel quel, à l’exception de ce masquage.

Fichiers modifiés et non commités au moment du rapport :

```
M backend/src/middleware/requireAuth.js
?? RAPPORT_AUTH.md
```

## 1. Arborescence

Le code du backend se trouve dans `backend/src/` (c’est là que sont `package.json` et `.env`). `node_modules`, `.next`, `.git`, `dist` exclus. Noms tels qu’ils existent sur le disque.

```
backend/
└── src/
    ├── controllers/
    │   ├── Aianalyses.controller.js
    │   ├── auth.controller.js
    │   ├── Employeesurveys.controller.js
    │   ├── Improvementactions.controller.js
    │   ├── organization.controller.js
    │   ├── participation.controller.js
    │   ├── stats.controller.js
    │   ├── surveys.controller.js
    │   └── Users.controller.js
    ├── db/
    │   ├── connect.js
    │   └── seed.js
    ├── middleware/
    │   ├── Asynchandler.js
    │   ├── authorizeRoles.js
    │   ├── Errorhandler.js
    │   └── requireAuth.js
    ├── models/
    │   ├── aiAnalyses.models.js
    │   ├── improvementActions.models.js
    │   ├── organizations.models.js
    │   ├── participations.models.js
    │   ├── responses.models.js
    │   ├── surveys.models.js
    │   └── User.models.js
    ├── routes/
    │   ├── Actions.routes.js
    │   ├── Analyses.routes.js
    │   ├── auth.routes.js
    │   ├── Employee.routes.js
    │   ├── Index.routes.js
    │   ├── Organization.routes.js
    │   ├── participation.routes.js
    │   ├── profile.routes.js
    │   ├── Stats.routes.js
    │   ├── surveys.routes.js
    │   └── Users.routes.js
    ├── utils/
    │   ├── AIClient.js
    │   ├── Aioutput.js
    │   ├── Anonymousid.js
    │   ├── Httperror.js
    │   ├── Jwt.js
    │   ├── Password.js
    │   ├── Redact.js
    │   └── validation.js
    ├── .env
    ├── .env.example
    ├── app.js
    ├── package-lock.json
    └── package.json
```

```
frontend/
├── src/
│   └── app/
│       ├── globals.css
│       ├── layout.tsx
│       └── page.tsx
├── .env.example
├── eslint.config.mjs
├── next.config.mjs
├── package.json
└── tsconfig.json
```

Note : le dépôt Git a `core.ignorecase = true` (système de fichiers Windows, insensible à la casse).

## 2. Configuration

### backend/src/package.json

**`backend/src/package.json`**

```json
{
  "name": "day5",
  "version": "1.0.0",
  "description": "",
  "license": "ISC",
  "author": "",
  "type": "module",
  "main": "index.js",
  "scripts": {
    "start": "node app.js",
    "dev": "nodemon app.js",
    "seed": "node db/seed.js"
  },
  "dependencies": {
    "axios": "^1.8.4",
    "bcrypt": "^5.1.1",
    "cookie-parser": "^1.4.7",
    "cors": "^2.8.5",
    "crypto": "^1.0.1",
    "dotenv": "^16.6.1",
    "express": "^5.2.1",
    "jsonwebtoken": "^9.0.2",
    "mongoose": "^8.24.4",
    "node-cron": "^4.6.0",
    "nodemon": "^3.1.9"
  },
  "devDependencies": {
    "nodemon": "^3.1.9"
  }
}
```

- `"type": "module"` : présent

### frontend/package.json

**`frontend/package.json`**

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

- `"type": "module"` : absent

### Versions installées (`npm ls --depth=0`)

Backend (`backend/src`) :

```
day5@1.0.0 C:\Users\DELL\Downloads\wellmind-etape0\wellmind\backend\src
+-- axios@1.20.0
+-- bcrypt@5.1.1
+-- cookie-parser@1.4.7
+-- cors@2.8.6
+-- crypto@1.0.1
+-- dotenv@16.6.1
+-- express@5.2.1
+-- jsonwebtoken@9.0.3
+-- mongoose@8.24.4
+-- node-cron@4.6.0
`-- nodemon@3.1.14
```

Frontend (`frontend`) :

```
wellmind-frontend@0.1.0 C:\Users\DELL\Downloads\wellmind-etape0\wellmind\frontend
+-- UNMET DEPENDENCY @eslint/eslintrc@^3.2.0
+-- UNMET DEPENDENCY @types/node@^20.17.0
+-- UNMET DEPENDENCY @types/react-dom@^19.0.0
+-- UNMET DEPENDENCY @types/react@^19.0.0
+-- UNMET DEPENDENCY eslint-config-next@^15.1.0
+-- UNMET DEPENDENCY eslint@^9.17.0
+-- UNMET DEPENDENCY next@^15.1.0
+-- UNMET DEPENDENCY react-dom@^19.0.0
+-- UNMET DEPENDENCY react@^19.0.0
`-- UNMET DEPENDENCY typescript@^5.7.2

npm error code ELSPROBLEMS
npm error missing: @eslint/eslintrc@^3.2.0, required by wellmind-frontend@0.1.0
npm error missing: @types/node@^20.17.0, required by wellmind-frontend@0.1.0
npm error missing: @types/react-dom@^19.0.0, required by wellmind-frontend@0.1.0
npm error missing: @types/react@^19.0.0, required by wellmind-frontend@0.1.0
npm error missing: eslint-config-next@^15.1.0, required by wellmind-frontend@0.1.0
npm error missing: eslint@^9.17.0, required by wellmind-frontend@0.1.0
npm error missing: next@^15.1.0, required by wellmind-frontend@0.1.0
npm error missing: react-dom@^19.0.0, required by wellmind-frontend@0.1.0
npm error missing: react@^19.0.0, required by wellmind-frontend@0.1.0
npm error missing: typescript@^5.7.2, required by wellmind-frontend@0.1.0
npm error A complete log of this run can be found in: C:\Users\DELL\AppData\Local\npm-cache\_logs\2026-10-31T13_25_12_351Z-debug-0.log
```

| Paquet | Backend | Frontend |
|---|---|---|
| express | 5.2.1 | non installé |
| mongoose | 8.24.4 | non installé |
| jsonwebtoken | 9.0.3 | non installé |
| cookie-parser | 1.4.7 | non installé |
| cors | 2.8.6 | non installé |
| bcryptjs | non installé | non installé |
| bcrypt | 5.1.1 | non installé |
| axios | 1.20.0 | non installé |
| next | non installé | non installé |

Le dossier `frontend/node_modules` n’existe pas (dépendances du frontend non installées).

### Variables d’environnement (valeurs masquées)

**`backend/src/.env`** : 

```
PORT=***

MONGO_URI=***
JWT_SECRET=***
MONGO_DB_NAME=***
CORS_ORIGIN=***
```

**`backend/src/.env.example`** : 

```
NODE_ENV=***
PORT=***

# MongoDB
MONGO_URI=***
MONGO_DB_NAME=***

# JWT
JWT_SECRET=***

# Frontend / CORS
CLIENT_URL=***

# Service IA Flask
AI_SERVICE_URL=***
AI_SERVICE_TOKEN=***
```

**`frontend/.env`** : introuvable

**`frontend/.env.local`** : introuvable

**`frontend/.env.example`** : 

```
# URL publique du backend Express
NEXT_PUBLIC_API_URL=***
```

### next.config

**`frontend/next.config.mjs`**

```js
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
};

export default nextConfig;
```

Rewrites : aucun.

## 3. Code complet des fichiers liés à l’authentification

### Fichier contenant signToken et verifyToken

**`backend/src/utils/Jwt.js`**

```js

import jwt from 'jsonwebtoken';

// Vérifier que JWT_SECRET existe
const getSecret = () => {
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    throw new Error('JWT_SECRET manquant dans le fichier .env');
  }

  return secret;
};

// Générer un token JWT
export const signToken = (user) => {
  if (!user?._id) {
    throw new Error("L'identifiant de l'utilisateur est manquant");
  }

  if (!user.organizationId) {
    throw new Error("L'organisation de l'utilisateur est manquante");
  }

  return jwt.sign(
    {
      userId: user._id.toString(),
      organizationId: user.organizationId.toString(),
      role: user.role,
    },
    getSecret(),
    {
      subject: user._id.toString(),
      algorithm: 'HS256',
      expiresIn: '8h',
    }
  );
};

// Vérifier un token JWT
export const verifyToken = (token) => {
  if (!token) {
    throw new Error('Token manquant');
  }

  return jwt.verify(token, getSecret(), {
    algorithms: ['HS256'],
  });
};
```

### utils/authCookie.js (ou équivalent)

introuvable : aucun fichier `authCookie.js` (quelle que soit la casse) n’existe dans `backend/src`. Le nom `AUTH_COOKIE` est pourtant importé depuis `../utils/authCookie.js` (voir sections 4a et 5).

### Middleware requireAuth

**`backend/src/middleware/requireAuth.js`**

```js

import User from '../models/User.models.js';
import { verifyToken } from '../utils/Jwt.js';
import { HttpError } from '../utils/Httperror.js';
import { AUTH_COOKIE } from '../utils/authCookie.js';

const requireAuth = async (req, _res, next) => {
    try {
        // 1. Récupérer le token depuis le cookie
        const token = req.cookies?.[AUTH_COOKIE];

        if (!token) {
            return next(new HttpError(401, 'Authentification requise'));
        }

        // 2. Vérifier le token JWT
        const decoded = verifyToken(token);

        // 3. Vérifier les informations du token
        if (!decoded?.userId) {
            return next(new HttpError(401, 'Token invalide'));
        }

        // 4. Récupérer l'utilisateur depuis MongoDB
        const user = await User.findById(decoded.userId)
            .select('_id organizationId firstName lastName email role isActive');

        if (!user || !user.isActive) {
            return next(new HttpError(401, 'Utilisateur introuvable ou désactivé'));
        }

        // 5. Ajouter l'utilisateur à la requête
        // Les contrôleurs lisent req.user.userId (chaîne) et req.user.organizationId
        req.user = {
            userId: user._id.toString(),
            organizationId: user.organizationId.toString(),
            role: user.role,
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
        };

        // 6. Passer au middleware suivant
        next();

    } catch (error) {
        // Erreurs liées au JWT
        if (
            error.name === 'TokenExpiredError' ||
            error.name === 'JsonWebTokenError' ||
            error.name === 'NotBeforeError'
        ) {
            return next(new HttpError(401, 'Token invalide ou expiré'));
        }

        // Autres erreurs : MongoDB, serveur...
        next(error);
    }
};

export default requireAuth;
```

### Middleware requireRole

**`backend/src/middleware/authorizeRoles.js`**

```js

import { HttpError } from '../utils/Httperror.js';

const requireRole = (...allowedRoles) => (req, _res, next) => {
    // Vérifier si l'utilisateur est authentifié
    if (!req.user) {
        return next(new HttpError(401, 'Authentification requise'));
    }

    // Vérifier si l'utilisateur possède un rôle autorisé
    if (!req.user.role || !allowedRoles.includes(req.user.role)) {
        return next(
            new HttpError(
                403,
                "Vous n'avez pas la permission d'effectuer cette action."
            )
        );
    }

    next();
};

export default requireRole;
```

### Contrôleur d’authentification

**`backend/src/controllers/auth.controller.js`**

```js

import mongoose from 'mongoose';

import Organization from '../models/organizations.models.js';
import User from '../models/User.models.js';

import { HttpError } from '../utils/Httperror.js';
import { runValidation, requireFields } from '../utils/validation.js';
import { signToken, verifyToken } from '../utils/Jwt.js';
import {
  validatePassword,
  hashPassword,
  comparePassword,
} from '../utils/Password.js';

// ======================================================
// 1. CONFIGURATION DES COOKIES
// ======================================================

const production = process.env.NODE_ENV === 'production';

const COOKIE_NAME = 'wellmind_session';

const cookieOptions = {
  httpOnly: true,
  secure: production,
  sameSite: 'lax',
  path: '/',
  maxAge: 8 * 60 * 60 * 1000, // 8 heures
};

// ======================================================
// 2. CHAMPS PUBLICS DE L'ORGANISATION
// ======================================================

const ORG_PUBLIC_FIELDS =
  'name slug industry size minResponseThreshold departments isActive';

// ======================================================
// 3. RETOURNER LES INFORMATIONS PUBLIQUES DE L'UTILISATEUR
// ======================================================

const publicUser = (user) => ({
  _id: user._id,
  organizationId: user.organizationId,
  firstName: user.firstName,
  lastName: user.lastName,
  email: user.email,
  role: user.role,
  isActive: user.isActive,
});

// ======================================================
// 4. ENVOYER LE JWT DANS UN COOKIE
// ======================================================

const setAuthCookie = (res, user) => {
  const token = signToken(user);

  res.cookie(COOKIE_NAME, token, cookieOptions);
};

// ======================================================
// 5. SUPPRIMER LE COOKIE
// ======================================================

const clearAuthCookie = (res) => {
  const { maxAge, ...options } = cookieOptions;

  res.clearCookie(COOKIE_NAME, options);
};

// ======================================================
// POST /api/auth/register-organization
// Inscription d'une organisation et de son HR_ADMIN
// ======================================================

export const registerOrganization = async (req, res) => {
  const {
    organizationName,
    industry,
    size,
    firstName,
    lastName,
    email,
    password,
  } = req.body || {};

  requireFields(req.body, [
    'organizationName',
    'firstName',
    'lastName',
    'email',
    'password',
  ]);

  validatePassword(password);

  const normalizedEmail = String(email).trim().toLowerCase();

  if (await User.exists({ email: normalizedEmail })) {
    throw new HttpError(409, 'Un compte existe déjà avec cet e-mail');
  }

  const passwordHash = await hashPassword(password);

  const session = await mongoose.startSession();

  let organization;
  let user;

  try {
    // Créer l'organisation et son administrateur
    // dans une seule transaction MongoDB.

    await session.withTransaction(async () => {
      organization = new Organization({
        name: organizationName,
        industry,
        size,
      });

      await runValidation(organization);
      await organization.save({ session });

      user = new User({
        organizationId: organization._id,
        firstName,
        lastName,
        email: normalizedEmail,
        passwordHash,
        role: 'HR_ADMIN',
      });

      await runValidation(user);
      await user.save({ session });
    });
  } finally {
    await session.endSession();
  }

  // Générer le JWT et le placer dans un cookie.
  setAuthCookie(res, user);

  // Ne pas retourner le token dans le JSON.
  res.status(201).json({
    message: 'Organisation créée avec succès.',
    user: publicUser(user),
    organization,
  });
};

// ======================================================
// POST /api/auth/login
// Connexion
// ======================================================

export const login = async (req, res) => {
  requireFields(req.body, ['email', 'password']);

  const email = String(req.body.email).trim().toLowerCase();

  const user = await User.findOne({ email }).select('+passwordHash');

  const valid =
    user && (await comparePassword(req.body.password, user.passwordHash));

  // Même message pour un email ou un mot de passe incorrect.
  if (!valid) {
    throw new HttpError(401, 'E-mail ou mot de passe incorrect');
  }

  if (!user.isActive) {
    throw new HttpError(403, 'Ce compte a été désactivé');
  }

  const organization = await Organization.findById(
    user.organizationId
  ).select(ORG_PUBLIC_FIELDS);

  if (!organization || !organization.isActive) {
    throw new HttpError(403, 'Cette organisation est désactivée');
  }

  // Générer le JWT et l'envoyer dans le cookie.
  setAuthCookie(res, user);

  res.json({
    message: 'Connexion réussie.',
    user: publicUser(user),
    organization,
  });
};

// ======================================================
// GET /api/auth/me
// Récupérer l'utilisateur connecté
// ======================================================

export const me = async (req, res) => {
  const token = req.cookies?.[COOKIE_NAME];

  // Aucun cookie : personne n'est connecté.
  if (!token) {
    return res.json({ user: null, organization: null });
  }

  let decoded;

  try {
    decoded = verifyToken(token);
  } catch {
    clearAuthCookie(res);

    return res.json({ user: null, organization: null });
  }

  // Récupérer l'utilisateur à partir de son identifiant.
  const user = await User.findById(decoded.userId);

  if (!user || !user.isActive) {
    clearAuthCookie(res);

    return res.json({ user: null, organization: null });
  }

  const organization = await Organization.findById(
    user.organizationId
  ).select(ORG_PUBLIC_FIELDS);

  if (!organization || !organization.isActive) {
    clearAuthCookie(res);

    return res.json({ user: null, organization: null });
  }

  res.json({
    user: publicUser(user),
    organization,
  });
};

// ======================================================
// POST /api/auth/logout
// Déconnexion
// ======================================================

export const logout = (req, res) => {
  clearAuthCookie(res);

  res.json({
    message: 'Déconnexion réussie.',
  });
};
```

### Routes d’authentification

**`backend/src/routes/auth.routes.js`**

```js

import { Router } from 'express';

import {
    registerOrganization,
    login,
    me,
    logout
} from '../controllers/auth.controller.js';

import requireAuth from '../middleware/requireAuth.js';
import asyncHandler from '../middleware/Asynchandler.js';

const router = Router();

// Routes publiques
router.post(
    '/register-organization',
    asyncHandler(registerOrganization)
);

router.post(
    '/login',
    asyncHandler(login)
);

// Routes privées : utilisateur connecté
router.get(
    '/me',
    asyncHandler(me)
);

router.post(
    '/logout',  
    asyncHandler(logout)
);

export default router;
```

### Point d’entrée du serveur

**`backend/src/app.js`**

```js
/*Requête HTTP
    |
    v
CORS
    |
    v
express.json()  → Lit le JSON
    |
    v
cookieParser()  → Lit les cookies
    |
    v
Routes API      → /api/...
    |
    v
notFound        → Si aucune route ne correspond
    |
    v
errorHandler    → Gère les erreurs*/
import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import connectDB from './db/connect.js';
import apiRoutes from './routes/Index.routes.js';
import { notFound, errorHandler } from './middleware/Errorhandler.js';
import cookieParser from 'cookie-parser';
const app = express();
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true,
}));
app.use(express.json({ limit: '100kb' }));
// Express 5 laisse req.body à undefined quand la requête n'a pas de corps :
// les contrôleurs lisent req.body.xxx directement
app.use((req, _res, next) => {
  req.body ??= {};
  next();
});
app.use(cookieParser());

app.use('/api', apiRoutes);
 
// Toujours en dernier
app.use(notFound);
app.use(errorHandler);
 
const PORT = process.env.PORT || 4000;
 
connectDB()
  .then(() => {
    app.listen(PORT, () => console.log(`Serveur démarré sur http://localhost:${PORT}`));
  })
  .catch((err) => {
    console.error('Connexion à MongoDB impossible :', err.message);
    process.exit(1);
  });
 
export default app;
```

### Montage de toutes les routes

**`backend/src/routes/Index.routes.js`**

```js
import { Router } from 'express';
import authRoutes from './auth.routes.js';
import organizationRoutes from './Organization.routes.js';
import usersRoutes from './Users.routes.js';
import profileRoutes from './profile.routes.js';
import surveysRoutes from './surveys.routes.js';
import employeeRoutes from './employee.routes.js';
import statsRoutes from './Stats.routes.js';
import participationRoutes from './participation.routes.js';
import analysesRoutes from './Analyses.routes.js';
import actionsRoutes from './Actions.routes.js';
 
// Regroupe toutes les routes sous /api
const router = Router();
 
router.get('/health', (_req, res) => res.json({ status: 'ok' }));
 
router.use('/auth', authRoutes);
router.use('/organization', organizationRoutes);
router.use('/users', usersRoutes);
router.use('/profile', profileRoutes);
router.use('/stats', statsRoutes);
router.use('/surveys', surveysRoutes);
router.use('/employee', employeeRoutes);
router.use('/participation', participationRoutes);
router.use('/analyses', analysesRoutes);
router.use('/actions', actionsRoutes);
 
export default router;
```

### Middleware de gestion des erreurs

**`backend/src/middleware/Errorhandler.js`**

```js
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
```

### Middleware asyncHandler (utilisé par toutes les routes)

**`backend/src/middleware/Asynchandler.js`**

```js
// Transmet les erreurs des contrôleurs async à errorHandler
const asyncHandler = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

export default asyncHandler;
```

### Classe HttpError (utilisée par requireAuth et requireRole)

**`backend/src/utils/Httperror.js`**

```js
// Erreur avec un code HTTP, transformée en réponse JSON par errorHandler.
// Exemple : throw new HttpError(404, 'Sondage introuvable');
export class HttpError extends Error {
  constructor(status, message, details = null) {
    super(message);
    this.name = 'HttpError';
    this.status = status;
    this.details = details;
  }
}
 
export default HttpError;
```

### Hachage des mots de passe (utilisé par le contrôleur d’authentification)

**`backend/src/utils/Password.js`**

```js
import bcrypt from 'bcrypt';
import { HttpError } from './Httperror.js';

const SALT_ROUNDS = 10;

// Règles minimales : 8 caractères, au moins une lettre et un chiffre
export const validatePassword = (password) => {
  if (typeof password !== 'string' || password.length < 8) {
    throw new HttpError(400, 'Le mot de passe doit contenir au moins 8 caractères');
  }
  if (password.length > 100) {
    throw new HttpError(400, 'Le mot de passe est trop long');
  }
  if (!/[A-Za-z]/.test(password) || !/\d/.test(password)) {
    throw new HttpError(400, 'Le mot de passe doit contenir au moins une lettre et un chiffre');
  }
};

export const hashPassword = (password) => bcrypt.hash(password, SALT_ROUNDS);

export const comparePassword = (password, hash) => bcrypt.compare(password, hash);
```

### Connexion MongoDB (appelée par le point d’entrée)

**`backend/src/db/connect.js`**

```js
import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const connectToMongoDB = async () => {
    try {
       await mongoose.connect(process.env.MONGO_URI, {
    // MONGO_DB_NAME permet d'utiliser une base dédiée (ex : wellmind_dev)
    dbName: process.env.MONGO_DB_NAME || 'chapitre',
});
console.log(`Connexion à MongoDB réussie ✅ (base : ${mongoose.connection.name})`);
    } catch (error) {
        console.error('Erreur de connexion à MongoDB ❌');
        console.error(error.message);

        process.exit(1);
    }
};

export default connectToMongoDB;
```

### Frontend

- Instance ou configuration Axios : introuvable (axios n’est pas dans les dépendances du frontend et n’est importé nulle part)
- Contexte ou hook d’authentification : introuvable
- Page de connexion : introuvable

Seuls fichiers de code du frontend (recopiés pour contexte, ils sont les seuls à appeler l’API) :

**`frontend/src/app/layout.tsx`**

```tsx
import type { Metadata } from "next";
import "./globals.css";

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

**`frontend/src/app/page.tsx`**

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

## 4. Vérifications par recherche dans le code

Fichiers parcourus : tous les `.js` de `backend/src` (hors `node_modules`) et tous les fichiers de code de `frontend` (hors `node_modules`, `.next`). Les fichiers `.env` ne sont pas parcourus.

### a. AUTH_COOKIE, wellmind_session, wellmind_token, res.cookie, clearCookie, req.cookies

**AUTH_COOKIE**

```
backend/src/middleware/requireAuth.js:5: import { AUTH_COOKIE } from '../utils/authCookie.js';
backend/src/middleware/requireAuth.js:10: const token = req.cookies?.[AUTH_COOKIE];
```

**wellmind_session**

```
backend/src/controllers/auth.controller.js:22: const COOKIE_NAME = 'wellmind_session';
```

**wellmind_token**

```
aucune occurrence
```

**res.cookie**

```
backend/src/controllers/auth.controller.js:60: res.cookie(COOKIE_NAME, token, cookieOptions);
```

**clearCookie**

```
backend/src/controllers/auth.controller.js:70: res.clearCookie(COOKIE_NAME, options);
```

**req.cookies**

```
backend/src/controllers/auth.controller.js:201: const token = req.cookies?.[COOKIE_NAME];
backend/src/middleware/requireAuth.js:10: const token = req.cookies?.[AUTH_COOKIE];
```

### b. Imports de requireAuth et requireRole

```
backend/src/routes/Actions.routes.js:12: import requireAuth from '../middleware/requireAuth.js';
backend/src/routes/Actions.routes.js:13: import requireRole from '../middleware/authorizeRoles.js';
backend/src/routes/Analyses.routes.js:9: import requireAuth from '../middleware/requireAuth.js';
backend/src/routes/Analyses.routes.js:10: import requireRole from '../middleware/authorizeRoles.js';
backend/src/routes/auth.routes.js:11: import requireAuth from '../middleware/requireAuth.js';
backend/src/routes/Employee.routes.js:9: import requireAuth from '../middleware/requireAuth.js';
backend/src/routes/Employee.routes.js:10: import requireRole from '../middleware/authorizeRoles.js';
backend/src/routes/Organization.routes.js:3: import requireAuth from '../middleware/requireAuth.js';
backend/src/routes/Organization.routes.js:4: import requireRole from '../middleware/authorizeRoles.js';
backend/src/routes/participation.routes.js:6: import requireAuth from '../middleware/requireAuth.js';
backend/src/routes/participation.routes.js:7: import requireRole from '../middleware/authorizeRoles.js';
backend/src/routes/profile.routes.js:3: import requireAuth from '../middleware/requireAuth.js';
backend/src/routes/Stats.routes.js:4: import requireAuth from '../middleware/requireAuth.js';
backend/src/routes/Stats.routes.js:5: import requireRole from '../middleware/authorizeRoles.js';
backend/src/routes/surveys.routes.js:12: import requireAuth from '../middleware/requireAuth.js';
backend/src/routes/surveys.routes.js:13: import requireRole from '../middleware/authorizeRoles.js';
backend/src/routes/Users.routes.js:11: import requireAuth from '../middleware/requireAuth.js';
backend/src/routes/Users.routes.js:12: import requireRole from '../middleware/authorizeRoles.js';
```

Forme des exports dans leurs fichiers :

```
backend/src/middleware/Asynchandler.js:4: export default asyncHandler;
backend/src/middleware/authorizeRoles.js:23: export default requireRole;
backend/src/middleware/Errorhandler.js:12: export const notFound = (req, _res, next) => {
backend/src/middleware/Errorhandler.js:19: export const errorHandler = (err, req, res, _next) => {
backend/src/middleware/Errorhandler.js:54: export default errorHandler;
backend/src/middleware/requireAuth.js:61: export default requireAuth;
```

- `requireAuth` (`backend/src/middleware/requireAuth.js`) : export default uniquement.
- `requireRole` (`backend/src/middleware/authorizeRoles.js`) : export default uniquement. Aucun fichier `requireRole.js` n’existe ; la fonction s’appelle `requireRole` dans le fichier `authorizeRoles.js`.

### c. Routes et middlewares par fichier

Analyse des appels `router.<méthode>(...)` dans l’ordre du fichier. « Middlewares » = ceux de `router.use(...)` déclarés avant la route + ceux passés directement à la route. Le préfixe vient de `Index.routes.js`, lui-même monté sur `/api` dans `app.js`.

#### `backend/src/routes/Actions.routes.js` — préfixe : `/api/actions`

| Méthode | Chemin | Middlewares | Handler |
|---|---|---|---|
| router.use | — | requireAuth, requireRole('HR_ADMIN') (s’applique aux routes suivantes) | |
| GET | '/summary' | requireAuth, requireRole('HR_ADMIN') | asyncHandler(getActionsSummary) |
| POST | '/from-recommendation' | requireAuth, requireRole('HR_ADMIN') | asyncHandler(createActionFromRecommendation) |
| POST | '/' | requireAuth, requireRole('HR_ADMIN') | asyncHandler(createAction) |
| GET | '/' | requireAuth, requireRole('HR_ADMIN') | asyncHandler(listActions) |
| GET | '/:id' | requireAuth, requireRole('HR_ADMIN') | asyncHandler(getAction) |
| PATCH | '/:id' | requireAuth, requireRole('HR_ADMIN') | asyncHandler(updateAction) |
| PATCH | '/:id/status' | requireAuth, requireRole('HR_ADMIN') | asyncHandler(changeActionStatus) |
| POST | '/:id/updates' | requireAuth, requireRole('HR_ADMIN') | asyncHandler(addActionUpdate) |

#### `backend/src/routes/Analyses.routes.js` — préfixe : `/api/analyses`

| Méthode | Chemin | Middlewares | Handler |
|---|---|---|---|
| router.use | — | requireAuth, requireRole('HR_ADMIN') (s’applique aux routes suivantes) | |
| POST | '/' | requireAuth, requireRole('HR_ADMIN') | asyncHandler(requestAnalysis) |
| GET | '/' | requireAuth, requireRole('HR_ADMIN') | asyncHandler(listAnalyses) |
| GET | '/latest' | requireAuth, requireRole('HR_ADMIN') | asyncHandler(getLatestAnalysis) |
| GET | '/:id' | requireAuth, requireRole('HR_ADMIN') | asyncHandler(getAnalysis) |
| PATCH | '/:id/recommendations/:recId' | requireAuth, requireRole('HR_ADMIN') | asyncHandler(reviewRecommendation) |

#### `backend/src/routes/auth.routes.js` — préfixe : `/api/auth`

| Méthode | Chemin | Middlewares | Handler |
|---|---|---|---|
| POST | '/register-organization' | aucun | asyncHandler(registerOrganization) |
| POST | '/login' | aucun | asyncHandler(login) |
| GET | '/me' | aucun | asyncHandler(me) |
| POST | '/logout' | aucun | asyncHandler(logout) |

#### `backend/src/routes/Employee.routes.js` — préfixe : `/api/employee` (importé dans Index.routes.js sous le nom `employee.routes.js` : casse différente, voir section 5)

| Méthode | Chemin | Middlewares | Handler |
|---|---|---|---|
| router.use | — | requireAuth, requireRole('EMPLOYEE') (s’applique aux routes suivantes) | |
| GET | '/surveys' | requireAuth, requireRole('EMPLOYEE') | asyncHandler(listMySurveys) |
| GET | '/surveys/:id' | requireAuth, requireRole('EMPLOYEE') | asyncHandler(getSurveyForEmployee) |
| POST | '/surveys/:id/submit' | requireAuth, requireRole('EMPLOYEE') | asyncHandler(submitSurvey) |
| GET | '/participations' | requireAuth, requireRole('EMPLOYEE') | asyncHandler(getMyParticipations) |
| GET | '/actions' | requireAuth, requireRole('EMPLOYEE') | asyncHandler(listEmployeeActions) |

#### `backend/src/routes/Index.routes.js` — préfixe : `/api`

| Appel | Chemin | Routeur / handler |
|---|---|---|
| router.get | '/health' | (_req, res) => res.json({ status: 'ok' }) |
| router.use | '/auth' | authRoutes |
| router.use | '/organization' | organizationRoutes |
| router.use | '/users' | usersRoutes |
| router.use | '/profile' | profileRoutes |
| router.use | '/stats' | statsRoutes |
| router.use | '/surveys' | surveysRoutes |
| router.use | '/employee' | employeeRoutes |
| router.use | '/participation' | participationRoutes |
| router.use | '/analyses' | analysesRoutes |
| router.use | '/actions' | actionsRoutes |

#### `backend/src/routes/Organization.routes.js` — préfixe : `/api/organization`

| Méthode | Chemin | Middlewares | Handler |
|---|---|---|---|
| router.use | — | requireAuth, requireRole('HR_ADMIN') (s’applique aux routes suivantes) | |
| GET | '/' | requireAuth, requireRole('HR_ADMIN') | asyncHandler(getOrganization) |
| PATCH | '/' | requireAuth, requireRole('HR_ADMIN') | asyncHandler(updateOrganization) |

#### `backend/src/routes/participation.routes.js` — préfixe : `/api/participation`

| Méthode | Chemin | Middlewares | Handler |
|---|---|---|---|
| router.use | — | requireAuth, requireRole('HR_ADMIN') (s’applique aux routes suivantes) | |
| GET | '/overview' | requireAuth, requireRole('HR_ADMIN') | asyncHandler(getParticipationOverview) |
| GET | '/surveys/:id' | requireAuth, requireRole('HR_ADMIN') | asyncHandler(getSurveyParticipation) |

#### `backend/src/routes/profile.routes.js` — préfixe : `/api/profile`

| Méthode | Chemin | Middlewares | Handler |
|---|---|---|---|
| PATCH | '/' | requireAuth | asyncHandler(updateProfile) |

#### `backend/src/routes/Stats.routes.js` — préfixe : `/api/stats`

| Méthode | Chemin | Middlewares | Handler |
|---|---|---|---|
| GET | '/surveys/:id' | requireAuth, requireRole('HR_ADMIN') | asyncHandler(getSurveyStats) |

#### `backend/src/routes/surveys.routes.js` — préfixe : `/api/surveys`

| Méthode | Chemin | Middlewares | Handler |
|---|---|---|---|
| router.use | — | requireAuth, requireRole('HR_ADMIN') (s’applique aux routes suivantes) | |
| POST | '/' | requireAuth, requireRole('HR_ADMIN') | asyncHandler(createSurvey) |
| GET | '/' | requireAuth, requireRole('HR_ADMIN') | asyncHandler(listSurveys) |
| GET | '/:id' | requireAuth, requireRole('HR_ADMIN') | asyncHandler(getSurvey) |
| PATCH | '/:id' | requireAuth, requireRole('HR_ADMIN') | asyncHandler(updateSurvey) |
| DELETE | '/:id' | requireAuth, requireRole('HR_ADMIN') | asyncHandler(deleteSurvey) |
| POST | '/:id/publish' | requireAuth, requireRole('HR_ADMIN') | asyncHandler(publishSurvey) |
| POST | '/:id/close' | requireAuth, requireRole('HR_ADMIN') | asyncHandler(closeSurvey) |
| POST | '/:id/duplicate' | requireAuth, requireRole('HR_ADMIN') | asyncHandler(duplicateSurvey) |

#### `backend/src/routes/Users.routes.js` — préfixe : `/api/users`

| Méthode | Chemin | Middlewares | Handler |
|---|---|---|---|
| router.use | — | requireAuth, requireRole('HR_ADMIN') (s’applique aux routes suivantes) | |
| POST | '/' | requireAuth, requireRole('HR_ADMIN') | asyncHandler(createUser) |
| GET | '/' | requireAuth, requireRole('HR_ADMIN') | asyncHandler(listUsers) |
| GET | '/:id' | requireAuth, requireRole('HR_ADMIN') | asyncHandler(getUser) |
| PATCH | '/:id' | requireAuth, requireRole('HR_ADMIN') | asyncHandler(updateUser) |
| PATCH | '/:id/deactivate' | requireAuth, requireRole('HR_ADMIN') | asyncHandler(deactivateUser) |
| PATCH | '/:id/activate' | requireAuth, requireRole('HR_ADMIN') | asyncHandler(activateUser) |
| PATCH | '/:id/password' | requireAuth, requireRole('HR_ADMIN') | asyncHandler(resetUserPassword) |

### d. Appels à jwt.sign et jwt.verify

```
--- backend/src/utils/Jwt.js:25
25:   return jwt.sign(
26:     {
27:       userId: user._id.toString(),
28:       organizationId: user.organizationId.toString(),
29:       role: user.role,
30:     },
31:     getSecret(),
32:     {
33:       subject: user._id.toString(),
34:       algorithm: 'HS256',
35:       expiresIn: '8h',
36:     }
37:   );
--- backend/src/utils/Jwt.js:46
46:   return jwt.verify(token, getSecret(), {
47:     algorithms: ['HS256'],
48:   });
49: };
50: 
```

### e. Options de cookie

```
backend/src/controllers/auth.controller.js:25: httpOnly: true,
backend/src/controllers/auth.controller.js:26: secure: production,
backend/src/controllers/auth.controller.js:27: sameSite: 'lax',
backend/src/controllers/auth.controller.js:28: path: '/',
backend/src/controllers/auth.controller.js:29: maxAge: 8 * 60 * 60 * 1000, // 8 heures
```

Contexte complet de la définition des options :

```
--- backend/src/controllers/auth.controller.js:24
24: const cookieOptions = {
25:   httpOnly: true,
26:   secure: production,
27:   sameSite: 'lax',
28:   path: '/',
29:   maxAge: 8 * 60 * 60 * 1000, // 8 heures
30: };
31: 
32: // ======================================================
```

### f. Configuration CORS

```
--- backend/src/app.js:28
28: app.use(cors({
29:   origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
30:   credentials: true,
31: }));
32: app.use(express.json({ limit: '100kb' }));
```

### g. Utilisations de req.user

```
backend/src/controllers/Aianalyses.controller.js:37: const analysis = await AiAnalysis.findOne({ _id: req.params.id, organizationId: req.user.organizationId });
backend/src/controllers/Aianalyses.controller.js:58: const { organizationId, userId } = req.user;
backend/src/controllers/Aianalyses.controller.js:169: const filter = { organizationId: req.user.organizationId };
backend/src/controllers/Aianalyses.controller.js:203: organizationId: req.user.organizationId,
backend/src/controllers/Aianalyses.controller.js:254: recommendation.reviewedBy = req.user.userId;
backend/src/controllers/Employeesurveys.controller.js:140: organizationId: req.user.organizationId,
backend/src/controllers/Employeesurveys.controller.js:149: const answered = new Set(await Participation.surveyIdsForUser(req.user.userId));
backend/src/controllers/Employeesurveys.controller.js:171: organizationId: req.user.organizationId,
backend/src/controllers/Employeesurveys.controller.js:176: const alreadySubmitted = await Participation.hasParticipated(survey._id, req.user.userId);
backend/src/controllers/Employeesurveys.controller.js:231: const { userId, organizationId } = req.user;
backend/src/controllers/Improvementactions.controller.js:80: const action = await ImprovementAction.findOne({ _id: req.params.id, organizationId: req.user.organizationId });
backend/src/controllers/Improvementactions.controller.js:107: const { organizationId, userId } = req.user;
backend/src/controllers/Improvementactions.controller.js:133: const { organizationId, userId } = req.user;
backend/src/controllers/Improvementactions.controller.js:192: const filter = { organizationId: req.user.organizationId };
backend/src/controllers/Improvementactions.controller.js:257: const match = { organizationId: new mongoose.Types.ObjectId(req.user.organizationId) };
backend/src/controllers/Improvementactions.controller.js:299: const { organizationId, userId } = req.user;
backend/src/controllers/Improvementactions.controller.js:353: action.changeStatus(status, req.user.userId, cleanNote(req.body.note));
backend/src/controllers/Improvementactions.controller.js:372: action.addUpdate(req.user.userId, note);
backend/src/controllers/Improvementactions.controller.js:384: const actions = await ImprovementAction.findVisibleForEmployees(req.user.organizationId);
backend/src/controllers/organization.controller.js:23: const organization = await Organization.findById(req.user.organizationId);
backend/src/controllers/organization.controller.js:30: const organization = await Organization.findById(req.user.organizationId);
backend/src/controllers/participation.controller.js:52: organizationId: req.user.organizationId,
backend/src/controllers/participation.controller.js:58: countEligible(req.user.organizationId),
backend/src/controllers/participation.controller.js:78: const organizationId = req.user.organizationId;
backend/src/controllers/participation.controller.js:126: const participations = await Participation.find({ userId: req.user.userId })
backend/src/controllers/stats.controller.js:31: const organizationId = req.user.organizationId;
backend/src/controllers/surveys.controller.js:56: const survey = await Survey.findOne({ _id: req.params.id, organizationId: req.user.organizationId });
backend/src/controllers/surveys.controller.js:70: organizationId: req.user.organizationId,
backend/src/controllers/surveys.controller.js:71: createdBy: req.user.userId,
backend/src/controllers/surveys.controller.js:84: const filter = { organizationId: req.user.organizationId };
backend/src/controllers/surveys.controller.js:200: createdBy: req.user.userId,
backend/src/controllers/Users.controller.js:19: const user = await User.findOne({ _id: req.params.id, organizationId: req.user.organizationId });
backend/src/controllers/Users.controller.js:32: await checkDepartment(req.user.organizationId, department);
backend/src/controllers/Users.controller.js:35: organizationId: req.user.organizationId,
backend/src/controllers/Users.controller.js:51: const filter = { organizationId: req.user.organizationId };
backend/src/controllers/Users.controller.js:86: if (user._id.toString() === req.user.userId && updates.role && updates.role !== 'HR_ADMIN') {
backend/src/controllers/Users.controller.js:90: if (updates.department) await checkDepartment(req.user.organizationId, updates.department);
backend/src/controllers/Users.controller.js:102: if (user._id.toString() === req.user.userId) {
backend/src/controllers/Users.controller.js:129: const user = await User.findById(req.user.userId).select('+passwordHash');
backend/src/middleware/authorizeRoles.js:6: if (!req.user) {
backend/src/middleware/authorizeRoles.js:11: if (!req.user.role || !allowedRoles.includes(req.user.role)) {
backend/src/middleware/requireAuth.js:33: // Les contrôleurs lisent req.user.userId (chaîne) et req.user.organizationId
backend/src/middleware/requireAuth.js:34: req.user = {
```

Propriétés lues :

- `organizationId` : `backend/src/controllers/Aianalyses.controller.js`, `backend/src/controllers/Aianalyses.controller.js (déstructuration)`, `backend/src/controllers/Employeesurveys.controller.js`, `backend/src/controllers/Employeesurveys.controller.js (déstructuration)`, `backend/src/controllers/Improvementactions.controller.js`, `backend/src/controllers/Improvementactions.controller.js (déstructuration)`, `backend/src/controllers/organization.controller.js`, `backend/src/controllers/participation.controller.js`, `backend/src/controllers/stats.controller.js`, `backend/src/controllers/surveys.controller.js`, `backend/src/controllers/Users.controller.js`, `backend/src/middleware/requireAuth.js`
- `role` : `backend/src/middleware/authorizeRoles.js`
- `userId` : `backend/src/controllers/Aianalyses.controller.js`, `backend/src/controllers/Aianalyses.controller.js (déstructuration)`, `backend/src/controllers/Employeesurveys.controller.js`, `backend/src/controllers/Employeesurveys.controller.js (déstructuration)`, `backend/src/controllers/Improvementactions.controller.js`, `backend/src/controllers/Improvementactions.controller.js (déstructuration)`, `backend/src/controllers/participation.controller.js`, `backend/src/controllers/surveys.controller.js`, `backend/src/controllers/Users.controller.js`, `backend/src/middleware/requireAuth.js`

Propriétés affectées à `req.user` dans `requireAuth` :

```
--- backend/src/middleware/requireAuth.js:34
34:         req.user = {
35:             userId: user._id.toString(),
36:             organizationId: user.organizationId.toString(),
37:             role: user.role,
38:             firstName: user.firstName,
39:             lastName: user.lastName,
40:             email: user.email,
41:         };
42: 
```

### h. Token renvoyé en JSON ou lu dans l’en-tête Authorization

Lignes contenant `authorization` ou `bearer` (insensible à la casse) :

```
aucune occurrence
```

Lignes contenant `token` dans le backend :

```
backend/src/controllers/auth.controller.js:9: import { signToken, verifyToken } from '../utils/Jwt.js';
backend/src/controllers/auth.controller.js:58: const token = signToken(user);
backend/src/controllers/auth.controller.js:60: res.cookie(COOKIE_NAME, token, cookieOptions);
backend/src/controllers/auth.controller.js:145: // Ne pas retourner le token dans le JSON.
backend/src/controllers/auth.controller.js:201: const token = req.cookies?.[COOKIE_NAME];
backend/src/controllers/auth.controller.js:204: if (!token) {
backend/src/controllers/auth.controller.js:211: decoded = verifyToken(token);
backend/src/middleware/requireAuth.js:3: import { verifyToken } from '../utils/Jwt.js';
backend/src/middleware/requireAuth.js:9: // 1. Récupérer le token depuis le cookie
backend/src/middleware/requireAuth.js:10: const token = req.cookies?.[AUTH_COOKIE];
backend/src/middleware/requireAuth.js:12: if (!token) {
backend/src/middleware/requireAuth.js:16: // 2. Vérifier le token JWT
backend/src/middleware/requireAuth.js:17: const decoded = verifyToken(token);
backend/src/middleware/requireAuth.js:19: // 3. Vérifier les informations du token
backend/src/middleware/requireAuth.js:21: return next(new HttpError(401, 'Token invalide'));
backend/src/middleware/requireAuth.js:49: error.name === 'TokenExpiredError' ||
backend/src/middleware/requireAuth.js:50: error.name === 'JsonWebTokenError' ||
backend/src/middleware/requireAuth.js:53: return next(new HttpError(401, 'Token invalide ou expiré'));
backend/src/utils/AIClient.js:32: //   AI_SERVICE_TOKEN=un_secret_partage   (facultatif, envoyé dans X-Service-Token)
backend/src/utils/AIClient.js:131: ...(process.env.AI_SERVICE_TOKEN && { 'X-Service-Token': process.env.AI_SERVICE_TOKEN }),
backend/src/utils/Jwt.js:2: import jwt from 'jsonwebtoken';
backend/src/utils/Jwt.js:15: // Générer un token JWT
backend/src/utils/Jwt.js:16: export const signToken = (user) => {
backend/src/utils/Jwt.js:40: // Vérifier un token JWT
backend/src/utils/Jwt.js:41: export const verifyToken = (token) => {
backend/src/utils/Jwt.js:42: if (!token) {
backend/src/utils/Jwt.js:43: throw new Error('Token manquant');
backend/src/utils/Jwt.js:46: return jwt.verify(token, getSecret(), {
```

Lignes `res.json(` / `.json({` contenant `token` :

```
aucune occurrence
```

### i. Frontend

**withCredentials**

```
aucune occurrence
```

**baseURL**

```
aucune occurrence
```

**localStorage**

```
aucune occurrence
```

**sessionStorage**

```
aucune occurrence
```

**document.cookie**

```
aucune occurrence
```

**credentials (fetch)**

```
aucune occurrence
```

**URL de l’API (localhost, /api, NEXT_PUBLIC_API_URL)**

```
frontend/src/app/page.tsx:3: const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";
```

`frontend/.env.example` déclare : `NEXT_PUBLIC_API_URL=***`

## 5. Imports cassés

121 imports relatifs vérifiés dans 42 fichiers `.js` du backend.

### Fichier ciblé inexistant ou casse différente

- `backend/src/middleware/requireAuth.js:5` importe `../utils/authCookie.js` → fichier inexistant
- `backend/src/routes/Index.routes.js:7` importe `./employee.routes.js` → la casse ne correspond pas, le fichier réel est `backend/src/routes/Employee.routes.js`

### Noms importés non exportés par le fichier ciblé

aucune

## 6. Exécution en lecture seule

### node --check

| Fichier | Résultat |
|---|---|
| `backend/src/app.js` | OK |
| `backend/src/controllers/Aianalyses.controller.js` | OK |
| `backend/src/controllers/auth.controller.js` | OK |
| `backend/src/controllers/Employeesurveys.controller.js` | OK |
| `backend/src/controllers/Improvementactions.controller.js` | OK |
| `backend/src/controllers/organization.controller.js` | OK |
| `backend/src/controllers/participation.controller.js` | OK |
| `backend/src/controllers/stats.controller.js` | OK |
| `backend/src/controllers/surveys.controller.js` | OK |
| `backend/src/controllers/Users.controller.js` | OK |
| `backend/src/db/connect.js` | OK |
| `backend/src/db/seed.js` | OK |
| `backend/src/middleware/Asynchandler.js` | OK |
| `backend/src/middleware/authorizeRoles.js` | OK |
| `backend/src/middleware/Errorhandler.js` | OK |
| `backend/src/middleware/requireAuth.js` | OK |
| `backend/src/models/aiAnalyses.models.js` | OK |
| `backend/src/models/improvementActions.models.js` | OK |
| `backend/src/models/organizations.models.js` | OK |
| `backend/src/models/participations.models.js` | OK |
| `backend/src/models/responses.models.js` | OK |
| `backend/src/models/surveys.models.js` | OK |
| `backend/src/models/User.models.js` | OK |
| `backend/src/routes/Actions.routes.js` | OK |
| `backend/src/routes/Analyses.routes.js` | OK |
| `backend/src/routes/auth.routes.js` | OK |
| `backend/src/routes/Employee.routes.js` | OK |
| `backend/src/routes/Index.routes.js` | OK |
| `backend/src/routes/Organization.routes.js` | OK |
| `backend/src/routes/participation.routes.js` | OK |
| `backend/src/routes/profile.routes.js` | OK |
| `backend/src/routes/Stats.routes.js` | OK |
| `backend/src/routes/surveys.routes.js` | OK |
| `backend/src/routes/Users.routes.js` | OK |
| `backend/src/utils/AIClient.js` | OK |
| `backend/src/utils/Aioutput.js` | OK |
| `backend/src/utils/Anonymousid.js` | OK |
| `backend/src/utils/Httperror.js` | OK |
| `backend/src/utils/Jwt.js` | OK |
| `backend/src/utils/Password.js` | OK |
| `backend/src/utils/Redact.js` | OK |
| `backend/src/utils/validation.js` | OK |

`node --check` ne vérifie que la syntaxe : il ne résout pas les imports.

### Démarrage du serveur

Conditions vérifiées avant le démarrage : `NODE_ENV` n’est pas défini dans `.env`, base MongoDB visée : `wellmind_dev` (base de développement, nom non secret). Le serveur ne fait aucune écriture au démarrage, en dehors de la création éventuelle des index Mongoose.

Commande : `node app.js` dans `backend/src`, arrêtée automatiquement après 12 secondes au plus. Port configuré : `3000`.

Sortie complète :

```
node:internal/modules/esm/resolve:272
    throw new ERR_MODULE_NOT_FOUND(
          ^

Error [ERR_MODULE_NOT_FOUND]: Cannot find module 'C:\Users\DELL\Downloads\wellmind-etape0\wellmind\backend\src\utils\authCookie.js' imported from C:\Users\DELL\Downloads\wellmind-etape0\wellmind\backend\src\middleware\requireAuth.js
    at finalizeResolution (node:internal/modules/esm/resolve:272:11)
    at moduleResolve (node:internal/modules/esm/resolve:879:10)
    at defaultResolve (node:internal/modules/esm/resolve:1006:11)
    at #cachedDefaultResolve (node:internal/modules/esm/loader:705:20)
    at #resolveAndMaybeBlockOnLoaderThread (node:internal/modules/esm/loader:725:38)
    at ModuleLoader.resolveSync (node:internal/modules/esm/loader:763:56)
    at #resolve (node:internal/modules/esm/loader:687:17)
    at ModuleLoader.getOrCreateModuleJob (node:internal/modules/esm/loader:607:35)
    at ModuleJob.syncLink (node:internal/modules/esm/module_job:276:33)
    at ModuleJob.link (node:internal/modules/esm/module_job:381:17) {
  code: 'ERR_MODULE_NOT_FOUND',
  url: 'file:///C:/Users/DELL/Downloads/wellmind-etape0/wellmind/backend/src/utils/authCookie.js'
}

Node.js v24.20.0
```

Code de sortie : 1.

## 7. Résumé

### Parcours d’une requête (tel que le code le décrit)

1. `POST /api/auth/login` → `app.js` (CORS, `express.json`, `req.body ??= {}`, `cookieParser`) → `routes/Index.routes.js` → `routes/auth.routes.js` → `asyncHandler(login)` (aucun middleware d’authentification).
2. `login` (`controllers/auth.controller.js`) : `requireFields`, `User.findOne({ email }).select('+passwordHash')`, `comparePassword` (`utils/Password.js`, bcrypt), contrôle `isActive` de l’utilisateur et de l’organisation.
3. `setAuthCookie` → `signToken(user)` (`utils/Jwt.js`, HS256, `expiresIn: '8h'`, charge utile `userId`, `organizationId`, `role`) → `res.cookie('wellmind_session', token, cookieOptions)` ; le JSON renvoie `user` et `organization`, pas le token.
4. Requête protégée (ex. `GET /api/organization`) : le navigateur renvoie le cookie ; `router.use(requireAuth, requireRole('HR_ADMIN'))` s’applique.
5. `requireAuth` (`middleware/requireAuth.js`) lit `req.cookies[AUTH_COOKIE]`, appelle `verifyToken`, recharge l’utilisateur (`User.findById`), refuse s’il est inactif, puis remplit `req.user` (`userId`, `organizationId`, `role`, …).
6. `requireRole` (`middleware/authorizeRoles.js`) compare `req.user.role` aux rôles autorisés (401 sans `req.user`, 403 sinon).
7. Le contrôleur lit `req.user.organizationId` / `req.user.userId` ; les erreurs `HttpError` passent par `errorHandler` (`middleware/Errorhandler.js`).
8. `GET /api/auth/me` n’a pas de `requireAuth` : le contrôleur `me` lit lui-même le cookie et renvoie `{ user: null, organization: null }` sans cookie valide.
9. `POST /api/auth/logout` → `clearAuthCookie` → `res.clearCookie('wellmind_session', options sans maxAge)` ; le JWT lui-même n’est pas révoqué côté serveur.
10. État actuel : `requireAuth.js` importe `AUTH_COOKIE` depuis `../utils/authCookie.js`, qui n’existe pas : le serveur s’arrête au démarrage (sections 5 et 6). `Index.routes.js` importe aussi `./employee.routes.js` alors que le fichier s’appelle `Employee.routes.js` (accepté sous Windows, refusé sur un système sensible à la casse).

### Points non vérifiables

- Le contenu prévu de `utils/authCookie.js` : le fichier est introuvable.
- Le comportement réel du navigateur (envoi du cookie entre `localhost:3000` et le port du backend, `SameSite=Lax`, `secure` en HTTPS) : aucun client frontend n’appelle encore l’API avec `credentials`.
- Le frontend : pas d’Axios, pas de contexte d’authentification, pas de page de connexion ; ses dépendances ne sont pas installées.
- Le comportement en production (`NODE_ENV=production`, HTTPS, `trust proxy`) : `trust proxy` n’est configuré nulle part (recherche de « trust proxy » dans app.js : aucune occurrence).
- Aucune requête HTTP n’a été envoyée pour ce rapport.

---

0 valeur(s) secrète(s) écrite(s) en dur dans le code ont été masquées par `***` dans ce rapport (chaînes de connexion MongoDB, clés d’API).
