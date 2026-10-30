import { Router } from 'express';
import {
  requestAnalysis,
  listAnalyses,
  getLatestAnalysis,
  getAnalysis,
  reviewRecommendation,
} from '../controllers/Aianalyses.controller.js';
import requireAuth from '../middleware/requireAuth.js';
import requireRole from '../middleware/authorizeRoles.js';
import asyncHandler from '../middleware/Asynchandler.js';
 
// Préfixe : /api/analyses  (RH seulement)
const router = Router();
 
router.use(requireAuth, requireRole('HR_ADMIN'));
 
router.post('/', asyncHandler(requestAnalysis));
router.get('/', asyncHandler(listAnalyses));
router.get('/latest', asyncHandler(getLatestAnalysis)); // avant /:id
router.get('/:id', asyncHandler(getAnalysis));
router.patch('/:id/recommendations/:recId', asyncHandler(reviewRecommendation));
 
export default router;