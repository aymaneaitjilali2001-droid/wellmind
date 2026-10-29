import { Router } from 'express';
import authRoutes from './auth.routes.js';
import organizationRoutes from './Organization.routes.js';
import usersRoutes from './Users.routes.js';
import profileRoutes from './profile.routes.js';
import surveysRoutes from './surveys.routes.js';
import employeeRoutes from './employee.routes.js';
import participationRoutes from './participation.routes.js';
 
// Regroupe toutes les routes sous /api
const router = Router();
 
router.get('/health', (_req, res) => res.json({ status: 'ok' }));
 
router.use('/auth', authRoutes);
router.use('/organization', organizationRoutes);
router.use('/users', usersRoutes);
router.use('/profile', profileRoutes);
router.use('/surveys', surveysRoutes);
router.use('/employee', employeeRoutes);
router.use('/participation', participationRoutes);
 
// Personne B ajoutera ici :
// router.use('/stats', statsRoutes);
// router.use('/analyses', analysesRoutes);
// router.use('/actions', actionsRoutes);
 
export default router;