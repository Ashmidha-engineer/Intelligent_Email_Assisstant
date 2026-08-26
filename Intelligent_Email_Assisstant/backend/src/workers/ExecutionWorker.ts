import prisma from '../config/db.js';
import { AIService } from '../services/AIService.js';
import { emitToUser } from '../websocket/socketManager.js';
import { logger } from '../utils/logger.js';

export interface ExecutionJobData {
  executionId: string;
  userId: string;
  workflowType: 'summarize' | 'generate_reply' | 'explain' | 'classify' | 'extract_actions' | 'compound';
  params: any;
}

export class ExecutionWorker {
  /**
   * Process a single AI execution task
   */
  static async processJob(jobData: ExecutionJobData): Promise<any> {
    const { executionId, userId, workflowType, params } = jobData;
    const startTime = Date.now();

    logger.info(`Starting execution job ${executionId} (${workflowType}) for user ${userId}`);

    // Update execution status to RUNNING
    await prisma.execution.update({
      where: { id: executionId },
      data: {
        status: 'RUNNING',
        startedAt: new Date(),
      },
    });

    emitToUser(userId, 'execution:status', {
      executionId,
      status: 'RUNNING',
      workflowType,
    });

    try {
      let result: any = null;

      switch (workflowType) {
        case 'summarize': {
          result = await AIService.summarize(params);
          break;
        }
        case 'generate_reply': {
          result = await AIService.generateReply(params);
          // If draft was generated, store in ai_drafts table
          if (result && result.draft && params.threadId) {
            await prisma.aIDraft.create({
              data: {
                userId,
                threadId: params.threadId,
                tone: params.tone || 'Professional',
                content: result.draft,
                instructions: params.instructions || null,
                createdFromExecutionId: executionId,
              },
            });
          }
          break;
        }
        case 'explain': {
          result = await AIService.explain(params);
          break;
        }
        case 'classify': {
          result = await AIService.classify(params);
          // Optionally update email cache category/priority
          if (params.emailId && result) {
            await prisma.emailCache.updateMany({
              where: {
                userId,
                OR: [{ id: params.emailId }, { gmailMessageId: params.emailId }],
              },
              data: {
                category: result.category,
                priority: result.priority,
              },
            });
          }
          break;
        }
        case 'extract_actions': {
          result = await AIService.extractActions(params);
          break;
        }
        case 'compound': {
          // Multi-step compound orchestration: Summarize + Generate Reply
          const summary = await AIService.summarize(params);
          const reply = await AIService.generateReply({
            ...params,
            threadText: `Summary of thread: ${summary.summary}\n\nOriginal thread: ${params.threadText}`,
          });
          const actions = await AIService.extractActions(params);

          result = {
            summary,
            reply,
            actions,
          };

          if (reply && reply.draft && params.threadId) {
            await prisma.aIDraft.create({
              data: {
                userId,
                threadId: params.threadId,
                tone: params.tone || 'Professional',
                content: reply.draft,
                instructions: params.instructions || null,
                createdFromExecutionId: executionId,
              },
            });
          }
          break;
        }
        default:
          throw new Error(`Unsupported workflow type: ${workflowType}`);
      }

      const durationMs = Date.now() - startTime;

      // Update execution record to SUCCEEDED
      const updatedExecution = await prisma.execution.update({
        where: { id: executionId },
        data: {
          status: 'SUCCEEDED',
          outputRef: JSON.stringify(result),
          durationMs,
          completedAt: new Date(),
        },
      });

      // Log in activity table
      await prisma.activityLog.create({
        data: {
          userId,
          action: `WORKFLOW_${workflowType.toUpperCase()}`,
          targetId: params.threadId || params.emailId || executionId,
          metadata: JSON.stringify({ durationMs, workflowType }),
        },
      });

      // Real-time broadcast to connected user
      emitToUser(userId, 'execution:status', {
        executionId,
        status: 'SUCCEEDED',
        workflowType,
        result,
        durationMs,
      });

      logger.info(`Execution job ${executionId} completed successfully in ${durationMs}ms`);
      return result;
    } catch (error: any) {
      const durationMs = Date.now() - startTime;
      logger.error(`Execution job ${executionId} failed:`, error.message);

      await prisma.execution.update({
        where: { id: executionId },
        data: {
          status: 'FAILED',
          error: error.message || 'Unknown execution error',
          durationMs,
          completedAt: new Date(),
        },
      });

      emitToUser(userId, 'execution:status', {
        executionId,
        status: 'FAILED',
        workflowType,
        error: error.message,
        durationMs,
      });

      throw error;
    }
  }
}
