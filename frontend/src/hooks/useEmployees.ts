import { useApi } from '@/lib/Swr';
import type { Organization } from '@/types/Auth';
import type { Employee, EmployeeFilters, EmployeesPage } from '@/types/user';

// Construit la clé SWR à partir des filtres, ex : /users?search=sara&role=EMPLOYEE&page=2
// Les filtres vides ne sont pas ajoutés à l'URL.
export const employeesKey = (filters: EmployeeFilters = {}) => {
  const params = new URLSearchParams();
  for (const [name, value] of Object.entries(filters)) {
    if (value !== undefined && value !== '') params.set(name, String(value));
  }
  const query = params.toString();
  return query ? `/users?${query}` : '/users';
};

// Toutes les listes d'employés en cache (pour les recharger après une modification)
export const isEmployeesKey = (key: unknown) => typeof key === 'string' && key.startsWith('/users');

// Liste paginée. keepPreviousData : l'ancienne liste reste affichée pendant une nouvelle recherche.
export function useEmployees(filters: EmployeeFilters) {
  return useApi<EmployeesPage>(employeesKey(filters), { keepPreviousData: true });
}

// Un employé. id null = ne rien charger (ex : id pas encore disponible)
export function useEmployee(id: string | null) {
  return useApi<Employee>(id ? `/users/${id}` : null);
}

// L'organisation, pour la liste des services (départements)
export function useOrganization() {
  return useApi<Organization>('/organization');
}