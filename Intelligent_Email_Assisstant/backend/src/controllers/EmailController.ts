import { Request, Response } from 'express';
import { GmailService } from '../services/GmailService.js';
import prisma from '../config/db.js';
import { logger } from '../utils/logger.js';

export class EmailController {
  /**
   * List emails with filtering and pagination
   */
  static async listEmails(req: Request, res: Response) {
    try {
      const userId = req.user!.id;
      const folder = (req.query.folder as string) || 'INBOX';
      const query = (req.query.q as string) || (req.query.query as string) || '';
      const limit = parseInt(req.query.limit as string, 10) || 30;

      const result = await GmailService.listEmails(userId, {
        folder,
        query,
        limit,
      });

      res.json(result);
    } catch (err: any) {
      logger.error('Error listing emails:', err.message);
      res.status(500).json({ error: 'Failed to fetch emails' });
    }
  }

  /**
   * Get single thread or email details
   */
  static async getThread(req: Request, res: Response) {
    try {
      const userId = req.user!.id;
      const threadId = req.params.id;

      const messages = await GmailService.getThread(userId, threadId);

      // Also fetch any existing AI drafts or executions for this thread
      const drafts = await prisma.aIDraft.findMany({
        where: { userId, threadId },
        orderBy: { createdAt: 'desc' },
      });

      const recentExecutions = await prisma.execution.findMany({
        where: {
          userId,
          inputRef: { contains: threadId },
        },
        orderBy: { createdAt: 'desc' },
        take: 5,
      });

      res.json({
        threadId,
        messages,
        drafts,
        executions: recentExecutions.map((ex) => ({
          ...ex,
          output: ex.outputRef ? JSON.parse(ex.outputRef) : null,
        })),
      });
    } catch (err: any) {
      logger.error(`Error getting thread ${req.params.id}:`, err.message);
      res.status(500).json({ error: 'Failed to fetch thread' });
    }
  }

  /**
   * Search emails
   */
  static async searchEmails(req: Request, res: Response) {
    try {
      const userId = req.user!.id;
      const query = req.query.q as string || '';

      const result = await GmailService.listEmails(userId, {
        query,
        limit: 40,
      });

      res.json(result);
    } catch (err: any) {
      logger.error('Error searching emails:', err.message);
      res.status(500).json({ error: 'Failed to search emails' });
    }
  }

  /**
   * Mark as Read / Unread
   */
  static async markRead(req: Request, res: Response) {
    try {
      const userId = req.user!.id;
      const emailId = req.params.id;
      const { isRead = true } = req.body;

      const updated = await GmailService.toggleRead(userId, emailId, isRead);
      res.json({ success: true, email: updated });
    } catch (err: any) {
      logger.error('Error updating read status:', err.message);
      res.status(500).json({ error: 'Failed to update read status' });
    }
  }

  /**
   * Star / Unstar
   */
  static async markStar(req: Request, res: Response) {
    try {
      const userId = req.user!.id;
      const emailId = req.params.id;
      const { isStarred = true } = req.body;

      const updated = await GmailService.toggleStar(userId, emailId, isStarred);
      res.json({ success: true, email: updated });
    } catch (err: any) {
      logger.error('Error updating star status:', err.message);
      res.status(500).json({ error: 'Failed to update star status' });
    }
  }

  /**
   * Archive email
   */
  static async archiveEmail(req: Request, res: Response) {
    try {
      const userId = req.user!.id;
      const emailId = req.params.id;

      const updated = await GmailService.archiveEmail(userId, emailId);
      
      await prisma.activityLog.create({
        data: {
          userId,
          action: 'ARCHIVE_EMAIL',
          targetId: emailId,
        },
      });

      res.json({ success: true, email: updated });
    } catch (err: any) {
      logger.error('Error archiving email:', err.message);
      res.status(500).json({ error: 'Failed to archive email' });
    }
  }

  /**
   * Delete email
   */
  static async deleteEmail(req: Request, res: Response) {
    try {
      const userId = req.user!.id;
      const emailId = req.params.id;

      const updated = await GmailService.deleteEmail(userId, emailId);

      await prisma.activityLog.create({
        data: {
          userId,
          action: 'DELETE_EMAIL',
          targetId: emailId,
        },
      });

      res.json({ success: true, email: updated });
    } catch (err: any) {
      logger.error('Error deleting email:', err.message);
      res.status(500).json({ error: 'Failed to delete email' });
    }
  }

  /**
   * Send new email or reply
   */
  static async sendEmail(req: Request, res: Response) {
    try {
      const userId = req.user!.id;
      const { to, subject, body, threadId, cc, bcc } = req.body;

      if (!to || !subject || !body) {
        res.status(400).json({ error: 'Missing required fields: to, subject, body' });
        return;
      }

      const result = await GmailService.sendEmail(userId, {
        to,
        subject,
        body,
        threadId,
        cc,
        bcc,
      });

      await prisma.activityLog.create({
        data: {
          userId,
          action: 'SEND_EMAIL',
          targetId: result.messageId,
          metadata: JSON.stringify({ to, subject, threadId }),
        },
      });

      res.json({ success: true, ...result });
    } catch (err: any) {
      logger.error('Error sending email:', err.message);
      res.status(500).json({ error: 'Failed to send email' });
    }
  }
}
