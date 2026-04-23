/**
 * MOFFI CENTRAL DATABASE TYPES
 * Bu tipler Supabase tabloları ile birebir uyumludur.
 */

export interface Profile {
  id: string;
  username: string;
  full_name: string;
  avatar_url: string;
  cover_url?: string;
  bio?: string;
  location?: string;
  website?: string;
  is_premium?: boolean;
  aura_preset?: 'elite' | 'zen' | 'cyber' | 'nature' | 'midnight';
  aura_frame_enabled?: boolean;
  followers_count: number;
  following_count: number;
  posts_count: number;
  created_at?: string;
}

export interface Pet {
  id: string;
  owner_id: string;
  name: string;
  type: 'dog' | 'cat' | 'bird' | 'other';
  breed: string;
  birth_date?: string;
  gender?: string;
  weight?: string;
  blood_type?: string;
  microchip_id?: string;
  avatar_url?: string;
  is_lost: boolean;
  created_at?: string;
}

export interface Post {
  id: string;
  user_id: string;
  author_name: string;
  author_avatar: string;
  media_url: string;
  caption: string;
  likes_count: number;
  comments_count: number;
  is_liked?: boolean;
  created_at: string;
}

export interface Follow {
  follower_id: string;
  following_id: string;
  created_at: string;
}
