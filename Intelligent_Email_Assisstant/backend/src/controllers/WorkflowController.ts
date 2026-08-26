import { Request, Response } from 'express';
import { OrchestrationService } from '../services/OrchestrationService.js';
import { logger } from '../utils/logger.js';

export class WorkflowController {
  /**
   * Trigger Email Thread Summarization
   */
  static async summarize(req: Request, res: Response) {
    try {
      const userId = req.user!.id;
      const { threadId, format } = req.body;

      if (!threadId) {
        res.status(400).json({ error: 'threadId is required' });
        return;
      }

      const job = await OrchestrationService.triggerSummarize(userId, threadId, format);
      res.status(202).json(job);
    } catch (err: any) {
      logger.error('Error triggering summarize workflow:', err.message);
      res.status(500).json({ error: err.message || 'Failed to start summarization' });
    }
  }

  /**
   * Trigger AI Smart Reply Generation
   */
  static async generateReply(req: Request, res: Response) {
    try {
      const userId = req.user!.id;
      const { threadId, tone, instructions } = req.body;

      if (!threadId) {
        res.status(400).json({ error: 'threadId is required' });
        return;
      }

      const job = await OrchestrationService.triggerGenerateReply(userId, threadId, tone, instructions);
      res.status(202).json(job);
    } catch (err: any) {
      logger.error('Error triggering generate reply workflow:', err.message);
      res.status(500).json({ error: err.message || 'Failed to start reply generation' });
    }
  }

  /**
   * Trigger AI Plain-English Email Explanation
   */
  static async explain(req: Request, res: Response) {
    try {
      const userId = req.user!.id;
      const { threadId } = req.body;

      if (!threadId) {
        res.status(400).json({ error: 'threadId is required' });
        return;
      }

      const job = await OrchestrationService.triggerExplain(userId, threadId);
      res.status(202).json(job);
    } catch (err: any) {
      logger.error('Error triggering explain workflow:', err.message);
      res.status(500).json({ error: err.message || 'Failed to start explanation' });
    }
  }

  /**
   * Trigger AI Email Classification & Priority Detection
   */
  static async classify(req: Request, res: Response) {
    try {
      const userId = req.user!.id;
      const { emailId } = req.body;

      if (!emailId) {
        res.status(400).json({ error: 'emailId is required' });
        return;
      }

      const job = await OrchestrationService.triggerClassify(userId, emailId);
      res.status(202).json(job);
    } catch (err: any) {
      logger.error('Error triggering classify workflow:', err.message);
      res.status(500).json({ error: err.message || 'Failed to start classification' });
    }
  }

  /**
   * Trigger Action Items Extraction
   */
  static async extractActions(req: Request, res: Response) {
    try {
      const userId = req.user!.id;
      const { threadId } = req.body;

      if (!threadId) {
        res.status(400).json({ error: 'threadId is required' });
        return;
      }

      const job = await OrchestrationService.triggerExtractActions(userId, threadId);
      res.status(202).json(job);
    } catch (err: any) {
      logger.error('Error triggering extract actions workflow:', err.message);
      res.status(500).json({ error: err.message || 'Failed to start action items extraction' });
    }
  }

  /**
   * Trigger Compound Orchestration (Summarize + Draft + Actions)
   */
  static async compound(req: Request, res: Response) {
    try {
      const userId = req.user!.id;
      const { threadId, tone, instructions } = req.body;

      if (!threadId) {
        res.status(400).json({ error: 'threadId is required' });
        return;
      }

      const job = await OrchestrationService.triggerCompound(userId, threadId, tone, instructions);
      res.status(202).json(job);
    } catch (err: any) {
      logger.error('Error triggering compound workflow:', err.message);
      res.status(500).json({ error: err.message || 'Failed to start compound workflow' });
    }
  }
}
