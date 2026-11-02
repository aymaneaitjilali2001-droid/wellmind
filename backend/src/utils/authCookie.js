// ---------------------------------------------------------------
// Cookie d'authentification.
// httpOnly : le JavaScript du navigateur ne peut pas lire le token,
// donc une faille XSS ne permet pas de le voler.
// ---------------------------------------------------------------

export const AUTH_COOKIE = 'wellmind_token';

const COOKIE_MAX_AGE_MS = 8 * 60 * 60 * 1000; // même durée que le JWT
const cookieOptions = () => ({
  httpOnly: true,
  // En production (HTTPS), le cookie n'est envoyé qu'en HTTPS
  secure: process.env.NODE_ENV === 'production',
  // Le frontend passe par le proxy Next.js (même domaine) : 'lax' suffit
  // et bloque l'envoi du cookie depuis un autre site
  sameSite: 'lax',
  path: '/',
});

export const setAuthCookie = (res, token) => {
  res.cookie(AUTH_COOKIE, token, { ...cookieOptions(), maxAge: COOKIE_MAX_AGE_MS });
};

export const clearAuthCookie = (res) => {
  res.clearCookie(AUTH_COOKIE, cookieOptions());
};