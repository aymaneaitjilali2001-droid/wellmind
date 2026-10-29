import { Router } from 'express';
import {
  createSurvey,
  listSurveys,
  getSurvey,
  updateSurvey,
  deleteSurvey,
  publishSurvey,
  closeSurvey,
  duplicateSurvey,
} from '../controllers/surveys.controller.js';
import { requireAuth } from '../middlewares/requireAuth.js';
import { requireRole } from '../middlewares/requireRole.js';
import { asyncHandler } from '../utils/asyncHandler.js';
 
// Préfixe : /api/surveys  (RH seulement)
// La participation d'un sondage est dans /api/participation/surveys/:id
const router = Router();
 
router.use(requireAuth, requireRole('HR_ADMIN'));
 
router.post('/', asyncHandler(createSurvey));
router.get('/', asyncHandler(listSurveys));
router.get('/:id', asyncHandler(getSurvey));
router.patch('/:id', asyncHandler(updateSurvey));
router.delete('/:id', asyncHandler(deleteSurvey));
 
router.post('/:id/publish', asyncHandler(publishSurvey));
router.post('/:id/close', asyncHandler(closeSurvey));
router.post('/:id/duplicate', asyncHandler(duplicateSurvey));
 
export default router;