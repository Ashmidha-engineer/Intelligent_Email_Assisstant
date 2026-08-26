import { Router } from 'express';
import { ActivityController } from '../controllers/ActivityController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';

const router = Router();

router.use(authMiddleware);
router.get('/', ActivityController.listActivity);

export default router;
