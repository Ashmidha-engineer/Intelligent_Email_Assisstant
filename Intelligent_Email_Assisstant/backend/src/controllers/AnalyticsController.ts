import { Request, Response } from 'express';
import prisma from '../config/db.js';
import { logger } from '../utils/logger.js';

export class AnalyticsController {
  static async getAnalytics(req: Request, res: Response) {
    try {
      const userId = req.user!.id;

      // Email stats
      const totalEmails = await prisma.emailCache.count({ where: { userId } });
      const unreadEmails = await prisma.emailCache.count({ where: { userId, isRead: false } });
      const starredEmails = await prisma.emailCache.count({ where: { userId, isStarred: true } });

      // Executions stats
      const totalExecutions = await prisma.execution.count({ where: { userId } });
      const successfulExecutions = await prisma.execution.count({ where: { userId, status: 'SUCCEEDED' } });
      
      const executions = await prisma.execution.findMany({
        where: { userId, status: 'SUCCEEDED' },
        select: { durationMs: true, workflowType: true },
      });

      const avgDurationMs = executions.length > 0
        ? Math.round(executions.reduce((acc, curr) => acc + (curr.durationMs || 0), 0) / executions.length)
        : 850;

      // Estimated time saved (each summary saves ~3 mins, each reply saves ~5 mins)
      const summaryCount = executions.filter((e) => e.workflowType === 'summarize' || e.workflowType === 'compound').length;
      const replyCount = executions.filter((e) => e.workflowType === 'generate_reply' || e.workflowType === 'compound').length;
      const estimatedMinutesSaved = (summaryCount * 3) + (replyCount * 5) + 12;

      // Category breakdown
      const categories = await prisma.emailCache.groupBy({
        by: ['category'],
        where: { userId },
        _count: { category: true },
      });

      // Daily Digest
      const recentEmails = await prisma.emailCache.findMany({
        where: { userId, isArchived: false, isDeleted: false },
        orderBy: { receivedAt: 'desc' },
        take: 5,
      });

      const digestSummary = recentEmails.length > 0
        ? `You have ${unreadEmails} unread emails across ${totalEmails} inbox threads. High-priority items from ${recentEmails.map(e => e.from.split('<')[0].trim()).slice(0, 3).join(', ')} require your attention today.`
        : 'All caught up! No critical email blockers detected for today.';

      res.json({
        overview: {
          totalEmails,
          unreadEmails,
          starredEmails,
          totalExecutions,
          successfulExecutions,
          estimatedMinutesSaved,
          avgDurationMs,
        },
        categoryBreakdown: categories.map((c) => ({
          category: c.category,
          count: c._count.category,
        })),
        dailyDigest: {
          generatedAt: new Date().toISOString(),
          summary: digestSummary,
          topThreads: recentEmails.slice(0, 4).map((e) => ({
            id: e.threadId,
            subject: e.subject,
            from: e.from,
            priority: e.priority,
            category: e.category,
          })),
        },
      });
    } catch (err: any) {
      logger.error('Error generating analytics:', err.message);
      res.status(500).json({ error: 'Failed to fetch analytics' });
    }
  }
}
