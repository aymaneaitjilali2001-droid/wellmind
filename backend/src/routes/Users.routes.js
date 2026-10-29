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
import { requireAuth } from '../middlewares/requireAuth.js';
import { requireRole } from '../middlewares/requireRole.js';
import { asyncHandler } from '../utils/asyncHandler.js';
 
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