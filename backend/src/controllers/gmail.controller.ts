import { Request, Response, NextFunction } from 'express';
import { generateAuthUrl, exchangeCodeForTokens } from '../providers/gmail/auth';
import * as gmailService from '../services/gmail.service';
import { ValidationError } from '../utils/errors';

export async function connect(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const url = generateAuthUrl();
    res.status(200).json({ url });
  } catch (error) {
    next(error);
  }
}

export async function callback(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { code } = req.query;

    if (!code || typeof code !== 'string') {
      throw new ValidationError('Missing authorization code');
    }

    const { token } = await exchangeCodeForTokens(code);
    const frontendUrl = process.env.CORS_ORIGIN || 'http://localhost:3000';
    res.redirect(`${frontendUrl}/gmail/callback?token=${token}`);
  } catch (error) {
    next(error);
  }
}

export async function getEmails(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const pageToken = req.query.pageToken as string | undefined;
    const maxResults = req.query.maxResults
      ? parseInt(req.query.maxResults as string, 10)
      : undefined;

    const result = await gmailService.getInbox(
      req.user!.id,
      pageToken,
      maxResults,
    );
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}

export async function getEmail(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { id } = req.params;
    const result = await gmailService.getEmail(req.user!.id, id);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}

export async function sendEmail(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { to, subject, body } = req.body;
    const result = await gmailService.sendEmail(
      req.user!.id,
      to,
      subject,
      body,
    );
    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
}

export async function deleteEmail(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { id } = req.params;
    await gmailService.deleteEmail(req.user!.id, id);
    res.status(200).json({ message: 'Email deleted successfully' });
  } catch (error) {
    next(error);
  }
}
