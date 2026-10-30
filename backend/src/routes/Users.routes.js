import { Router } from 'express';
import {
  createUser,
  listUsers,
  getUser,
  updateUser,
  deactivateUser,
  activateUser,
  resetUserPassword,
} from '../controllers/Users.controller.js';
import requireAuth from '../middleware/requireAuth.js';
import requireRole from '../middleware/authorizeRoles.js';
import asyncHandler from '../middleware/Asynchandler.js';
 
// Préfixe : /api/users  (RH seulement)
const router = Router();
 
router.use(requireAuth, requireRole('HR_ADMIN'));
 
router.post('/', asyncHandler(createUser));
router.get('/', asyncHandler(listUsers));
router.get('/:id', asyncHandler(getUser));
router.patch('/:id', asyncHandler(updateUser));
router.patch('/:id/deactivate', asyncHandler(deactivateUser));
router.patch('/:id/activate', asyncHandler(activateUser));
router.patch('/:id/password', asyncHandler(resetUserPassword));
 
export default router;