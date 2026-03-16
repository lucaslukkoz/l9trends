import { Router } from 'express';
import authRoutes from './auth.routes';
import gmailRoutes from './gmail.routes';
import accountRoutes from './account.routes';
import reminderRoutes from './reminder.routes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/gmail', gmailRoutes);
router.use('/accounts', accountRoutes);
router.use('/reminders', reminderRoutes);

export default router;
