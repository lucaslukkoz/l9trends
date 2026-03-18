export interface EmailMetrics {
  emailsSentToday: number;
  emailsSentThisWeek: number;
  emailsReceivedToday: number;
  emailsReceivedThisWeek: number;
  unreadCount: number;
  averageResponseTimeMinutes: number | null;
  emailsByDay: { day: string; sent: number; received: number }[];
  topSenders: { email: string; count: number }[];
}
