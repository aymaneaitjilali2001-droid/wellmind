import { Router } from 'express';

import { getSurveyStats,getStatsOverview } from '../controllers/stats.controller.js';
import requireAuth from '../middleware/requireAuth.js';
import requireRole from '../middleware/authorizeRoles.js';
import asyncHandler from '../middleware/Asynchandler.js';

const router = Router();

// GET /api/stats/surveys/:id
// Réservé aux administrateurs RH
router.use(requireAuth, requireRole('HR_ADMIN'));

router.get('/overview', asyncHandler(getStatsOverview));
router.get('/surveys/:id', asyncHandler(getSurveyStats));

export default router;