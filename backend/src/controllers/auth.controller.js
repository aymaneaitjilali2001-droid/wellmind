
import mongoose from 'mongoose';

import Organization from '../models/organizations.models.js';
import User from '../models/users.models.js';

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
