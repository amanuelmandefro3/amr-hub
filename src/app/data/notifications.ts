export type NotificationType =
  | "ISSUE_ASSIGNED"
  | "ISSUE_STATUS_CHANGED"
  | "ISSUE_COMMENTED";

export type Notification = {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  isRead: boolean;
  issueId: string | null;
  projectId: string | null;
  createdAt: string;
};

export type NotificationListResponse = {
  notifications: Notification[];
  unreadCount: number;
  nextCursor: string | null;
};
