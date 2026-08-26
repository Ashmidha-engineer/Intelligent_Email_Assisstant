import { Router } from 'express';
import { AnalyticsController } from '../controllers/AnalyticsController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';

const router = Router();

router.use(authMiddleware);
router.get('/', AnalyticsController.getAnalytics);

export default router;
