import { Router } from 'express';
import { WorkflowController } from '../controllers/WorkflowController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { aiRateLimiter } from '../middleware/rateLimitMiddleware.js';

const router = Router();

router.use(authMiddleware);
router.use(aiRateLimiter);

router.post('/summarize', WorkflowController.summarize);
router.post('/generate-reply', WorkflowController.generateReply);
router.post('/explain', WorkflowController.explain);
router.post('/classify', WorkflowController.classify);
router.post('/extract-actions', WorkflowController.extractActions);
router.post('/compound', WorkflowController.compound);

export default router;
