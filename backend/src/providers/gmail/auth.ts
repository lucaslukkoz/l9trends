import { google } from 'googleapis';
import { createOAuth2Client } from '../../config/google';
import { encrypt } from '../../utils/encryption';
import { ValidationError, BadGatewayError } from '../../utils/errors';
import GmailToken from '../../models/GmailToken';
import { EmailAccount } from '../../models';
import { findOrCreateFromGmail } from '../../services/auth.service';

const SCOPES = [
  'https://www.googleapis.com/auth/gmail.readonly',
  'https://www.googleapis.com/auth/gmail.send',
  'https://www.googleapis.com/auth/gmail.modify',
  'https://www.googleapis.com/auth/userinfo.email',
  'https://www.googleapis.com/auth/userinfo.profile',
];

export function generateAuthUrl(): string {
  const oauth2Client = createOAuth2Client();

  const url = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    prompt: 'consent',
    scope: SCOPES,
  });

  return url;
}

export async function exchangeCodeForTokens(
  code: string,
): Promise<{ userId: number; token: string }> {
  // Exchange authorization code for tokens
  const oauth2Client = createOAuth2Client();
  let tokens;
  try {
    const response = await oauth2Client.getToken(code);
    tokens = response.tokens;
  } catch {
    throw new BadGatewayError('Failed to exchange authorization code for tokens');
  }

  oauth2Client.setCredentials(tokens);

  // Fetch Gmail profile to get email and name
  let gmailEmail: string;
  let userName: string;
  try {
    const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client });
    const userInfo = await oauth2.userinfo.get();
    gmailEmail = userInfo.data.email!;
    userName = userInfo.data.name || gmailEmail;
  } catch {
    throw new BadGatewayError('Failed to fetch user profile from Google');
  }

  // Find or create user account and generate JWT
  const { user, token } = await findOrCreateFromGmail(gmailEmail, userName);

  // Encrypt tokens
  const encryptedAccessToken = encrypt(tokens.access_token!);
  const encryptedRefreshToken = encrypt(tokens.refresh_token!);
  const expiresAt = new Date(tokens.expiry_date!);

  // Upsert GmailToken
  const existing = await GmailToken.findOne({ where: { userId: user.id } });
  if (existing) {
    await existing.update({
      accessToken: encryptedAccessToken,
      refreshToken: encryptedRefreshToken,
      expiresAt,
      gmailEmail,
    });
  } else {
    await GmailToken.create({
      userId: user.id,
      accessToken: encryptedAccessToken,
      refreshToken: encryptedRefreshToken,
      expiresAt,
      gmailEmail,
    });
  }

  // Create or update EmailAccount for this Gmail connection
  await EmailAccount.findOrCreate({
    where: { userId: user.id, provider: 'gmail', email: gmailEmail },
    defaults: {
      userId: user.id,
      provider: 'gmail',
      email: gmailEmail,
      displayName: userName || gmailEmail,
      isActive: true,
      accessToken: encryptedAccessToken,
      refreshToken: encryptedRefreshToken,
      tokenExpiresAt: expiresAt,
      syncStatus: 'idle',
    },
  });

  return { userId: user.id, token };
}
