import type { Role } from '../types/Auth';
 
// Page d'accueil de chaque rôle après la connexion
export const homeForRole = (role: Role): string => (role === 'HR_ADMIN' ? '/hr' : '/employee');