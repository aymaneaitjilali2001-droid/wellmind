import { Router } from 'express';

import { getSurveyStats } from '../controllers/stats.controller.js';
import requireAuth from '../middleware/requireAuth.js';
import requireRole from '../middleware/authorizeRoles.js';
import asyncHandler from '../middleware/Asynchandler.js';

const router = Router();

// GET /api/stats/surveys/:id
// Réservé aux administrateurs RH
router.get(
  '/surveys/:id',
  requireAuth,
  requireRole('HR_ADMIN'),
  asyncHandler(getSurveyStats)
);

export default router;