import { Router } from 'express';
import { AuthController } from '../controllers/AuthController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';

const router = Router();

router.get('/google', AuthController.getGoogleAuthUrl);
router.get('/google/callback', AuthController.handleGoogleCallback);
router.post('/email-login', AuthController.emailLogin);
router.post('/demo-login', AuthController.demoLogin);
router.post('/logout', AuthController.logout);
router.get('/session', authMiddleware, AuthController.getSession);

export default router;
