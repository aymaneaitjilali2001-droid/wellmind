import { Router } from 'express';
import { getOrganization,updateOrganization } from '../controllers/Organization.controller.js';
import { requireAuth } from '../middlewares/requireAuth.js';
import { requireRole } from '../middlewares/requireRole.js';
import { asyncHandler } from '../utils/asyncHandler.js';
 
// Préfixe : /api/organization  (RH seulement)
const router = Router();
 
router.use(requireAuth, requireRole('HR_ADMIN'));
 
router.get('/', asyncHandler(getOrganization));
router.patch('/', asyncHandler(updateOrganization));
 
export default router;