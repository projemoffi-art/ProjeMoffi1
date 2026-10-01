export type NotificationType = 'message' | 'like' | 'comment' | 'follow' | 'system' | 'wellbeing' | 'shop' | 'appointment' | 'order' | 'biz_appointment' | 'biz_order' | (string & {});

export interface Notification {
  id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  content: string;
  is_read: boolean;
  created_at: string;
  link?: string;
  /** Doluysa işletme bildirimi (8.54): işletme panelinin zilinde görünür, kişisel bildirimlerde değil. */
  business_id?: string | null;
  entity_id?: string | null;
  meta?: {
    sender_id?: string;
    sender_name?: string;
    sender_avatar?: string;
    pet_id?: string;
  };
}
