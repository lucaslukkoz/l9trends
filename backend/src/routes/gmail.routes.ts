import { Router } from 'express';
import { z } from 'zod';
import { authenticate } from '../middlewares/authenticate';
import { validate } from '../middlewares/validate';
import * as gmailController from '../controllers/gmail.controller';

const router = Router();

const sendEmailSchema = z.object({
  to: z.string().email('Invalid email address'),
  subject: z.string().min(1, 'Subject is required'),
  body: z.string().min(1, 'Body is required'),
});

router.get('/connect', gmailController.connect);
router.get('/callback', gmailController.callback);

router.get('/emails', authenticate, gmailController.getEmails);
router.get('/emails/:id', authenticate, gmailController.getEmail);
router.post(
  '/emails/send',
  authenticate,
  validate(sendEmailSchema),
  gmailController.sendEmail,
);
router.delete('/emails/:id', authenticate, gmailController.deleteEmail);

export default router;
