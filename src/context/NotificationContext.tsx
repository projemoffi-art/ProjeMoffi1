"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "./AuthContext";
import { Notification } from "@/types/notifications";

interface NotificationContextType {
  /** Kişisel bildirimler (işletme bildirimleri hariç). */
  notifications: Notification[];
  unreadCount: number;
  /** İşletme bildirimleri (8.54) — kişinin üyesi olduğu tüm işletmeler; panel aktif işletmeye göre süzer. */
  businessNotifications: Notification[];
  markAsRead: (id: string) => Promise<void>;
  /** Parametresiz: kişisel bildirimleri; işletme kimliğiyle: o işletmenin bildirimlerini okundu sayar. */
  markAllAsRead: (businessId?: string) => Promise<void>;
  deleteNotification: (id: string) => Promise<void>;
  isLoading: boolean;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  // Tek liste tutulur, kişisel/işletme ayrımı türetilir (iki ayrı kaynak yok).
  const [allNotifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const notifications = React.useMemo(() => allNotifications.filter(n => !n.business_id), [allNotifications]);
  const businessNotifications = React.useMemo(() => allNotifications.filter(n => !!n.business_id), [allNotifications]);
  const unreadCount = notifications.filter(n => !n.is_read).length;

  const fetchNotifications = useCallback(async () => {
    if (!user?.id) return;
    
    setIsLoading(true);
    try {
      // Kişisel ve işletme bildirimleri ayrı sayfalanır; biri diğerini 50'lik sınırdan itmesin.
      const base = () => supabase
        .from("notifications")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(50);
      const [personal, business] = await Promise.all([
        base().is("business_id", null),
        base().not("business_id", "is", null),
      ]);

      if (personal.error || business.error) {
        console.error("Error fetching notifications:", personal.error || business.error);
      } else {
        setNotifications([...(personal.data || []), ...(business.data || [])]
          .sort((a, b) => b.created_at.localeCompare(a.created_at)));
      }
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  // Ref to always call the latest fetchNotifications without stale closure
  const fetchRef = useRef<() => void>(() => {});
  const channelRef = useRef<any>(null);

  // Keep fetchRef current
  useEffect(() => {
    fetchRef.current = fetchNotifications;
  }, [fetchNotifications]);

  useEffect(() => {
    if (!user?.id) {
      setNotifications([]);
      setIsLoading(false);
      // Clean up channel when user logs out
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
      return;
    }

    fetchNotifications();

    // Clean up any existing channel before creating a new one
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }

    // Subscribe to new notifications — only recreated when user.id changes
    channelRef.current = supabase
      .channel(`notif-ctx-${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          const newNotif = payload.new as Notification;
          setNotifications(prev => [newNotif, ...prev]);
        }
      )
      .subscribe();

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [user?.id]); // ← ONLY user.id, never fetchNotifications

  const showToast = (notif: Notification) => {
    // Dispatch global toast event
    window.dispatchEvent(new CustomEvent('moffi-toast', { 
        detail: { 
            message: notif.content, 
            icon: notif.type === 'like' ? 'Heart' : 
                  notif.type === 'follow' ? 'PawPrint' : 
                  notif.type === 'shop' ? 'ShoppingBag' : 'Bell',
            color: notif.type === 'like' ? 'text-pink-500' : 
                   notif.type === 'follow' ? 'text-cyan-400' : 
                   notif.type === 'wellbeing' ? 'text-orange-500' : 'text-purple-400'
        } 
    }));
  };

  const markAsRead = useCallback(async (id: string) => {
    const { error } = await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("id", id);

    if (!error) {
      setNotifications(prev => 
        prev.map(n => n.id === id ? { ...n, is_read: true } : n)
      );
    }
  }, []);

  const markAllAsRead = useCallback(async (businessId?: string) => {
    if (!user?.id) return;
    let q = supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("user_id", user.id)
      .eq("is_read", false);
    q = businessId ? q.eq("business_id", businessId) : q.is("business_id", null);
    const { error } = await q;

    if (!error) {
      setNotifications(prev => prev.map(n =>
        (businessId ? n.business_id === businessId : !n.business_id) ? { ...n, is_read: true } : n));
    }
  }, [user?.id]);

  const deleteNotification = useCallback(async (id: string) => {
    const { error } = await supabase
      .from("notifications")
      .delete()
      .eq("id", id);

    if (!error) {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }
  }, []);

  const value = React.useMemo(() => ({
    notifications,
    unreadCount,
    businessNotifications,
    markAsRead,
    markAllAsRead, 
    deleteNotification,
    isLoading 
  }), [notifications, unreadCount, businessNotifications, isLoading, markAsRead, markAllAsRead, deleteNotification]);

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error("useNotifications must be used within a NotificationProvider");
  }
  return context;
}
