import { Request, Response } from 'express';
import { google } from 'googleapis';
import jwt from 'jsonwebtoken';
import { ENV } from '../config/env.js';
import prisma from '../config/db.js';
import { TokenService } from '../services/TokenService.js';
import { logger } from '../utils/logger.js';

export class AuthController {
  private static getOAuthClient() {
    return new google.auth.OAuth2(
      ENV.GOOGLE_CLIENT_ID,
      ENV.GOOGLE_CLIENT_SECRET,
      ENV.GOOGLE_REDIRECT_URI
    );
  }

  /**
   * Redirect to Google OAuth consent screen
   */
  static getGoogleAuthUrl(req: Request, res: Response) {
    if (!ENV.GOOGLE_CLIENT_ID || !ENV.GOOGLE_CLIENT_SECRET) {
      // In sandbox mode without credentials, redirect to demo login
      res.redirect(`${ENV.FRONTEND_URL}/login?mock=true`);
      return;
    }

    const oauth2Client = AuthController.getOAuthClient();
    const scopes = [
      'https://www.googleapis.com/auth/userinfo.email',
      'https://www.googleapis.com/auth/userinfo.profile',
      'https://www.googleapis.com/auth/gmail.readonly',
      'https://www.googleapis.com/auth/gmail.send',
      'https://www.googleapis.com/auth/gmail.modify',
      'openid',
    ];

    const state = Math.random().toString(36).substring(7);

    const url = oauth2Client.generateAuthUrl({
      access_type: 'offline',
      prompt: 'consent',
      scope: scopes,
      state,
    });

    res.redirect(url);
  }

  /**
   * OAuth 2.0 callback handler
   */
  static async handleGoogleCallback(req: Request, res: Response) {
    const code = req.query.code as string;
    const error = req.query.error as string;

    if (error) {
      logger.error('Google OAuth error:', error);
      res.redirect(`${ENV.FRONTEND_URL}/login?error=${encodeURIComponent(error)}`);
      return;
    }

    if (!code) {
      res.redirect(`${ENV.FRONTEND_URL}/login?error=no_code`);
      return;
    }

    try {
      const oauth2Client = AuthController.getOAuthClient();
      const { tokens } = await oauth2Client.getToken(code);
      oauth2Client.setCredentials(tokens);

      const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client });
      const userInfoRes = await oauth2.userinfo.get();
      const userInfo = userInfoRes.data;

      if (!userInfo.email) {
        throw new Error('No email found in Google profile');
      }

      // Upsert User
      const user = await prisma.user.upsert({
        where: { email: userInfo.email },
        update: {
          name: userInfo.name || null,
          avatarUrl: userInfo.picture || null,
        },
        create: {
          email: userInfo.email,
          name: userInfo.name || 'User',
          avatarUrl: userInfo.picture || null,
          settings: {
            create: {
              defaultTone: 'Professional',
            },
          },
        },
      });

      // Encrypt and store tokens
      if (tokens.access_token) {
        await TokenService.saveTokens(user.id, 'google', {
          accessToken: tokens.access_token,
          refreshToken: tokens.refresh_token,
          expiresAt: tokens.expiry_date ? new Date(tokens.expiry_date) : null,
          scope: tokens.scope || undefined,
        });
      }

      // Generate JWT Session Token
      const sessionToken = jwt.sign(
        { userId: user.id, email: user.email },
        ENV.JWT_SECRET,
        { expiresIn: '7d' }
      );

      // Set HTTP-only Cookie
      res.cookie('session_token', sessionToken, {
        httpOnly: true,
        secure: ENV.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      });

      logger.info(`User ${user.email} authenticated successfully via Google OAuth`);
      res.redirect(`${ENV.FRONTEND_URL}/dashboard`);
    } catch (err: any) {
      logger.error('Failed to handle Google OAuth callback:', err.message);
      res.redirect(`${ENV.FRONTEND_URL}/login?error=auth_failed`);
    }
  }

  /**
   * Direct Email Login / Registration with any custom email address
   */
  static async emailLogin(req: Request, res: Response) {
    try {
      const { email, name } = req.body;

      if (!email || typeof email !== 'string' || !email.includes('@')) {
        res.status(400).json({ error: 'Please provide a valid email address' });
        return;
      }

      const cleanEmail = email.trim().toLowerCase();
      const userName =
        (name && name.trim()) ||
        cleanEmail
          .split('@')[0]
          .replace(/[._-]/g, ' ')
          .replace(/\b\w/g, (c) => c.toUpperCase());

      // Check if user already exists
      let user = await prisma.user.findUnique({
        where: { email: cleanEmail },
      });

      const isNewUser = !user;

      if (!user) {
        user = await prisma.user.create({
          data: {
            email: cleanEmail,
            name: userName,
            avatarUrl: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(
              userName
            )}&backgroundColor=e8a2a2,a0c3d2,eac7c7`,
            settings: {
              create: {
                defaultTone: 'Professional',
                aiProvider: 'claude',
                aiModel: 'claude-3-5-sonnet',
                autoClassify: true,
              },
            },
          },
        });

        // Seed welcome and priority emails for new user inbox
        const initialEmails = [
          {
            userId: user.id,
            gmailMessageId: `msg-${Date.now()}-1`,
            threadId: `thread-welcome-${Date.now()}`,
            subject: 'Welcome to your Intelligent Email Assistant!',
            from: 'AI Assistant Team <welcome@intelligent-assistant.ai>',
            to: cleanEmail,
            snippet: `Welcome ${userName}! Your intelligent inbox is now ready with AI summarization and tone-aware reply generation...`,
            bodyPlain: `Hi ${userName},\n\nWelcome to your Intelligent Email Assistant!\n\nHere are 3 quick actions you can try right away:\n1. Click "Summarize" to get an instant bulleted overview of this email.\n2. Click "Compound AI" to summarize, extract actions, and generate a draft reply in one click.\n3. Test the Smart Reply composer below with 4 tone personas (Professional, Friendly, Formal, Concise).\n\nEnjoy your AI-powered email productivity!\n\nBest,\nThe Intelligent Assistant Team`,
            bodyHtml: `<p>Hi ${userName},</p><p>Welcome to your <strong>Intelligent Email Assistant</strong>!</p><p><strong>Here are 3 quick actions you can try right away:</strong></p><ol><li>Click <strong>"Summarize"</strong> to get an instant bulleted overview of this email.</li><li>Click <strong>"Compound AI"</strong> to summarize, extract actions, and generate a draft reply in one click.</li><li>Test the <strong>Smart Reply composer</strong> below with 4 tone personas (Professional, Friendly, Formal, Concise).</li></ol><p>Enjoy your AI-powered email productivity!</p><p>Best,<br/><strong>The Intelligent Assistant Team</strong></p>`,
            labels: 'INBOX,IMPORTANT',
            category: 'Primary',
            priority: 'NORMAL',
            isRead: false,
            isStarred: true,
            hasAttachments: false,
            receivedAt: new Date(),
          },
          {
            userId: user.id,
            gmailMessageId: `msg-${Date.now()}-2`,
            threadId: `thread-urgent-review-${Date.now()}`,
            subject: 'URGENT: Project Milestone & Architecture Sign-Off',
            from: 'Sarah Chen <sarah.chen@techcorp.io>',
            to: cleanEmail,
            snippet: `Hi ${userName}, please review the updated technical specifications and confirm your sign-off before Thursday 4 PM...`,
            bodyPlain: `Hi ${userName},\n\nWe need your final sign-off on the Q3 roadmap and database architecture by tomorrow at 4:00 PM EST.\n\nPlease review the points raised and reply with your approval so DevOps can schedule the deployment window.\n\nBest regards,\nSarah Chen\nLead Cloud Architect`,
            bodyHtml: `<p>Hi ${userName},</p><p>We need your final sign-off on the Q3 roadmap and database architecture by tomorrow at 4:00 PM EST.</p><p>Please review the points raised and reply with your approval so DevOps can schedule the deployment window.</p><p>Best regards,<br/><strong>Sarah Chen</strong><br/>Lead Cloud Architect</p>`,
            labels: 'INBOX',
            category: 'Work',
            priority: 'URGENT',
            isRead: false,
            isStarred: false,
            hasAttachments: true,
            receivedAt: new Date(Date.now() - 1000 * 60 * 35),
          },
        ];

        for (const mail of initialEmails) {
          await prisma.emailCache.create({ data: mail });
        }
      }

      const sessionToken = jwt.sign(
        { userId: user.id, email: user.email },
        ENV.JWT_SECRET,
        { expiresIn: '7d' }
      );

      res.cookie('session_token', sessionToken, {
        httpOnly: true,
        secure: false,
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

      logger.info(`User ${user.email} logged in successfully via custom email sign-in`);

      res.json({
        success: true,
        isNewUser,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          avatarUrl: user.avatarUrl,
        },
        token: sessionToken,
      });
    } catch (err: any) {
      logger.error('Error during email login:', err.message);
      res.status(500).json({ error: 'Failed to sign in with email' });
    }
  }

  /**
   * One-Click Demo/Sandbox Login for local evaluation
   */
  static async demoLogin(req: Request, res: Response) {
    try {
      const demoEmail = 'demo.user@intelligent-assistant.ai';
      
      const user = await prisma.user.upsert({
        where: { email: demoEmail },
        update: {},
        create: {
          email: demoEmail,
          name: 'Alex Vance (Demo User)',
          avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
          settings: {
            create: {
              defaultTone: 'Professional',
            },
          },
        },
      });

      const sessionToken = jwt.sign(
        { userId: user.id, email: user.email },
        ENV.JWT_SECRET,
        { expiresIn: '7d' }
      );

      res.cookie('session_token', sessionToken, {
        httpOnly: true,
        secure: false,
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

      res.json({
        success: true,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          avatarUrl: user.avatarUrl,
        },
        token: sessionToken,
      });
    } catch (err: any) {
      logger.error('Error during demo login:', err.message);
      res.status(500).json({ error: 'Failed to create demo session' });
    }
  }

  /**
   * Get currently logged-in user profile & connection status
   */
  static async getSession(req: Request, res: Response) {
    if (!req.user) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }

    const token = await prisma.oAuthToken.findUnique({
      where: {
        userId_provider: {
          userId: req.user.id,
          provider: 'google',
        },
      },
    });

    const settings = await prisma.userSettings.findUnique({
      where: { userId: req.user.id },
    });

    res.json({
      user: req.user,
      isGoogleConnected: !!token || req.user.email.includes('demo'),
      settings: settings || {
        defaultTone: 'Professional',
        aiProvider: 'claude',
        aiModel: 'claude-3-5-sonnet',
        autoClassify: true,
      },
    });
  }

  /**
   * Logout user
   */
  static async logout(req: Request, res: Response) {
    res.clearCookie('session_token');
    res.json({ success: true, message: 'Logged out successfully' });
  }
}
