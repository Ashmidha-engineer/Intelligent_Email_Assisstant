import { Router } from 'express';
import { IntegrationController } from '../controllers/IntegrationController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';

const router = Router();

router.use(authMiddleware);
router.get('/', IntegrationController.getStatus);
router.post('/disconnect', IntegrationController.disconnect);

export default router;
