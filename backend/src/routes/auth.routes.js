
import { Router } from 'express';

import {
    registerOrganization,
    login,
    me,
    logout
} from '../controllers/auth.controller.js';

import requireAuth from '../middleware/requireAuth.js';
import asyncHandler from '../middlewares/asyncHandler.js';

const router = Router();

// Routes publiques
router.post(
    '/register-organization',
    asyncHandler(registerOrganization)
);

router.post(
    '/login',
    asyncHandler(login)
);

// Routes privées : utilisateur connecté
router.get(
    '/me',
    requireAuth,
    asyncHandler(me)
);

router.post(
    '/logout',  
    asyncHandler(logout)
);

export default router;
