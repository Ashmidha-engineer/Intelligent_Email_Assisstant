import { Router } from 'express';
import { EmailController } from '../controllers/EmailController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';

const router = Router();

router.use(authMiddleware);

router.get('/', EmailController.listEmails);
router.get('/search', EmailController.searchEmails);
router.get('/:id', EmailController.getThread);
router.patch('/:id/read', EmailController.markRead);
router.patch('/:id/star', EmailController.markStar);
router.patch('/:id/archive', EmailController.archiveEmail);
router.delete('/:id', EmailController.deleteEmail);
router.post('/send', EmailController.sendEmail);

export default router;
