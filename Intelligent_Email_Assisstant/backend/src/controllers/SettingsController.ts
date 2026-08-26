import { Request, Response } from 'express';
import prisma from '../config/db.js';
import { logger } from '../utils/logger.js';

export class SettingsController {
  static async getSettings(req: Request, res: Response) {
    try {
      const userId = req.user!.id;
      const settings = await prisma.userSettings.upsert({
        where: { userId },
        update: {},
        create: {
          userId,
          defaultTone: 'Professional',
          aiProvider: 'claude',
          aiModel: 'claude-3-5-sonnet',
          autoClassify: true,
        },
      });

      res.json(settings);
    } catch (err: any) {
      logger.error('Error fetching user settings:', err.message);
      res.status(500).json({ error: 'Failed to fetch settings' });
    }
  }

  static async updateSettings(req: Request, res: Response) {
    try {
      const userId = req.user!.id;
      const { defaultTone, notificationPrefs, aiProvider, aiModel, autoClassify } = req.body;

      const updated = await prisma.userSettings.upsert({
        where: { userId },
        update: {
          ...(defaultTone && { defaultTone }),
          ...(notificationPrefs && { notificationPrefs: typeof notificationPrefs === 'string' ? notificationPrefs : JSON.stringify(notificationPrefs) }),
          ...(aiProvider && { aiProvider }),
          ...(aiModel && { aiModel }),
          ...(autoClassify !== undefined && { autoClassify }),
        },
        create: {
          userId,
          defaultTone: defaultTone || 'Professional',
          notificationPrefs: notificationPrefs ? JSON.stringify(notificationPrefs) : '{"email":true,"inApp":true}',
          aiProvider: aiProvider || 'claude',
          aiModel: aiModel || 'claude-3-5-sonnet',
          autoClassify: autoClassify ?? true,
        },
      });

      res.json(updated);
    } catch (err: any) {
      logger.error('Error updating user settings:', err.message);
      res.status(500).json({ error: 'Failed to update settings' });
    }
  }
}
