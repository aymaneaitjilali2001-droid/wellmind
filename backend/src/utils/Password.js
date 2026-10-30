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