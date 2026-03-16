import { Router } from 'express';
import { z } from 'zod';
import { authenticate } from '../middlewares/authenticate';
import { validate } from '../middlewares/validate';
import * as authController from '../controllers/auth.controller';
import { avatarUpload } from '../controllers/auth.controller';

const router = Router();

const registerSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

router.post('/register', validate(registerSchema), authController.register);
router.post('/login', validate(loginSchema), authController.login);
router.get('/me', authenticate, authController.me);
router.post('/avatar', authenticate, avatarUpload.single('avatar'), authController.uploadAvatar);

export default router;
