import { Op } from 'sequelize';
import { Reminder } from '../models';
import { NotFoundError } from '../utils/errors';

export async function createReminder(userId: number, title: string, description: string | null, dueDate: Date) {
  return Reminder.create({ userId, title, description, dueDate });
}

export async function listReminders(userId: number) {
  return Reminder.findAll({ where: { userId }, order: [['dueDate', 'ASC']] });
}

export async function getUnreadReminders(userId: number) {
  const reminders = await Reminder.findAll({
    where: { userId, isRead: false, dueDate: { [Op.lte]: new Date() } },
    order: [['dueDate', 'DESC']],
  });
  return { reminders, count: reminders.length };
}

export async function markAsRead(userId: number, reminderId: number) {
  const reminder = await Reminder.findOne({ where: { id: reminderId, userId } });
  if (!reminder) throw new NotFoundError('Lembrete não encontrado');
  await reminder.update({ isRead: true });
  return reminder;
}

export async function markAllAsRead(userId: number) {
  await Reminder.update({ isRead: true }, { where: { userId, isRead: false, dueDate: { [Op.lte]: new Date() } } });
  return { message: 'Todos marcados como lidos' };
}

export async function deleteReminder(userId: number, reminderId: number) {
  const reminder = await Reminder.findOne({ where: { id: reminderId, userId } });
  if (!reminder) throw new NotFoundError('Lembrete não encontrado');
  await reminder.destroy();
  return { message: 'Lembrete excluído' };
}
