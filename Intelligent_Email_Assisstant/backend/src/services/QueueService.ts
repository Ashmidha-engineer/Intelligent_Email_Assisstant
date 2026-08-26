import { Queue, Worker, Job } from 'bullmq';
import IORedis from 'ioredis';
import { ENV } from '../config/env.js';
import prisma from '../config/db.js';
import { ExecutionWorker, ExecutionJobData } from '../workers/ExecutionWorker.js';
import { logger } from '../utils/logger.js';
import { emitToUser } from '../websocket/socketManager.js';

class QueueService {
  private bullQueue: Queue | null = null;
  private bullWorker: Worker | null = null;
  private isRedisConnected = false;
  private inMemoryQueue: ExecutionJobData[] = [];
  private isProcessingInMemory = false;

  constructor() {
    this.init();
  }

  private async init() {
    if (ENV.REDIS_URL) {
      try {
        const connection = new (IORedis as any)(ENV.REDIS_URL, {
          maxRetriesPerRequest: null,
          enableReadyCheck: false,
          retryStrategy: () => null, // don't hang if redis is down
        });

        connection.on('connect', () => {
          this.isRedisConnected = true;
          logger.info('Connected to Redis for BullMQ execution queue');
        });

        connection.on('error', (err: any) => {
          logger.warn('Redis connection failed, switching to in-memory queue fallback:', err.message);
          this.isRedisConnected = false;
        });

        this.bullQueue = new Queue('ai-executions', { connection });
        this.bullWorker = new Worker(
          'ai-executions',
          async (job: Job) => {
            return ExecutionWorker.processJob(job.data as ExecutionJobData);
          },
          { connection, concurrency: 3 }
        );

        this.bullWorker.on('completed', (job: Job) => {
          logger.info(`BullMQ Job ${job.id} completed`);
        });

        this.bullWorker.on('failed', (job: Job | undefined, err: Error) => {
          logger.error(`BullMQ Job ${job?.id} failed:`, err.message);
        });
      } catch (err: any) {
        logger.warn('Failed to initialize Redis Queue, using in-memory queue:', err.message);
        this.isRedisConnected = false;
      }
    } else {
      logger.info('No REDIS_URL configured, using robust built-in in-memory execution queue');
    }
  }

  /**
   * Submit an AI workflow execution job
   */
  async submitJob(
    userId: string,
    workflowType: 'summarize' | 'generate_reply' | 'explain' | 'classify' | 'extract_actions' | 'compound',
    params: any
  ): Promise<{ executionId: string; status: string }> {
    // 1. Create Execution record in Database
    const execution = await prisma.execution.create({
      data: {
        userId,
        workflowType,
        status: 'QUEUED',
        inputRef: JSON.stringify(params),
      },
    });

    const jobData: ExecutionJobData = {
      executionId: execution.id,
      userId,
      workflowType,
      params,
    };

    // Emit initial QUEUED event
    emitToUser(userId, 'execution:status', {
      executionId: execution.id,
      status: 'QUEUED',
      workflowType,
    });

    // 2. Queue via BullMQ if Redis connected, else process asynchronously via in-memory queue
    if (this.isRedisConnected && this.bullQueue) {
      try {
        await this.bullQueue.add(workflowType, jobData, {
          attempts: 3,
          backoff: {
            type: 'exponential',
            delay: 1000,
          },
        });
      } catch (err) {
        logger.warn('Failed to add job to BullMQ, falling back to in-memory queue');
        this.enqueueInMemory(jobData);
      }
    } else {
      this.enqueueInMemory(jobData);
    }

    return {
      executionId: execution.id,
      status: 'QUEUED',
    };
  }

  /**
   * In-memory async worker queue
   */
  private enqueueInMemory(jobData: ExecutionJobData) {
    this.inMemoryQueue.push(jobData);
    this.processNextInMemory();
  }

  private async processNextInMemory() {
    if (this.isProcessingInMemory || this.inMemoryQueue.length === 0) {
      return;
    }

    this.isProcessingInMemory = true;
    const job = this.inMemoryQueue.shift();

    if (job) {
      // Execute asynchronously in background
      setTimeout(async () => {
        try {
          await ExecutionWorker.processJob(job);
        } catch (err: any) {
          logger.error(`Error in in-memory execution job ${job.executionId}:`, err.message);
        } finally {
          this.isProcessingInMemory = false;
          this.processNextInMemory();
        }
      }, 50); // slight non-blocking tick
    } else {
      this.isProcessingInMemory = false;
    }
  }

  /**
   * Retry a failed execution
   */
  async retryExecution(userId: string, executionId: string) {
    const execution = await prisma.execution.findFirst({
      where: { id: executionId, userId },
    });

    if (!execution) {
      throw new Error('Execution not found');
    }

    const params = execution.inputRef ? JSON.parse(execution.inputRef) : {};
    return this.submitJob(userId, execution.workflowType as any, params);
  }
}

export const queueService = new QueueService();
export default queueService;
