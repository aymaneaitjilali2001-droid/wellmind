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
  if (details && typeof details === 'object' && 'errors' in details) {
    const list = (details as { errors: unknown }).errors;
    if (Array.isArray(list)) {
      return list
        .map((item) => {
          if (typeof item === 'string') return item;
          if (item && typeof item === 'object' && 'message' in item) {
            const { label, message } = item as { label?: unknown; message: unknown };
            return label ? `${String(label)} : ${String(message)}` : String(message);
          }
          return '';
        })
        .filter(Boolean);
    }
  }
  return [];
};