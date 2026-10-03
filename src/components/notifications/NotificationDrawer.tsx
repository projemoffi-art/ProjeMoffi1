"use client";

// Uygulamanın tek bildirim ekranı (Keşfet referansı Ekran 11): Tümü / Sosyal / Kayıp / Sahiplendirme sekmeleri,
// kişi fotoğrafı, ilgili gönderi/ilan küçük resmi ve takip bildiriminde geri takip. Veri NotificationContext'ten.

import React, { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Bell, Heart, UserPlus, ShieldAlert, ShoppingBag, Trash2, CheckCircle2, Calendar, HeartHandshake, MessageCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useNotifications } from "@/context/NotificationContext";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabase";
import { cn } from "@/lib/utils";
import { timeAgo } from "@/services/socialService";
import { Avatar, FollowButton } from "@/components/social/SocialUI";
import type { Notification } from "@/types/notifications";

interface NotificationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

type Tab = 'all' | 'social' | 'lost' | 'adoption';
const TABS: { id: Tab; label: string }[] = [
  { id: 'all', label: 'Tümü' }, { id: 'social', label: 'Sosyal' }, { id: 'lost', label: 'Kayıp' }, { id: 'adoption', label: 'Sahiplendirme' },
];
const GROUP: Record<string, Tab> = {
  like: 'social', comment: 'social', follow: 'social', mention: 'social', paw: 'social', theme: 'social',
  lost: 'lost', lost_sighting: 'lost', sos: 'lost',
  adoption: 'adoption', adoption_application: 'adoption', adoption_update: 'adoption', pet_transfer: 'adoption',
};

// Bildirim → açılacak ekran
const targetOf = (n: { type: string; entity_id?: string | null; actor_id?: string | null }) =>
  n.type === 'health' ? `/health${n.entity_id ? `?pet=${n.entity_id}` : ''}`
    : n.type === 'sos' ? `/pasaport${n.entity_id ? `?pet=${n.entity_id}` : ''}`
    : ['like', 'comment', 'mention', 'paw', 'theme'].includes(n.type) && n.entity_id ? `/community/gonderi/${n.entity_id}`
    : n.type === 'follow' && n.actor_id ? `/profile/${n.actor_id}`
    : n.type === 'lost' && n.entity_id ? `/kayip/${n.entity_id}`
    : n.type === 'lost_sighting' && n.entity_id ? `/kayip/${n.entity_id}/yonet`
    : n.type === 'adoption' && n.entity_id ? `/sahiplendirme/${n.entity_id}`
    : n.type === 'adoption_application' && n.entity_id ? `/sahiplendirme/basvuru/${n.entity_id}`
    : n.type === 'adoption_update' || n.type === 'pet_transfer' ? '/sahiplendirme/basvurularim'
    : n.type === 'appointment' ? '/vet?view=appointments'
    : n.type === 'staff_invitation' && n.entity_id ? `/invitation/${n.entity_id}`
    : n.type === 'admin_business' ? '/admin/businesses'
    : ['team_invite', 'challenge_invite', 'challenge_finished'].includes(n.type) ? '/quests/birlikte' : null;

function TypeBadge({ type }: { type: string }) {
  const icon = type === 'like' ? <Heart className="w-3 h-3 fill-current" />
    : type === 'paw' || type === 'theme' ? <span className="text-[10px] leading-none" aria-hidden>{type === 'paw' ? '🐾' : '#'}</span>
    : type === 'comment' || type === 'mention' ? <MessageCircle className="w-3 h-3" />
    : type === 'follow' ? <UserPlus className="w-3 h-3" />
    : GROUP[type] === 'lost' ? <ShieldAlert className="w-3 h-3" />
    : GROUP[type] === 'adoption' ? <HeartHandshake className="w-3 h-3" />
    : type === 'appointment' ? <Calendar className="w-3 h-3" />
    : type === 'order' ? <ShoppingBag className="w-3 h-3" />
    : <Bell className="w-3 h-3" />;
  const tone = GROUP[type] === 'lost' ? 'bg-red-600' : GROUP[type] === 'adoption' ? 'bg-emerald-600' : 'bg-accent';
  return <span className={cn('absolute -bottom-0.5 -right-0.5 w-5 h-5 rounded-full text-white border-2 border-background flex items-center justify-center', tone)}>{icon}</span>;
}

export function NotificationDrawer({ isOpen, onClose }: NotificationDrawerProps) {
  const { notifications, unreadCount, markAsRead, markAllAsRead, deleteNotification, isLoading } = useNotifications();
  const { user } = useAuth();
  const router = useRouter();
  const [tab, setTab] = useState<Tab>('all');
  const [actors, setActors] = useState<Record<string, { name: string; avatar: string | null }>>({});
  const [thumbs, setThumbs] = useState<Record<string, string>>({});
  const [following, setFollowing] = useState<Set<string>>(new Set());

  const shown = useMemo(() => (tab === 'all' ? notifications : notifications.filter(n => GROUP[n.type] === tab)), [notifications, tab]);

  // Görünen bildirimlerin kişi fotoğrafları, küçük resimleri ve takip durumu (tek seferde)
  useEffect(() => {
    if (!isOpen || notifications.length === 0) return;
    const list = notifications.slice(0, 60);
    const ids = (xs: (string | null | undefined)[]) => xs.filter((x): x is string => !!x);
    const actorIds = Array.from(new Set(ids(list.map(n => n.actor_id))));
    const postIds = ids(list.filter(n => ['like', 'comment', 'mention', 'paw', 'theme'].includes(n.type)).map(n => n.entity_id));
    const lostIds = ids(list.filter(n => n.type === 'lost' || n.type === 'lost_sighting').map(n => n.entity_id));
    const adoptIds = ids(list.filter(n => n.type === 'adoption').map(n => n.entity_id));
    const uuid = (x: string) => /^[0-9a-f-]{36}$/i.test(x);
    type Person = { id: string; full_name: string | null; username: string | null; avatar_url: string | null; role: string | null; business_name: string | null };
    type Thumb = { id: string; url: string | null };
    const none = <T,>(): Promise<{ data: T[] | null }> => Promise.resolve({ data: [] });
    (async () => {
      const [pc, posts, lost, adopt, fol] = await Promise.all([
        actorIds.length ? supabase.from('profile_cards').select('id, full_name, username, avatar_url, role, business_name').in('id', actorIds).then(r => ({ data: r.data as Person[] | null })) : none<Person>(),
        postIds.length ? supabase.from('posts').select('id, url:media_url').in('id', postIds.filter(uuid)).then(r => ({ data: r.data as Thumb[] | null })) : none<Thumb>(),
        lostIds.length ? supabase.from('lost_pet_cards').select('id, url:img_url').in('id', lostIds.filter(uuid)).then(r => ({ data: r.data as Thumb[] | null })) : none<Thumb>(),
        adoptIds.length ? supabase.from('adoption_cards').select('id, url:img_url').in('id', adoptIds.filter(uuid)).then(r => ({ data: r.data as Thumb[] | null })) : none<Thumb>(),
        user && actorIds.length ? supabase.from('follows').select('following_id').eq('follower_id', user.id).in('following_id', actorIds).then(r => ({ data: r.data as { following_id: string }[] | null })) : none<{ following_id: string }>(),
      ]);
      const a: Record<string, { name: string; avatar: string | null }> = {};
      (pc.data || []).forEach(p => { a[p.id] = { name: (p.role === 'business' && p.business_name) || p.full_name || p.username || 'Moffi üyesi', avatar: p.avatar_url }; });
      const t: Record<string, string> = {};
      [...(posts.data || []), ...(lost.data || []), ...(adopt.data || [])].forEach(x => { if (x.url) t[x.id] = x.url; });
      setActors(a); setThumbs(t); setFollowing(new Set((fol.data || []).map(f => f.following_id)));
    })().catch(() => {});
  }, [isOpen, notifications, user]);

  const open = (n: Notification) => {
    const target = targetOf(n);
    if (!n.is_read) markAsRead(n.id);
    if (!target) return;
    onClose();
    router.push(target);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[6000]" />
          <motion.div initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ type: "spring", damping: 28, stiffness: 240 }}
            className="theme-vet fixed right-0 top-0 bottom-0 w-full max-w-md bg-background text-foreground border-l border-card-border z-[6001] flex flex-col"
            role="dialog" aria-label="Bildirimler">
            <div className="px-4 pt-[calc(14px+env(safe-area-inset-top,0px))] pb-3 space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-black flex items-center gap-2">
                  Bildirimler
                  {unreadCount > 0 && <span className="min-w-5 h-5 px-1.5 rounded-full bg-accent text-white text-[11px] font-black flex items-center justify-center">{unreadCount}</span>}
                </h2>
                <div className="flex items-center gap-2">
                  {unreadCount > 0 && (
                    <button onClick={() => markAllAsRead()} className="h-9 px-3 rounded-full bg-card border border-card-border text-xs font-black inline-flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Tümünü okundu yap
                    </button>
                  )}
                  <button onClick={onClose} aria-label="Kapat" className="w-9 h-9 rounded-full bg-card border border-card-border flex items-center justify-center"><X className="w-4 h-4" /></button>
                </div>
              </div>
              <div className="flex gap-2 overflow-x-auto no-scrollbar">
                {TABS.map(t => (
                  <button key={t.id} onClick={() => setTab(t.id)}
                    className={cn('h-9 px-4 rounded-full text-xs font-black whitespace-nowrap shrink-0', tab === t.id ? 'bg-accent text-white' : 'bg-card border border-card-border text-secondary')}>{t.label}</button>
                ))}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-4 pb-8">
              {isLoading ? (
                <div className="space-y-3">{[0, 1, 2].map(i => <div key={i} className="h-16 rounded-2xl bg-card border border-card-border animate-pulse" />)}</div>
              ) : shown.length === 0 ? (
                <div className="text-center py-16 space-y-1">
                  <Bell className="w-8 h-8 text-secondary mx-auto mb-2" />
                  <p className="text-base font-black">Henüz bildirim yok</p>
                  <p className="text-sm font-semibold text-secondary">Beğeniler, yorumlar ve ilan haberleri burada görünür.</p>
                </div>
              ) : (
                <div className="divide-y divide-card-border">
                  {shown.map(n => {
                    const actor = n.actor_id ? actors[n.actor_id] : null;
                    const thumb = n.entity_id ? thumbs[n.entity_id] : null;
                    return (
                      <div key={n.id} onClick={() => open(n)} className={cn('flex items-center gap-3 py-3 cursor-pointer', !n.is_read && 'bg-accent/[0.04] -mx-4 px-4')}>
                        <div className="relative shrink-0">
                          {actor ? <Avatar src={actor.avatar} name={actor.name} className="w-11 h-11" />
                            : <span className="w-11 h-11 rounded-full bg-card border border-card-border flex items-center justify-center"><Bell className="w-4 h-4 text-secondary" /></span>}
                          <TypeBadge type={n.type} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm leading-snug"><span className="font-black">{n.title}</span>{n.content && n.type !== 'like' && n.type !== 'paw' ? <span className="font-semibold text-secondary"> {n.content}</span> : null}</p>
                          <p className="text-[11px] font-semibold text-secondary mt-0.5">{timeAgo(n.created_at)}</p>
                        </div>
                        {n.type === 'follow' && n.actor_id ? (
                          <span onClick={e => e.stopPropagation()}><FollowButton userId={n.actor_id} initial={following.has(n.actor_id)} /></span>
                        ) : thumb ? (
                          <img src={thumb} alt="" className="w-11 h-11 rounded-lg object-cover shrink-0" />
                        ) : null}
                        <button onClick={e => { e.stopPropagation(); deleteNotification(n.id); }} aria-label="Bildirimi sil" className="w-7 h-7 shrink-0 flex items-center justify-center text-secondary/60">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
