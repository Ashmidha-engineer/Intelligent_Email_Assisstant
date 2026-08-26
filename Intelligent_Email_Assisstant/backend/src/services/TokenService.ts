import { google } from 'googleapis';
import prisma from '../config/db.js';
import { ENV } from '../config/env.js';
import { encrypt, decrypt } from '../utils/encryption.js';
import { logger } from '../utils/logger.js';

export class TokenService {
  /**
   * Store or update encrypted OAuth tokens for a user
   */
  static async saveTokens(
    userId: string,
    provider: string,
    tokens: {
      accessToken: string;
      refreshToken?: string | null;
      expiresAt?: Date | null;
      scope?: string;
    }
  ) {
    const encryptedAccessToken = encrypt(tokens.accessToken);
    const encryptedRefreshToken = tokens.refreshToken ? encrypt(tokens.refreshToken) : undefined;

    return prisma.oAuthToken.upsert({
      where: {
        userId_provider: {
          userId,
          provider,
        },
      },
      update: {
        encryptedAccessToken,
        ...(encryptedRefreshToken && { encryptedRefreshToken }),
        ...(tokens.expiresAt && { expiresAt: tokens.expiresAt }),
        ...(tokens.scope && { scope: tokens.scope }),
        updatedAt: new Date(),
      },
      create: {
        userId,
        provider,
        encryptedAccessToken,
        encryptedRefreshToken: encryptedRefreshToken || null,
        expiresAt: tokens.expiresAt || null,
        scope: tokens.scope || null,
      },
    });
  }

  /**
   * Retrieve and decrypt tokens, automatically refreshing if expired
   */
  static async getValidAccessToken(userId: string, provider = 'google'): Promise<string | null> {
    const tokenRecord = await prisma.oAuthToken.findUnique({
      where: {
        userId_provider: {
          userId,
          provider,
        },
      },
    });

    if (!tokenRecord) {
      return null;
    }

    const decryptedAccessToken = decrypt(tokenRecord.encryptedAccessToken);

    // Check if token has expired or is expiring in next 2 minutes
    const now = new Date();
    const isExpired = tokenRecord.expiresAt && tokenRecord.expiresAt.getTime() - now.getTime() < 120000;

    if (!isExpired) {
      return decryptedAccessToken;
    }

    // Attempt token refresh if refresh token exists
    if (!tokenRecord.encryptedRefreshToken) {
      logger.warn(`Access token expired for user ${userId} and no refresh token available`);
      return decryptedAccessToken; // Fallback to current token
    }

    try {
      const decryptedRefreshToken = decrypt(tokenRecord.encryptedRefreshToken);
      const oauth2Client = new google.auth.OAuth2(
        ENV.GOOGLE_CLIENT_ID,
        ENV.GOOGLE_CLIENT_SECRET,
        ENV.GOOGLE_REDIRECT_URI
      );

      oauth2Client.setCredentials({
        refresh_token: decryptedRefreshToken,
      });

      const { credentials } = await oauth2Client.refreshAccessToken();

      if (credentials.access_token) {
        const newExpiresAt = credentials.expiry_date ? new Date(credentials.expiry_date) : null;
        await this.saveTokens(userId, provider, {
          accessToken: credentials.access_token,
          refreshToken: credentials.refresh_token || decryptedRefreshToken,
          expiresAt: newExpiresAt,
        });

        logger.info(`Successfully refreshed Google access token for user ${userId}`);
        return credentials.access_token;
      }
    } catch (error: any) {
      logger.error(`Failed to refresh token for user ${userId}:`, error.message);
    }

    return decryptedAccessToken;
  }

  /**
   * Revoke/Remove tokens on disconnect
   */
  static async removeTokens(userId: string, provider = 'google') {
    return prisma.oAuthToken.deleteMany({
      where: {
        userId,
        provider,
      },
    });
  }
}
