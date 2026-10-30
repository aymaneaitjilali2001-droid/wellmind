import { Router } from 'express';
import {
  createAction,
  createActionFromRecommendation,
  listActions,
  getActionsSummary,
  getAction,
  updateAction,
  changeActionStatus,
  addActionUpdate,
} from '../controllers/Improvementactions.controller.js';
import requireAuth from '../middleware/requireAuth.js';
import requireRole from '../middleware/authorizeRoles.js';
import asyncHandler from '../middleware/Asynchandler.js';

// Préfixe : /api/actions  (RH seulement)
// Les employés voient les actions partagées via GET /api/employee/actions
const router = Router();

router.use(requireAuth, requireRole('HR_ADMIN'));

// Routes fixes avant /:id, sinon "summary" serait lu comme un id
router.get('/summary', asyncHandler(getActionsSummary));
router.post('/from-recommendation', asyncHandler(createActionFromRecommendation));

router.post('/', asyncHandler(createAction));
router.get('/', asyncHandler(listActions));
router.get('/:id', asyncHandler(getAction));
router.patch('/:id', asyncHandler(updateAction));
router.patch('/:id/status', asyncHandler(changeActionStatus));
router.post('/:id/updates', asyncHandler(addActionUpdate));

export default router;