import { api } from '@/lib/Api';
import type { Organization } from '@/types/Auth';

// Champs modifiables par PATCH /api/organization (organization.controller.js)
export interface UpdateOrganizationInput {
  name?: string;
  industry?: string;
  size?: number | null; // null = effacer la taille
  minResponseThreshold?: number;
  departments?: string[];
}

export const updateOrganization = (input: UpdateOrganizationInput) =>
  api.patch<Organization>('/organization', input).then((res) => res.data);