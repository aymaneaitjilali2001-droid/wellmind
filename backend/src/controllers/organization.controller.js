import Organization from '../models/organizations.models.js';
import { HttpError } from '../utils/Httperror.js';
import { runValidation, pick } from '../utils/validation.js';

// Nettoie la liste des services : sans espaces inutiles, sans doublons, sans vides
const normalizeDepartments = (list) => {
  if (!Array.isArray(list)) throw new HttpError(400, 'departments doit être une liste');
  const seen = new Set();
  const out = [];
  for (const raw of list) {
    const name = String(raw || '').trim();
    const key = name.toLowerCase();
    if (name && !seen.has(key)) {
      seen.add(key);
      out.push(name);
    }
  }
  return out;
};

// GET /api/organization  (RH)
export const getOrganization = async (req, res) => {
  const organization = await Organization.findById(req.user.organizationId);
  if (!organization) throw new HttpError(404, 'Organisation introuvable');
  res.json(organization);
};

// PATCH /api/organization  (RH)
export const updateOrganization = async (req, res) => {
  const organization = await Organization.findById(req.user.organizationId);
  if (!organization) throw new HttpError(404, 'Organisation introuvable');

  const updates = pick(req.body, ['name', 'industry', 'size', 'minResponseThreshold', 'departments']);
  if (updates.departments !== undefined) {
    updates.departments = normalizeDepartments(updates.departments);
  }

  organization.set(updates);
  await runValidation(organization);
  await organization.save();

  res.json(organization);
};