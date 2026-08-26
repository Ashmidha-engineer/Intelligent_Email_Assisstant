import { Request, Response } from 'express';
import prisma from '../config/db.js';
import { TokenService } from '../services/TokenService.js';
import { ENV } from '../config/env.js';
import { logger } from '../utils/logger.js';

export class IntegrationController {
  static async getStatus(req: Request, res: Response) {
    try {
      const userId = req.user!.id;
      const tokens = await prisma.oAuthToken.findMany({
        where: { userId },
        select: { provider: true, expiresAt: true, createdAt: true },
      });

      const isDemo = req.user!.email.includes('demo');

      res.json({
        integrations: [
          {
            id: 'google-gmail',
            name: 'Google Gmail',
            type: 'email',
            connected: isDemo || tokens.some((t) => t.provider === 'google'),
            scopes: ['gmail.readonly', 'gmail.send', 'gmail.modify'],
            expiresAt: tokens.find((t) => t.provider === 'google')?.expiresAt || null,
          },
          {
            id: 'microsoft-outlook',
            name: 'Microsoft Outlook (Beta)',
            type: 'email',
            connected: tokens.some((t) => t.provider === 'outlook'),
            scopes: ['Mail.ReadWrite', 'Mail.Send'],
            expiresAt: null,
          },
          {
            id: 'anthropic-claude',
            name: 'Anthropic Claude AI',
            type: 'ai',
            connected: !!ENV.ANTHROPIC_API_KEY,
            model: 'Claude 3.5 Sonnet',
          },
          {
            id: 'openai-gpt4',
            name: 'OpenAI GPT-4o',
            type: 'ai',
            connected: !!ENV.OPENAI_API_KEY,
            model: 'GPT-4o Mini',
          },
        ],
      });
    } catch (err: any) {
      logger.error('Error fetching integrations status:', err.message);
      res.status(500).json({ error: 'Failed to fetch integrations' });
    }
  }

  static async disconnect(req: Request, res: Response) {
    try {
      const userId = req.user!.id;
      const { provider = 'google' } = req.body;

      await TokenService.removeTokens(userId, provider);

      await prisma.activityLog.create({
        data: {
          userId,
          action: `DISCONNECT_${provider.toUpperCase()}`,
        },
      });

      res.json({ success: true, message: `Disconnected ${provider}` });
    } catch (err: any) {
      logger.error('Error disconnecting integration:', err.message);
      res.status(500).json({ error: 'Failed to disconnect integration' });
    }
  }
}
