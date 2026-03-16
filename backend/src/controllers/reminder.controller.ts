import { Request, Response, NextFunction } from 'express';
import * as reminderService from '../services/reminder.service';

export async function list(req: Request, res: Response, next: NextFunction) {
  try {
    const reminders = await reminderService.listReminders(req.user!.id);
    res.json({ reminders });
  } catch (err) { next(err); }
}

export async function getUnread(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await reminderService.getUnreadReminders(req.user!.id);
    res.json(result);
  } catch (err) { next(err); }
}

export async function create(req: Request, res: Response, next: NextFunction) {
  try {
    const { title, description, dueDate } = req.body;
    const reminder = await reminderService.createReminder(
      req.user!.id,
      title,
      description || null,
      new Date(dueDate),
    );
    res.status(201).json(reminder);
  } catch (err) { next(err); }
}

export async function markAsRead(req: Request, res: Response, next: NextFunction) {
  try {
    const reminder = await reminderService.markAsRead(req.user!.id, Number(req.params.id));
    res.json(reminder);
  } catch (err) { next(err); }
}

export async function markAllAsRead(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await reminderService.markAllAsRead(req.user!.id);
    res.json(result);
  } catch (err) { next(err); }
}

export async function remove(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await reminderService.deleteReminder(req.user!.id, Number(req.params.id));
    res.json(result);
  } catch (err) { next(err); }
}
