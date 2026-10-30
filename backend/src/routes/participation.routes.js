import { Router } from 'express';
import {
  getParticipationOverview,
  getSurveyParticipation,
} from '../controllers/participation.controller.js';
import requireAuth from '../middleware/requireAuth.js';
import requireRole from '../middleware/authorizeRoles.js';
import asyncHandler from '../middleware/Asynchandler.js';

// Préfixe : /api/participation  (RH seulement, chiffres agrégés)
const router = Router();

router.use(requireAuth, requireRole('HR_ADMIN'));

router.get('/overview', asyncHandler(getParticipationOverview));
router.get('/surveys/:id', asyncHandler(getSurveyParticipation));

export default router;