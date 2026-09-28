export type NotificationType = 'message' | 'like' | 'comment' | 'follow' | 'system' | 'wellbeing' | 'shop' | 'appointment' | 'order';

export interface Notification {
  id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  content: string;
  is_read: boolean;
  created_at: string;
  link?: string;
  meta?: {
    sender_id?: string;
    sender_name?: string;
    sender_avatar?: string;
    pet_id?: string;
  };
}
