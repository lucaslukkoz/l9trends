import { Request, Response, NextFunction } from 'express';
import multer from 'multer';
import * as accountService from '../services/account.service';
import * as emailService from '../services/email.service';

const emailAttachmentUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 25 * 1024 * 1024 }, // 25MB per file
});

export { emailAttachmentUpload };

export async function listAccounts(req: Request, res: Response, next: NextFunction) {
  try {
    const accounts = await accountService.listAccounts(req.user!.id);
    res.json({ accounts });
  } catch (err) { next(err); }
}

export async function addImapAccount(req: Request, res: Response, next: NextFunction) {
  try {
    const account = await accountService.addImapAccount(req.user!.id, req.body);
    res.status(201).json(account);
  } catch (err) { next(err); }
}

export async function removeAccount(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await accountService.removeAccount(req.user!.id, Number(req.params.accountId));
    res.json(result);
  } catch (err) { next(err); }
}

export async function getEmails(req: Request, res: Response, next: NextFunction) {
  try {
    const { pageToken, maxResults } = req.query;
    const result = await emailService.getInbox(
      req.user!.id,
      Number(req.params.accountId),
      pageToken as string | undefined,
      maxResults ? Number(maxResults) : undefined
    );
    res.json(result);
  } catch (err) { next(err); }
}

export async function getEmail(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await emailService.getEmail(
      req.user!.id,
      Number(req.params.accountId),
      req.params.emailId
    );
    res.json(result);
  } catch (err) { next(err); }
}

export async function sendEmail(req: Request, res: Response, next: NextFunction) {
  try {
    const { to, cc, bcc, subject, body, inReplyTo, references } = req.body;

    // Build attachments from uploaded files
    const files = (req.files as Express.Multer.File[]) || [];
    const attachments = files.map(f => ({
      filename: f.originalname,
      content: f.buffer,
      contentType: f.mimetype,
    }));

    const result = await emailService.sendEmail(
      req.user!.id,
      Number(req.params.accountId),
      { to, cc, bcc, subject, body, inReplyTo, references, attachments: attachments.length > 0 ? attachments : undefined }
    );
    res.status(201).json(result);
  } catch (err) { next(err); }
}

export async function deleteEmail(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await emailService.deleteEmail(
      req.user!.id,
      Number(req.params.accountId),
      req.params.emailId
    );
    res.json(result);
  } catch (err) { next(err); }
}

export async function triggerSync(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await emailService.triggerSync(
      req.user!.id,
      Number(req.params.accountId)
    );
    res.json(result);
  } catch (err) { next(err); }
}

export async function getTrash(req: Request, res: Response, next: NextFunction) {
  try {
    const { pageToken } = req.query;
    const result = await emailService.getTrash(
      req.user!.id,
      Number(req.params.accountId),
      pageToken as string | undefined,
    );
    res.json(result);
  } catch (err) { next(err); }
}

export async function permanentDelete(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await emailService.permanentDelete(
      req.user!.id,
      Number(req.params.accountId),
      req.params.emailId,
    );
    res.json(result);
  } catch (err) { next(err); }
}

export async function restoreEmail(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await emailService.restoreEmail(
      req.user!.id,
      Number(req.params.accountId),
      req.params.emailId,
    );
    res.json(result);
  } catch (err) { next(err); }
}

export async function markEmailRead(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await emailService.markAsRead(
      req.user!.id,
      Number(req.params.accountId),
      req.params.emailId
    );
    res.json(result);
  } catch (err) { next(err); }
}
