import { Router } from 'express';
import { ExecutionController } from '../controllers/ExecutionController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';

const router = Router();

router.use(authMiddleware);

router.get('/', ExecutionController.listExecutions);
router.get('/:id', ExecutionController.getExecution);
router.post('/:id/retry', ExecutionController.retryExecution);

export default router;
