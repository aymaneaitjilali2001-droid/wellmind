import { Router } from 'express';
import { updateProfile } from '../controllers/Users.controller.js';
import { requireAuth } from '../middlewares/requireAuth.js';
import { asyncHandler } from '../utils/asyncHandler.js';
 
// Préfixe : /api/profile  (tout utilisateur connecté, RH ou employé)
const router = Router();
 
router.patch('/', requireAuth, asyncHandler(updateProfile));
 
export default router;