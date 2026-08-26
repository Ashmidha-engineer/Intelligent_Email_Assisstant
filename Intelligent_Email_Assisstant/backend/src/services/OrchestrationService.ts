import { GmailService } from './GmailService.js';
import queueService from './QueueService.js';
import prisma from '../config/db.js';

export class OrchestrationService {
  /**
   * Helper to fetch and format thread text from GmailService or cache
   */
  private static async getThreadContext(userId: string, threadId: string): Promise<{ subject: string; threadText: string; from: string }> {
    const messages = await GmailService.getThread(userId, threadId);

    if (!messages || messages.length === 0) {
      // Check if emailCache has this message
      const single = await prisma.emailCache.findFirst({
        where: {
          userId,
          OR: [{ threadId }, { gmailMessageId: threadId }, { id: threadId }],
        },
      });

      if (single) {
        return {
          subject: single.subject,
          from: single.from,
          threadText: `From: ${single.from}\nDate: ${single.receivedAt.toISOString()}\nSubject: ${single.subject}\n\n${single.bodyPlain || single.snippet}`,
        };
      }

      throw new Error(`Email thread ${threadId} not found`);
    }

    const subject = messages[0]?.subject || 'No Subject';
    const from = messages[messages.length - 1]?.from || messages[0]?.from || '';

    const formattedThread = messages
      .map((m, idx) => `[Message ${idx + 1}] From: ${m.from} (${m.receivedAt})\nSubject: ${m.subject}\n\n${m.bodyPlain || m.snippet}`)
      .join('\n\n---\n\n');

    return {
      subject,
      from,
      threadText: formattedThread,
    };
  }

  /**
   * Orchestrate Thread Summarization
   */
  static async triggerSummarize(userId: string, threadId: string, format: 'bullets' | 'paragraph' = 'bullets') {
    const { subject, threadText } = await this.getThreadContext(userId, threadId);
    return queueService.submitJob(userId, 'summarize', {
      threadId,
      subject,
      threadText,
      format,
    });
  }

  /**
   * Orchestrate Smart Reply Generation
   */
  static async triggerGenerateReply(
    userId: string,
    threadId: string,
    tone: 'Professional' | 'Friendly' | 'Formal' | 'Concise' = 'Professional',
    instructions?: string
  ) {
    const { subject, threadText, from } = await this.getThreadContext(userId, threadId);
    return queueService.submitJob(userId, 'generate_reply', {
      threadId,
      subject,
      from,
      threadText,
      tone,
      instructions,
    });
  }

  /**
   * Orchestrate Thread Explanation
   */
  static async triggerExplain(userId: string, threadId: string) {
    const { subject, threadText } = await this.getThreadContext(userId, threadId);
    return queueService.submitJob(userId, 'explain', {
      threadId,
      subject,
      threadText,
    });
  }

  /**
   * Orchestrate Email Classification & Priority Detection
   */
  static async triggerClassify(userId: string, emailId: string) {
    const email = await prisma.emailCache.findFirst({
      where: {
        userId,
        OR: [{ id: emailId }, { gmailMessageId: emailId }],
      },
    });

    const subject = email?.subject || 'Email';
    const from = email?.from || '';
    const threadText = email?.bodyPlain || email?.snippet || '';

    return queueService.submitJob(userId, 'classify', {
      emailId,
      subject,
      from,
      threadText,
    });
  }

  /**
   * Orchestrate Action Items Extraction
   */
  static async triggerExtractActions(userId: string, threadId: string) {
    const { subject, threadText } = await this.getThreadContext(userId, threadId);
    return queueService.submitJob(userId, 'extract_actions', {
      threadId,
      subject,
      threadText,
    });
  }

  /**
   * Orchestrate Compound Workflow: Summarize + Draft Reply + Extract Actions
   */
  static async triggerCompound(
    userId: string,
    threadId: string,
    tone: 'Professional' | 'Friendly' | 'Formal' | 'Concise' = 'Professional',
    instructions?: string
  ) {
    const { subject, threadText, from } = await this.getThreadContext(userId, threadId);
    return queueService.submitJob(userId, 'compound', {
      threadId,
      subject,
      from,
      threadText,
      tone,
      instructions,
    });
  }
}
