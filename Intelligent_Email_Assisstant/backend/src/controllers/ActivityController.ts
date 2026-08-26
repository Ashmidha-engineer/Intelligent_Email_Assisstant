import { Request, Response } from 'express';
import prisma from '../config/db.js';
import { logger } from '../utils/logger.js';

export class ActivityController {
  static async listActivity(req: Request, res: Response) {
    try {
      const userId = req.user!.id;
      const limit = parseInt(req.query.limit as string, 10) || 50;

      const logs = await prisma.activityLog.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: limit,
      });

      res.json({
        activities: logs.map((log) => ({
          id: log.id,
          action: log.action,
          targetId: log.targetId,
          metadata: log.metadata ? JSON.parse(log.metadata) : null,
          createdAt: log.createdAt,
        })),
        total: logs.length,
      });
    } catch (err: any) {
      logger.error('Error listing activity logs:', err.message);
      res.status(500).json({ error: 'Failed to fetch activity logs' });
    }
  }
}
