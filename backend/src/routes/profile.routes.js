import { Router } from 'express';
import { updateProfile } from '../controllers/Users.controller.js';
import requireAuth from '../middleware/requireAuth.js';
import asyncHandler from '../middleware/Asynchandler.js';
 
// Préfixe : /api/profile  (tout utilisateur connecté, RH ou employé)
const router = Router();
 
router.patch('/', requireAuth, asyncHandler(updateProfile));
 
export default router;