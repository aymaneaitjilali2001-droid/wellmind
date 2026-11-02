import { api } from '@/lib/Api';
import type { CreateEmployeeInput, Employee, UpdateEmployeeInput } from '@/types/user';

// Chaque fonction correspond à une route de users.routes.js (réservées aux RH)

export const createEmployee = (input: CreateEmployeeInput) =>
  api.post<Employee>('/users', input).then((res) => res.data);

export const updateEmployee = (id: string, input: UpdateEmployeeInput) =>
  api.patch<Employee>(`/users/${id}`, input).then((res) => res.data);

export const deactivateEmployee = (id: string) =>
  api.patch<Employee>(`/users/${id}/deactivate`).then((res) => res.data);

export const activateEmployee = (id: string) =>
  api.patch<Employee>(`/users/${id}/activate`).then((res) => res.data);

export const resetEmployeePassword = (id: string, password: string) =>
  api.patch<{ message: string }>(`/users/${id}/password`, { password }).then((res) => res.data);