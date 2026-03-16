export interface Reminder {
  id: number;
  title: string;
  description: string | null;
  dueDate: string;
  isRead: boolean;
  createdAt: string;
}
