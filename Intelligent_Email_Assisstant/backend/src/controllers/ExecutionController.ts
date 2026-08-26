import { Request, Response } from 'express';
import prisma from '../config/db.js';
import queueService from '../services/QueueService.js';
import { logger } from '../utils/logger.js';

export class ExecutionController {
  /**
   * Get single execution status and result
   */
  static async getExecution(req: Request, res: Response) {
    try {
      const userId = req.user!.id;
      const executionId = req.params.id;

      const execution = await prisma.execution.findFirst({
        where: { id: executionId, userId },
      });

      if (!execution) {
        res.status(404).json({ error: 'Execution not found' });
        return;
      }

      res.json({
        id: execution.id,
        workflowType: execution.workflowType,
        status: execution.status,
        input: execution.inputRef ? JSON.parse(execution.inputRef) : null,
        output: execution.outputRef ? JSON.parse(execution.outputRef) : null,
        error: execution.error,
        durationMs: execution.durationMs,
        startedAt: execution.startedAt,
        completedAt: execution.completedAt,
        createdAt: execution.createdAt,
      });
    } catch (err: any) {
      logger.error('Error fetching execution:', err.message);
      res.status(500).json({ error: 'Failed to fetch execution details' });
    }
  }

  /**
   * List executions history
   */
  static async listExecutions(req: Request, res: Response) {
    try {
      const userId = req.user!.id;
      const limit = parseInt(req.query.limit as string, 10) || 50;

      const executions = await prisma.execution.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: limit,
      });

      res.json({
        executions: executions.map((ex) => ({
          id: ex.id,
          workflowType: ex.workflowType,
          status: ex.status,
          input: ex.inputRef ? JSON.parse(ex.inputRef) : null,
          output: ex.outputRef ? JSON.parse(ex.outputRef) : null,
          error: ex.error,
          durationMs: ex.durationMs,
          createdAt: ex.createdAt,
        })),
        total: executions.length,
      });
    } catch (err: any) {
      logger.error('Error listing executions:', err.message);
      res.status(500).json({ error: 'Failed to list executions' });
    }
  }

  /**
   * Retry failed execution
   */
  static async retryExecution(req: Request, res: Response) {
    try {
      const userId = req.user!.id;
      const executionId = req.params.id;

      const newJob = await queueService.retryExecution(userId, executionId);
      res.status(202).json(newJob);
    } catch (err: any) {
      logger.error('Error retrying execution:', err.message);
      res.status(500).json({ error: err.message || 'Failed to retry execution' });
    }
  }
}
