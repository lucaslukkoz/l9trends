import { Op, fn, col, literal } from 'sequelize';
import { getAccountForUser } from './account.service';
import Email from '../models/Email';

export async function getEmailMetrics(userId: number, accountId: number) {
  const account = await getAccountForUser(userId, accountId);
  const aid = account.id;

  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const weekStart = new Date(todayStart);
  weekStart.setDate(weekStart.getDate() - weekStart.getDay()); // Start of week (Sunday)

  const [
    emailsSentToday,
    emailsSentThisWeek,
    emailsReceivedToday,
    emailsReceivedThisWeek,
    unreadCount,
  ] = await Promise.all([
    Email.count({ where: { accountId: aid, folder: 'sent', date: { [Op.gte]: todayStart } } }),
    Email.count({ where: { accountId: aid, folder: 'sent', date: { [Op.gte]: weekStart } } }),
    Email.count({ where: { accountId: aid, folder: 'inbox', isTrashed: false, date: { [Op.gte]: todayStart } } }),
    Email.count({ where: { accountId: aid, folder: 'inbox', isTrashed: false, date: { [Op.gte]: weekStart } } }),
    Email.count({ where: { accountId: aid, folder: 'inbox', isRead: false, isTrashed: false } }),
  ]);

  // Emails by day of week (last 30 days)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const sentByDay = await Email.findAll({
    where: { accountId: aid, folder: 'sent', date: { [Op.gte]: thirtyDaysAgo } },
    attributes: [
      [fn('DATE', col('date')), 'day'],
      [fn('COUNT', col('id')), 'count'],
    ],
    group: [fn('DATE', col('date'))],
    raw: true,
  }) as unknown as { day: string; count: number }[];

  const receivedByDay = await Email.findAll({
    where: { accountId: aid, folder: 'inbox', isTrashed: false, date: { [Op.gte]: thirtyDaysAgo } },
    attributes: [
      [fn('DATE', col('date')), 'day'],
      [fn('COUNT', col('id')), 'count'],
    ],
    group: [fn('DATE', col('date'))],
    raw: true,
  }) as unknown as { day: string; count: number }[];

  // Build last 7 days chart data
  const emailsByDay: { day: string; sent: number; received: number }[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const dayStr = d.toISOString().split('T')[0];
    const dayLabel = d.toLocaleDateString('pt-BR', { weekday: 'short' });
    const sent = sentByDay.find((r) => r.day === dayStr);
    const received = receivedByDay.find((r) => r.day === dayStr);
    emailsByDay.push({
      day: dayLabel,
      sent: sent ? Number(sent.count) : 0,
      received: received ? Number(received.count) : 0,
    });
  }

  // Top senders (last 30 days)
  const topSendersRaw = await Email.findAll({
    where: { accountId: aid, folder: 'inbox', isTrashed: false, date: { [Op.gte]: thirtyDaysAgo } },
    attributes: [
      'fromAddress',
      [fn('COUNT', col('id')), 'count'],
    ],
    group: ['fromAddress'],
    order: [[literal('count'), 'DESC']],
    limit: 5,
    raw: true,
  }) as unknown as { fromAddress: string; count: number }[];

  const topSenders = topSendersRaw.map((r) => ({
    email: r.fromAddress,
    count: Number(r.count),
  }));

  // Average response time (simple approach: match sent emails that have inReplyTo with received emails by threadId)
  // For now, return null as this requires complex thread matching
  const averageResponseTimeMinutes: number | null = null;

  return {
    emailsSentToday,
    emailsSentThisWeek,
    emailsReceivedToday,
    emailsReceivedThisWeek,
    unreadCount,
    averageResponseTimeMinutes,
    emailsByDay,
    topSenders,
  };
}
