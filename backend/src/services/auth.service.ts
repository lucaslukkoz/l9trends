import { signToken } from '../auth/jwtService';
import { User, GmailToken, EmailAccount } from '../models';
import { ConflictError, NotFoundError, UnauthorizedError } from '../utils/errors';

export async function registerUser(
  name: string,
  email: string,
  password: string,
): Promise<{ id: number; name: string; email: string; token: string }> {
  const existing = await User.findOne({ where: { email } });
  if (existing) {
    throw new ConflictError('An account with this email already exists');
  }

  const user = await User.create({ name, email, password });
  const token = signToken({ id: user.id, email: user.email });

  return { id: user.id, name: user.name, email: user.email, token };
}

export async function loginUser(
  email: string,
  password: string,
): Promise<{ id: number; name: string; email: string; token: string }> {
  const user = await User.findOne({ where: { email } });
  if (!user || !user.password) {
    throw new UnauthorizedError('Invalid email or password');
  }

  const valid = await user.validatePassword(password);
  if (!valid) {
    throw new UnauthorizedError('Invalid email or password');
  }

  const token = signToken({ id: user.id, email: user.email });

  return { id: user.id, name: user.name, email: user.email, token };
}

export async function findOrCreateFromGmail(
  gmailEmail: string,
  name: string,
): Promise<{ user: User; token: string; isNew: boolean }> {
  let isNew = false;
  let user = await User.findOne({ where: { email: gmailEmail } });

  if (!user) {
    user = await User.create({ name, email: gmailEmail });
    isNew = true;
  }

  const token = signToken({ id: user.id, email: user.email });

  return { user, token, isNew };
}

export async function getUserProfile(
  userId: number,
): Promise<{
  id: number;
  name: string;
  email: string;
  avatarUrl: string | null;
  gmailConnected: boolean;
  gmailEmail: string | null;
}> {
  const user = await User.findByPk(userId, {
    include: [{ model: GmailToken }],
  });

  if (!user) {
    throw new NotFoundError('User not found');
  }

  const gmailToken = (user as any).GmailToken as GmailToken | null;

  const accounts = await EmailAccount.findAll({
    where: { userId },
    attributes: ['id', 'provider', 'email', 'displayName', 'isActive', 'syncStatus', 'lastSyncAt'],
    order: [['createdAt', 'ASC']],
  });

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    avatarUrl: user.avatarUrl || null,
    gmailConnected: !!gmailToken,
    gmailEmail: gmailToken?.gmailEmail ?? null,
    accounts,
  };
}

export async function updateAvatar(userId: number, avatarUrl: string): Promise<{ avatarUrl: string }> {
  const user = await User.findByPk(userId);
  if (!user) throw new NotFoundError('User not found');
  await user.update({ avatarUrl });
  return { avatarUrl };
}
