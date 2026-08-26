import { Router } from 'express';
import authRoutes from './authRoutes.js';
import emailRoutes from './emailRoutes.js';
import workflowRoutes from './workflowRoutes.js';
import executionRoutes from './executionRoutes.js';
import activityRoutes from './activityRoutes.js';
import analyticsRoutes from './analyticsRoutes.js';
import settingsRoutes from './settingsRoutes.js';
import integrationRoutes from './integrationRoutes.js';

const apiRouter = Router();

apiRouter.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'Intelligent Email Assistant API',
    version: '1.0.0',
  });
});

apiRouter.use('/auth', authRoutes);
apiRouter.use('/emails', emailRoutes);
apiRouter.use('/workflows', workflowRoutes);
apiRouter.use('/executions', executionRoutes);
apiRouter.use('/activity', activityRoutes);
apiRouter.use('/analytics', analyticsRoutes);
apiRouter.use('/settings', settingsRoutes);
apiRouter.use('/integrations', integrationRoutes);

export default apiRouter;
