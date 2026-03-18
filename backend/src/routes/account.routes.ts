import { Router } from 'express';
import { z } from 'zod';
import { authenticate } from '../middlewares/authenticate';
import { validate } from '../middlewares/validate';
import * as controller from '../controllers/account.controller';
import { emailAttachmentUpload } from '../controllers/account.controller';
import * as draftController from '../controllers/draft.controller';
import * as metricsController from '../controllers/metrics.controller';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Account management
router.get('/', controller.listAccounts);
router.delete('/:accountId', controller.removeAccount);

// Add IMAP account with validation
const addImapSchema = z.object({
  email: z.string().email(),
  displayName: z.string().optional(),
  imapHost: z.string().min(1),
  imapPort: z.number().int().positive(),
  smtpHost: z.string().min(1),
  smtpPort: z.number().int().positive(),
  username: z.string().min(1),
  password: z.string().min(1),
  useTls: z.boolean().optional(),
});
router.post('/imap', validate(addImapSchema), controller.addImapAccount);

// Account-scoped email operations
router.get('/:accountId/emails', controller.getEmails);
router.get('/:accountId/emails/:emailId', controller.getEmail);

const sendEmailSchema = z.object({
  to: z.string().min(1),
  cc: z.string().optional(),
  bcc: z.string().optional(),
  subject: z.string().min(1),
  body: z.string().min(1),
  inReplyTo: z.string().optional(),
  references: z.string().optional(),
});
router.post('/:accountId/emails/send', emailAttachmentUpload.array('attachments', 10), controller.sendEmail);
router.get('/:accountId/emails/:emailId/attachments/:attachmentId', controller.getAttachment);
router.patch('/:accountId/emails/:emailId/read', controller.markEmailRead);
router.delete('/:accountId/emails/:emailId', controller.deleteEmail);

// Favorites
router.patch('/:accountId/emails/:emailId/favorite', controller.toggleFavorite);
router.get('/:accountId/favorites', controller.getFavorites);

// Signature
router.get('/:accountId/signature', controller.getSignature);
const updateSignatureSchema = z.object({
  signatureHtml: z.string(),
  enabled: z.boolean(),
});
router.put('/:accountId/signature', validate(updateSignatureSchema), controller.updateSignature);

// Sent emails
router.get('/:accountId/sent', controller.getSentEmails);

// Trash operations
router.get('/:accountId/trash', controller.getTrash);
router.post('/:accountId/emails/:emailId/restore', controller.restoreEmail);
router.delete('/:accountId/trash/:emailId', controller.permanentDelete);

// Drafts
router.get('/:accountId/drafts', draftController.listDrafts);
router.get('/:accountId/drafts/:draftId', draftController.getDraft);
router.post('/:accountId/drafts', draftController.saveDraft);
router.put('/:accountId/drafts/:draftId', draftController.updateDraft);
router.delete('/:accountId/drafts/:draftId', draftController.deleteDraft);

// Metrics
router.get('/:accountId/metrics', metricsController.getMetrics);

// Manual sync trigger
router.post('/:accountId/sync', controller.triggerSync);

export default router;
