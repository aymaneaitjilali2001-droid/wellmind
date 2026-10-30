import Organization from '../models/organizations.models.js';
import User, { USER_ROLES } from '../models/User.models.js';
import { HttpError } from '../utils/Httperror.js';
import { runValidation, pick, requireFields, escapeRegex, getPagination } from '../utils/validation.js';
import { validatePassword, hashPassword, comparePassword } from '../utils/Password.js';

// Si l'organisation a une liste de services, le service doit en faire partie
const checkDepartment = async (organizationId, department) => {
  if (!department) return;
  const org = await Organization.findById(organizationId).select('departments').lean();
  const list = org?.departments || [];
  if (list.length && !list.includes(department)) {
    throw new HttpError(400, 'Service inconnu', { allowed: list });
  }
};

// Toujours chercher dans l'organisation du RH connecté (isolation)
const findUserInOrg = async (req) => {
  const user = await User.findOne({ _id: req.params.id, organizationId: req.user.organizationId });
  if (!user) throw new HttpError(404, 'Utilisateur introuvable');
  return user;
};

// POST /api/users  (RH) — crée un compte employé ou RH
export const createUser = async (req, res) => {
  requireFields(req.body, ['firstName', 'lastName', 'email', 'password']);
  const { firstName, lastName, email, password, department } = req.body;
  const role = req.body.role || 'EMPLOYEE';

  if (!USER_ROLES.includes(role)) throw new HttpError(400, 'Rôle invalide', { allowed: USER_ROLES });
  validatePassword(password);
  await checkDepartment(req.user.organizationId, department);

  const user = new User({
    organizationId: req.user.organizationId,
    firstName,
    lastName,
    email: String(email).trim().toLowerCase(),
    passwordHash: await hashPassword(password),
    role,
    department: department || undefined,
  });
  await runValidation(user);
  await user.save(); // e-mail en double → 409 via errorHandler

  res.status(201).json(user);
};

// GET /api/users?role=EMPLOYEE&department=IT&isActive=true&search=sara&page=1&limit=20  (RH)
export const listUsers = async (req, res) => {
  const filter = { organizationId: req.user.organizationId };
  const { role, department, isActive, search } = req.query;

  if (role) filter.role = role;
  if (department) filter.department = department;
  if (isActive === 'true' || isActive === 'false') filter.isActive = isActive === 'true';
  if (search) {
    const re = new RegExp(escapeRegex(search), 'i');
    filter.$or = [{ firstName: re }, { lastName: re }, { email: re }];
  }

  const { page, limit, skip } = getPagination(req.query);
  const [items, total] = await Promise.all([
    User.find(filter).sort({ lastName: 1, firstName: 1 }).skip(skip).limit(limit),
    User.countDocuments(filter),
  ]);

  res.json({ items, total, page, limit });
};

// GET /api/users/:id  (RH)
// Ne renvoie jamais l'historique des réponses de l'employé.
export const getUser = async (req, res) => {
  res.json(await findUserInOrg(req));
};

// PATCH /api/users/:id  (RH)
export const updateUser = async (req, res) => {
  const user = await findUserInOrg(req);
  const updates = pick(req.body, ['firstName', 'lastName', 'email', 'role', 'department']);

  if (updates.role !== undefined && !USER_ROLES.includes(updates.role)) {
    throw new HttpError(400, 'Rôle invalide', { allowed: USER_ROLES });
  }
  // Un RH ne peut pas se retirer lui-même son rôle (il perdrait l'accès)
  if (user._id.toString() === req.user.userId && updates.role && updates.role !== 'HR_ADMIN') {
    throw new HttpError(400, 'Vous ne pouvez pas retirer votre propre rôle RH');
  }
  if (updates.email) updates.email = String(updates.email).trim().toLowerCase();
  if (updates.department) await checkDepartment(req.user.organizationId, updates.department);

  user.set(updates);
  await runValidation(user);
  await user.save();
  res.json(user);
};

// PATCH /api/users/:id/deactivate  (RH)
// On désactive au lieu de supprimer, pour garder l'historique des participations.
export const deactivateUser = async (req, res) => {
  const user = await findUserInOrg(req);
  if (user._id.toString() === req.user.userId) {
    throw new HttpError(400, 'Vous ne pouvez pas désactiver votre propre compte');
  }
  user.isActive = false;
  await user.save();
  res.json(user);
};

// PATCH /api/users/:id/activate  (RH)
export const activateUser = async (req, res) => {
  const user = await findUserInOrg(req);
  user.isActive = true;
  await user.save();
  res.json(user);
};

// PATCH /api/users/:id/password  (RH) — nouveau mot de passe temporaire
export const resetUserPassword = async (req, res) => {
  const user = await findUserInOrg(req);
  validatePassword(req.body.password);
  user.passwordHash = await hashPassword(req.body.password);
  await user.save();
  res.json({ message: 'Mot de passe réinitialisé' });
};

// PATCH /api/profile  (connecté) — chacun modifie son propre profil
export const updateProfile = async (req, res) => {
  const user = await User.findById(req.user.userId).select('+passwordHash');
  if (!user) throw new HttpError(404, 'Utilisateur introuvable');

  user.set(pick(req.body, ['firstName', 'lastName']));

  // Changement de mot de passe : l'ancien est obligatoire
  if (req.body.newPassword) {
    if (!req.body.currentPassword || !(await comparePassword(req.body.currentPassword, user.passwordHash))) {
      throw new HttpError(400, 'Mot de passe actuel incorrect');
    }
    validatePassword(req.body.newPassword);
    user.passwordHash = await hashPassword(req.body.newPassword);
  }

  await runValidation(user);
  await user.save();
  res.json(user);
};