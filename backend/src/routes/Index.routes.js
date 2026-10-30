import { Router } from 'express';
import authRoutes from './auth.routes.js';
import organizationRoutes from './Organization.routes.js';
import usersRoutes from './Users.routes.js';
import profileRoutes from './profile.routes.js';
import surveysRoutes from './surveys.routes.js';
import employeeRoutes from './employee.routes.js';
import statsRoutes from './Stats.routes.js';
import participationRoutes from './participation.routes.js';
import analysesRoutes from './Analyses.routes.js';
import actionsRoutes from './Actions.routes.js';
 
// Regroupe toutes les routes sous /api
const router = Router();
 
router.get('/health', (_req, res) => res.json({ status: 'ok' }));
 
router.use('/auth', authRoutes);
router.use('/organization', organizationRoutes);
router.use('/users', usersRoutes);
router.use('/profile', profileRoutes);
router.use('/stats', statsRoutes);
router.use('/surveys', surveysRoutes);
router.use('/employee', employeeRoutes);
router.use('/participation', participationRoutes);
router.use('/analyses', analysesRoutes);
router.use('/actions', actionsRoutes);
 
export default router;