import type { Role } from './Auth';

// Un employé tel que renvoyé par GET /api/users (passwordHash retiré par le backend)
export interface Employee {
  _id: string;
  organizationId: string;
  firstName: string;
  lastName: string;
  email: string;
  role: Role;
  department?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// Réponse paginée de GET /api/users
export interface EmployeesPage {
  items: Employee[];
  total: number;
  page: number;
  limit: number;
}

// Filtres de la liste (une valeur vide = pas de filtre)
export interface EmployeeFilters {
  search?: string;
  role?: Role | '';
  department?: string;
  isActive?: 'true' | 'false' | '';
  page?: number;
  limit?: number;
}

// Données envoyées à POST /api/users
export interface CreateEmployeeInput {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  role: Role;
  department?: string;
}

// Données envoyées à PATCH /api/users/:id (le mot de passe a sa propre route)
export type UpdateEmployeeInput = Partial<Omit<CreateEmployeeInput, 'password'>>;