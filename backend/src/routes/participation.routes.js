import { Router } from 'express';
import {
  getParticipationOverview,
  getSurveyParticipation,
} from '../controllers/participation.controller.js';
import { requireAuth } from '../middlewares/requireAuth.js';
import { requireRole } from '../middlewares/requireRole.js';
import { asyncHandler } from '../utils/asyncHandler.js';

// Préfixe : /api/participation  (RH seulement, chiffres agrégés)
const router = Router();

router.use(requireAuth, requireRole('HR_ADMIN'));

router.get('/overview', asyncHandler(getParticipationOverview));
router.get('/surveys/:id', asyncHandler(getSurveyParticipation));

export default router;