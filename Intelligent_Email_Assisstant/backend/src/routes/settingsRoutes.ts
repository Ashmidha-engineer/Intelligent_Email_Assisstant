import { Router } from 'express';
import { SettingsController } from '../controllers/SettingsController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';

const router = Router();

router.use(authMiddleware);
router.get('/', SettingsController.getSettings);
router.patch('/', SettingsController.updateSettings);

export default router;
