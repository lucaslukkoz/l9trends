import { Router } from 'express';
import { z } from 'zod';
import { authenticate } from '../middlewares/authenticate';
import { validate } from '../middlewares/validate';
import * as controller from '../controllers/reminder.controller';

const router = Router();
router.use(authenticate);

router.get('/', controller.list);
router.get('/unread', controller.getUnread);

const createSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  dueDate: z.string().min(1), // ISO date string
});
router.post('/', validate(createSchema), controller.create);
router.patch('/:id/read', controller.markAsRead);
router.patch('/read-all', controller.markAllAsRead);
router.delete('/:id', controller.remove);

export default router;
