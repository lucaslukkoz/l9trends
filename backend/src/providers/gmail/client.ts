import { createOAuth2Client } from '../../config/google';
import { decrypt, encrypt } from '../../utils/encryption';
import { ForbiddenError } from '../../utils/errors';
import GmailToken from '../../models/GmailToken';

const TOKEN_EXPIRY_BUFFER_MS = 5 * 60 * 1000; // 5 minutes

export async function getAuthenticatedClient(userId: number) {
  const gmailToken = await GmailToken.findOne({ where: { userId } });

  if (!gmailToken) {
    throw new ForbiddenError('Gmail account not connected');
  }

  const oauth2Client = createOAuth2Client();

  const accessToken = decrypt(gmailToken.accessToken);
  const refreshToken = decrypt(gmailToken.refreshToken);

  oauth2Client.setCredentials({
    access_token: accessToken,
    refresh_token: refreshToken,
    expiry_date: gmailToken.expiresAt.getTime(),
  });

  // Refresh token if it expires within 5 minutes
  const now = Date.now();
  const expiresAt = gmailToken.expiresAt.getTime();

  if (expiresAt - now < TOKEN_EXPIRY_BUFFER_MS) {
    try {
      const { credentials } = await oauth2Client.refreshAccessToken();

      const newAccessToken = credentials.access_token!;
      const newExpiresAt = new Date(credentials.expiry_date!);

      await gmailToken.update({
        accessToken: encrypt(newAccessToken),
        expiresAt: newExpiresAt,
      });

      oauth2Client.setCredentials(credentials);
    } catch (error: any) {
      if (error?.response?.data?.error === 'invalid_grant') {
        await gmailToken.destroy();
        throw new ForbiddenError('GMAIL_REAUTH_REQUIRED');
      }
      throw error;
    }
  }

  return oauth2Client;
}
