// Types partagés pour l'authentification (correspondent aux réponses du backend)

export type Role = 'HR_ADMIN' | 'EMPLOYEE';

export interface User {
  _id: string;
  organizationId: string;
  firstName: string;
  lastName: string;
  email: string;
  role: Role;
  isActive: boolean;
}

export interface Organization {
  _id: string;
  name: string;
  slug: string;
  industry?: string;
  size?: number;
  minResponseThreshold: number;
  departments: string[];
  isActive: boolean;
}

// Réponse de /auth/login, /auth/register-organization et /auth/me
export interface AuthResponse {
  message?: string;
  user: User | null;
  organization: Organization | null;
}

export interface RegisterInput {
  organizationName: string;
  industry?: string;
  size?: number;
  firstName: string;
  lastName: string;
  email: string;
  password: string;
}