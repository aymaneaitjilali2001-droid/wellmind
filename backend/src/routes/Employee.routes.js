import { Router } from 'express';
import {
  listMySurveys,
  getSurveyForEmployee,
  submitSurvey,
} from '../controllers/Employeesurveys.controller.js';
import { getMyParticipations } from '../controllers/participation.controller.js';
import { listEmployeeActions } from '../controllers/Improvementactions.controller.js';
import requireAuth from '../middleware/requireAuth.js';
import requireRole from '../middleware/authorizeRoles.js';
import asyncHandler from '../middleware/Asynchandler.js';

// Préfixe : /api/employee  (employés seulement)
// La gestion des sondages côté RH est dans /api/surveys
const router = Router();

router.use(requireAuth, requireRole('EMPLOYEE'));

router.get('/surveys', asyncHandler(listMySurveys));
router.get('/surveys/:id', asyncHandler(getSurveyForEmployee));
router.post('/surveys/:id/submit', asyncHandler(submitSurvey));

router.get('/participations', asyncHandler(getMyParticipations));
router.get('/actions', asyncHandler(listEmployeeActions));

export default router;
