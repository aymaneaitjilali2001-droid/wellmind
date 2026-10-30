import { Router } from 'express';
import { getOrganization,updateOrganization } from '../controllers/organization.controller.js';
import requireAuth from '../middleware/requireAuth.js';
import requireRole from '../middleware/authorizeRoles.js';
import asyncHandler from '../middleware/Asynchandler.js';
 
// Préfixe : /api/organization  (RH seulement)
const router = Router();
 
router.use(requireAuth, requireRole('HR_ADMIN'));
 
router.get('/', asyncHandler(getOrganization));
router.patch('/', asyncHandler(updateOrganization));
 
export default router;