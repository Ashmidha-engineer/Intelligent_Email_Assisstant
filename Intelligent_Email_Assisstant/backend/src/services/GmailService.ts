import { google, gmail_v1 } from 'googleapis';
import { TokenService } from './TokenService.js';
import { ENV } from '../config/env.js';
import { logger } from '../utils/logger.js';
import prisma from '../config/db.js';

export interface EmailSummaryItem {
  id: string;
  gmailMessageId: string;
  threadId: string;
  subject: string;
  snippet: string;
  from: string;
  to: string;
  labels: string[];
  category: string;
  priority: string;
  isRead: boolean;
  isStarred: boolean;
  isArchived: boolean;
  hasAttachments: boolean;
  receivedAt: string;
}

export interface ThreadMessage {
  id: string;
  gmailMessageId: string;
  threadId: string;
  subject: string;
  from: string;
  to: string;
  snippet: string;
  bodyPlain: string;
  bodyHtml: string;
  receivedAt: string;
  isRead: boolean;
  isStarred: boolean;
  hasAttachments: boolean;
}

export class GmailService {
  /**
   * Helper to instantiate authenticated Google Gmail API client
   */
  private static async getGmailClient(userId: string): Promise<gmail_v1.Gmail | null> {
    const accessToken = await TokenService.getValidAccessToken(userId);
    if (!accessToken) {
      return null;
    }

    const auth = new google.auth.OAuth2(
      ENV.GOOGLE_CLIENT_ID,
      ENV.GOOGLE_CLIENT_SECRET,
      ENV.GOOGLE_REDIRECT_URI
    );
    auth.setCredentials({ access_token: accessToken });

    return google.gmail({ version: 'v1', auth });
  }

  /**
   * List emails for a user with folder/label filters and search query
   */
  static async listEmails(
    userId: string,
    options: {
      folder?: string;
      query?: string;
      page?: number;
      limit?: number;
      starred?: boolean;
    } = {}
  ): Promise<{ emails: EmailSummaryItem[]; total: number }> {
    const { folder = 'INBOX', query = '', starred, limit = 25 } = options;

    // Check if user has connected Gmail credentials
    const gmail = await this.getGmailClient(userId);

    // If live Gmail client is available and not in explicit mock mode
    if (gmail && !ENV.MOCK_MODE) {
      try {
        let q = query;
        if (folder === 'INBOX') q += ' in:inbox';
        else if (folder === 'STARRED' || starred) q += ' is:starred';
        else if (folder === 'SENT') q += ' in:sent';
        else if (folder === 'DRAFT') q += ' in:draft';
        else if (folder === 'TRASH') q += ' in:trash';
        else if (folder === 'SPAM') q += ' in:spam';
        else if (folder === 'ARCHIVE') q += ' -in:inbox -in:trash -in:spam';

        const res = await gmail.users.messages.list({
          userId: 'me',
          q: q.trim(),
          maxResults: limit,
        });

        const messages = res.data.messages || [];
        const emailItems: EmailSummaryItem[] = [];

        // Fetch details for retrieved message IDs
        for (const msg of messages.slice(0, limit)) {
          if (!msg.id) continue;
          try {
            const detail = await gmail.users.messages.get({
              userId: 'me',
              id: msg.id,
              format: 'full',
            });

            const parsed = this.parseGmailMessage(detail.data);
            emailItems.push(parsed);

            // Sync to local database cache for fast querying
            await prisma.emailCache.upsert({
              where: {
                userId_gmailMessageId: {
                  userId,
                  gmailMessageId: parsed.gmailMessageId,
                },
              },
              update: {
                subject: parsed.subject,
                snippet: parsed.snippet,
                from: parsed.from,
                to: parsed.to,
                labels: JSON.stringify(parsed.labels),
                isRead: parsed.isRead,
                isStarred: parsed.isStarred,
                isArchived: parsed.isArchived,
              },
              create: {
                userId,
                gmailMessageId: parsed.gmailMessageId,
                threadId: parsed.threadId,
                subject: parsed.subject,
                snippet: parsed.snippet,
                from: parsed.from,
                to: parsed.to,
                labels: JSON.stringify(parsed.labels),
                isRead: parsed.isRead,
                isStarred: parsed.isStarred,
                isArchived: parsed.isArchived,
                receivedAt: new Date(parsed.receivedAt),
              },
            });
          } catch (e: any) {
            logger.warn(`Could not parse live message ${msg.id}:`, e.message);
          }
        }

        return { emails: emailItems, total: res.data.resultSizeEstimate || emailItems.length };
      } catch (err: any) {
        logger.error('Error fetching live Gmail messages, falling back to local cache/sandbox:', err.message);
      }
    }

    // Fallback to local DB cache / Sandbox dataset
    const where: any = { userId };
    if (folder === 'STARRED' || starred) where.isStarred = true;
    else if (folder === 'ARCHIVE') where.isArchived = true;
    else if (folder === 'TRASH') where.isDeleted = true;
    else if (folder === 'INBOX') {
      where.isArchived = false;
      where.isDeleted = false;
    }

    if (query) {
      where.OR = [
        { subject: { contains: query } },
        { snippet: { contains: query } },
        { from: { contains: query } },
      ];
    }

    const cachedEmails = await prisma.emailCache.findMany({
      where,
      orderBy: { receivedAt: 'desc' },
      take: limit,
    });

    const items: EmailSummaryItem[] = cachedEmails.map((e) => ({
      id: e.id,
      gmailMessageId: e.gmailMessageId,
      threadId: e.threadId,
      subject: e.subject,
      snippet: e.snippet || '',
      from: e.from,
      to: e.to,
      labels: typeof e.labels === 'string' ? JSON.parse(e.labels || '[]') : ['INBOX'],
      category: e.category,
      priority: e.priority,
      isRead: e.isRead,
      isStarred: e.isStarred,
      isArchived: e.isArchived,
      hasAttachments: e.hasAttachments,
      receivedAt: e.receivedAt.toISOString(),
    }));

    return { emails: items, total: items.length };
  }

  /**
   * Get full thread messages by threadId or messageId
   */
  static async getThread(userId: string, threadId: string): Promise<ThreadMessage[]> {
    const gmail = await this.getGmailClient(userId);

    if (gmail && !ENV.MOCK_MODE) {
      try {
        const res = await gmail.users.threads.get({
          userId: 'me',
          id: threadId,
          format: 'full',
        });

        const messages = res.data.messages || [];
        return messages.map((m) => {
          const parsed = this.parseGmailMessage(m);
          return {
            id: m.id || threadId,
            gmailMessageId: m.id || '',
            threadId: m.threadId || threadId,
            subject: parsed.subject,
            from: parsed.from,
            to: parsed.to,
            snippet: parsed.snippet,
            bodyPlain: this.extractBody(m, 'text/plain') || parsed.snippet,
            bodyHtml: this.extractBody(m, 'text/html') || `<p>${parsed.snippet}</p>`,
            receivedAt: parsed.receivedAt,
            isRead: parsed.isRead,
            isStarred: parsed.isStarred,
            hasAttachments: parsed.hasAttachments,
          };
        });
      } catch (err: any) {
        logger.error(`Error fetching live thread ${threadId}:`, err.message);
      }
    }

    // Fallback to local DB cache
    const cached = await prisma.emailCache.findMany({
      where: {
        userId,
        OR: [{ threadId }, { gmailMessageId: threadId }, { id: threadId }],
      },
      orderBy: { receivedAt: 'asc' },
    });

    if (cached.length > 0) {
      return cached.map((e) => ({
        id: e.id,
        gmailMessageId: e.gmailMessageId,
        threadId: e.threadId,
        subject: e.subject,
        from: e.from,
        to: e.to,
        snippet: e.snippet || '',
        bodyPlain: e.bodyPlain || e.snippet || '',
        bodyHtml: e.bodyHtml || `<p>${e.snippet || ''}</p>`,
        receivedAt: e.receivedAt.toISOString(),
        isRead: e.isRead,
        isStarred: e.isStarred,
        hasAttachments: e.hasAttachments,
      }));
    }

    return [];
  }

  /**
   * Mark email/thread as read or unread
   */
  static async toggleRead(userId: string, emailId: string, isRead: boolean) {
    const gmail = await this.getGmailClient(userId);

    const email = await prisma.emailCache.findFirst({
      where: {
        userId,
        OR: [{ id: emailId }, { gmailMessageId: emailId }],
      },
    });

    if (gmail && email && !ENV.MOCK_MODE) {
      try {
        await gmail.users.messages.modify({
          userId: 'me',
          id: email.gmailMessageId,
          requestBody: {
            removeLabelIds: isRead ? ['UNREAD'] : [],
            addLabelIds: isRead ? [] : ['UNREAD'],
          },
        });
      } catch (err: any) {
        logger.warn(`Could not sync read state to Gmail: ${err.message}`);
      }
    }

    if (email) {
      return prisma.emailCache.update({
        where: { id: email.id },
        data: { isRead },
      });
    }

    return null;
  }

  /**
   * Star or unstar an email
   */
  static async toggleStar(userId: string, emailId: string, isStarred: boolean) {
    const gmail = await this.getGmailClient(userId);

    const email = await prisma.emailCache.findFirst({
      where: {
        userId,
        OR: [{ id: emailId }, { gmailMessageId: emailId }],
      },
    });

    if (gmail && email && !ENV.MOCK_MODE) {
      try {
        await gmail.users.messages.modify({
          userId: 'me',
          id: email.gmailMessageId,
          requestBody: {
            addLabelIds: isStarred ? ['STARRED'] : [],
            removeLabelIds: isStarred ? [] : ['STARRED'],
          },
        });
      } catch (err: any) {
        logger.warn(`Could not sync star state to Gmail: ${err.message}`);
      }
    }

    if (email) {
      return prisma.emailCache.update({
        where: { id: email.id },
        data: { isStarred },
      });
    }

    return null;
  }

  /**
   * Archive email
   */
  static async archiveEmail(userId: string, emailId: string) {
    const gmail = await this.getGmailClient(userId);

    const email = await prisma.emailCache.findFirst({
      where: {
        userId,
        OR: [{ id: emailId }, { gmailMessageId: emailId }],
      },
    });

    if (gmail && email && !ENV.MOCK_MODE) {
      try {
        await gmail.users.messages.modify({
          userId: 'me',
          id: email.gmailMessageId,
          requestBody: {
            removeLabelIds: ['INBOX'],
          },
        });
      } catch (err: any) {
        logger.warn(`Could not sync archive state to Gmail: ${err.message}`);
      }
    }

    if (email) {
      return prisma.emailCache.update({
        where: { id: email.id },
        data: { isArchived: true },
      });
    }

    return null;
  }

  /**
   * Delete / Trash email
   */
  static async deleteEmail(userId: string, emailId: string) {
    const gmail = await this.getGmailClient(userId);

    const email = await prisma.emailCache.findFirst({
      where: {
        userId,
        OR: [{ id: emailId }, { gmailMessageId: emailId }],
      },
    });

    if (gmail && email && !ENV.MOCK_MODE) {
      try {
        await gmail.users.messages.trash({
          userId: 'me',
          id: email.gmailMessageId,
        });
      } catch (err: any) {
        logger.warn(`Could not sync delete to Gmail: ${err.message}`);
      }
    }

    if (email) {
      return prisma.emailCache.update({
        where: { id: email.id },
        data: { isDeleted: true },
      });
    }

    return null;
  }

  /**
   * Send an email or thread reply using Gmail API
   */
  static async sendEmail(
    userId: string,
    params: {
      to: string;
      subject: string;
      body: string;
      threadId?: string;
      cc?: string;
      bcc?: string;
    }
  ) {
    const gmail = await this.getGmailClient(userId);

    if (gmail && !ENV.MOCK_MODE) {
      const utf8Subject = `=?utf-8?B?${Buffer.from(params.subject).toString('base64')}?=`;
      const messageParts = [
        `To: ${params.to}`,
        `Subject: ${utf8Subject}`,
        'MIME-Version: 1.0',
        'Content-Type: text/html; charset=utf-8',
        'Content-Transfer-Encoding: 7bit',
        '',
        params.body.replace(/\n/g, '<br/>'),
      ];

      if (params.cc) messageParts.splice(1, 0, `Cc: ${params.cc}`);
      if (params.bcc) messageParts.splice(1, 0, `Bcc: ${params.bcc}`);

      const rawMessage = messageParts.join('\r\n');
      const encodedMessage = Buffer.from(rawMessage)
        .toString('base64')
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');

      const response = await gmail.users.messages.send({
        userId: 'me',
        requestBody: {
          raw: encodedMessage,
          threadId: params.threadId,
        },
      });

      return {
        success: true,
        messageId: response.data.id,
        threadId: response.data.threadId,
      };
    }

    // Sandbox / Mock sent email simulation
    const sentMessageId = `mock-sent-${Date.now()}`;
    const threadId = params.threadId || `thread-mock-${Date.now()}`;

    await prisma.emailCache.create({
      data: {
        userId,
        gmailMessageId: sentMessageId,
        threadId,
        subject: params.subject,
        snippet: params.body.slice(0, 120),
        bodyPlain: params.body,
        bodyHtml: `<p>${params.body.replace(/\n/g, '<br/>')}</p>`,
        from: 'me',
        to: params.to,
        labels: JSON.stringify(['SENT']),
        isRead: true,
        receivedAt: new Date(),
      },
    });

    return {
      success: true,
      messageId: sentMessageId,
      threadId,
      simulated: true,
    };
  }

  // --- Internal Parser Utilities ---

  private static parseGmailMessage(m: gmail_v1.Schema$Message): EmailSummaryItem {
    const headers = m.payload?.headers || [];
    const getHeader = (name: string) =>
      headers.find((h) => h.name?.toLowerCase() === name.toLowerCase())?.value || '';

    const labelIds = m.labelIds || [];
    const isRead = !labelIds.includes('UNREAD');
    const isStarred = labelIds.includes('STARRED');
    const isArchived = !labelIds.includes('INBOX');

    const internalDate = m.internalDate ? parseInt(m.internalDate, 10) : Date.now();

    return {
      id: m.id || '',
      gmailMessageId: m.id || '',
      threadId: m.threadId || m.id || '',
      subject: getHeader('Subject') || '(No Subject)',
      snippet: m.snippet || '',
      from: getHeader('From') || 'Unknown Sender',
      to: getHeader('To') || 'me',
      labels: labelIds,
      category: labelIds.includes('CATEGORY_PROMOTIONS')
        ? 'Promotions'
        : labelIds.includes('CATEGORY_UPDATES')
        ? 'Updates'
        : labelIds.includes('CATEGORY_SOCIAL')
        ? 'Social'
        : 'Primary',
      priority: labelIds.includes('IMPORTANT') ? 'HIGH' : 'NORMAL',
      isRead,
      isStarred,
      isArchived,
      hasAttachments: !!(m.payload?.parts && m.payload.parts.some((p) => p.filename && p.filename.length > 0)),
      receivedAt: new Date(internalDate).toISOString(),
    };
  }

  private static extractBody(m: gmail_v1.Schema$Message, mimeType: string): string {
    const findPart = (parts: gmail_v1.Schema$MessagePart[]): string => {
      for (const part of parts) {
        if (part.mimeType === mimeType && part.body?.data) {
          return Buffer.from(part.body.data, 'base64').toString('utf8');
        }
        if (part.parts) {
          const found = findPart(part.parts);
          if (found) return found;
        }
      }
      return '';
    };

    if (m.payload?.mimeType === mimeType && m.payload.body?.data) {
      return Buffer.from(m.payload.body.data, 'base64').toString('utf8');
    }

    if (m.payload?.parts) {
      return findPart(m.payload.parts);
    }

    return '';
  }
}
