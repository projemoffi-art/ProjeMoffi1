"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  X, Bell, Heart, UserPlus, ShieldAlert, 
  ShoppingBag, Sparkles, Trash2, CheckCircle2 
} from "lucide-react";
import { useNotifications } from "@/context/NotificationContext";
import { cn } from "@/lib/utils";
import { formatRelativeTime } from "@/lib/dateUtils";
import { useTranslation } from "@/context/LanguageContext";

import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabase";

interface NotificationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export function NotificationDrawer({ isOpen, onClose }: NotificationDrawerProps) {
  const { notifications, unreadCount, markAsRead, markAllAsRead, deleteNotification, isLoading } = useNotifications();
  const { language } = useTranslation();
  const { user } = useAuth();

  const simulateNotification = async () => {
    if (!user) return;
    const types: any[] = ['like', 'follow', 'system', 'wellbeing', 'shop'];
    const type = types[Math.floor(Math.random() * types.length)];
    
    const mockNotif = {
      user_id: user.id,
      type,
      title: type === 'like' ? 'Yeni Beğeni!' : type === 'follow' ? 'Yeni Takipçi!' : 'Sistem Mesajı',
      content: type === 'like' ? 'Birisi patili dostunun fotoğrafını beğendi. 🐾' : 
               type === 'follow' ? 'Yeni birisi senin Moffi dünyana katıldı!' : 
               'Moffi Ekosistemi güncellendi, yeni özellikleri keşfet!',
      is_read: false
    };

    const { error } = await supabase.from('notifications').insert([mockNotif]);
    if (error) console.error("Sim error:", error);
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'like': return <Heart className="w-4 h-4 text-pink-500" />;
      case 'follow': return <UserPlus className="w-4 h-4 text-cyan-500" />;
      case 'system': return <Sparkles className="w-4 h-4 text-purple-500" />;
      case 'wellbeing': return <ShieldAlert className="w-4 h-4 text-orange-500" />;
      case 'shop': return <ShoppingBag className="w-4 h-4 text-green-500" />;
      default: return <Bell className="w-4 h-4 text-gray-500" />;
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-md z-[6000]"
          />

          {/* Drawer */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-[#0A0A0E] border-l border-white/10 z-[6001] flex flex-col shadow-[0_0_50px_rgba(0,0,0,0.5)]"
          >
            {/* Header */}
            <div className="p-8 border-b border-white/5 flex items-center justify-between">
              <div>
                <h2 className="text-3xl font-black text-white tracking-tighter uppercase italic flex items-center gap-3">
                  Bildirimler
                  {unreadCount > 0 && (
                    <span className="px-2 py-0.5 bg-cyan-500 text-black text-[10px] font-black rounded-full not-italic tracking-normal">
                      {unreadCount}
                    </span>
                  )}
                </h2>
                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-[0.2em] mt-2 italic">
                  Evrensel Moffi Güncellemeleri
                </p>
              </div>
              <div className="flex items-center gap-3">
                <button 
                  onClick={simulateNotification}
                  className="p-3 bg-white/5 border border-white/10 rounded-2xl text-violet-400 hover:text-white transition-all active:scale-95 group"
                  title="Test Bildirimi Gönder"
                >
                  <Sparkles className="w-5 h-5 group-hover:rotate-12 transition-transform" />
                </button>
                <button 
                  onClick={onClose}
                  className="p-3 bg-white/5 border border-white/10 rounded-2xl text-gray-500 hover:text-white transition-all active:scale-95"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Actions */}
            {notifications.length > 0 && (
              <div className="px-8 py-4 flex justify-between items-center bg-white/[0.02] border-b border-white/5">
                <button 
                  onClick={() => markAllAsRead()}
                  className="flex items-center gap-2 text-[9px] font-black text-cyan-400 uppercase tracking-widest hover:text-cyan-300 transition-colors"
                >
                  <CheckCircle2 className="w-3 h-3" />
                  Hepsini Okundu İşaretle
                </button>
              </div>
            )}

            {/* List */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4 no-scrollbar">
              {isLoading ? (
                <div className="flex flex-col items-center justify-center h-full gap-4">
                  <div className="w-10 h-10 border-2 border-cyan-500/20 border-t-cyan-500 rounded-full animate-spin" />
                  <p className="text-[10px] text-gray-600 font-black uppercase tracking-widest">Yükleniyor...</p>
                </div>
              ) : notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center p-10">
                  <div className="w-20 h-20 bg-white/5 border border-white/10 rounded-3xl flex items-center justify-center mb-6">
                    <Bell className="w-10 h-10 text-gray-700" />
                  </div>
                  <h3 className="text-xl font-black text-white uppercase italic mb-2 tracking-tight">Henüz bir şey yok</h3>
                  <p className="text-xs text-gray-500 font-bold leading-relaxed uppercase tracking-widest">
                    Moffi dünyasındaki gelişmeler burada görünecek.
                  </p>
                </div>
              ) : (
                notifications.map((notif) => (
                  <motion.div
                    key={notif.id}
                    layout
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={cn(
                      "group p-5 rounded-3xl border transition-all relative overflow-hidden",
                      notif.is_read 
                        ? "bg-white/[0.02] border-white/5 opacity-60" 
                        : "bg-white/[0.05] border-white/10 shadow-[0_4px_20px_rgba(0,0,0,0.2)]"
                    )}
                  >
                    {!notif.is_read && (
                      <div className="absolute top-0 left-0 w-1 h-full bg-cyan-500" />
                    )}

                    <div className="flex gap-4">
                      <div className={cn(
                        "w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 border",
                        notif.is_read ? "bg-white/5 border-white/5" : "bg-white/10 border-white/10"
                      )}>
                        {getIcon(notif.type)}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start mb-1">
                          <h4 className={cn(
                            "text-sm font-black uppercase italic tracking-tight truncate pr-2",
                            notif.is_read ? "text-gray-400" : "text-white"
                          )}>
                            {notif.title}
                          </h4>
                          <span className="text-[8px] font-black text-gray-600 uppercase tracking-tighter shrink-0 mt-1">
                            {formatRelativeTime(notif.created_at, language)}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 font-medium leading-relaxed">
                          {notif.content}
                        </p>
                        
                        <div className="flex items-center gap-4 mt-4 opacity-0 group-hover:opacity-100 transition-opacity">
                          {!notif.is_read && (
                            <button 
                              onClick={() => markAsRead(notif.id)}
                              className="text-[9px] font-black text-cyan-400 uppercase tracking-widest hover:text-cyan-300"
                            >
                              Okundu
                            </button>
                          )}
                          <button 
                            onClick={() => deleteNotification(notif.id)}
                            className="text-[9px] font-black text-red-400/50 uppercase tracking-widest hover:text-red-400"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))
              )}
            </div>

            {/* Footer */}
            <div className="p-8 border-t border-white/5 bg-white/[0.01]">
              <div className="flex items-center gap-4 px-6 py-4 bg-white/5 border border-white/10 rounded-2xl">
                <ShieldAlert className="w-5 h-5 text-orange-500" />
                <p className="text-[9px] text-gray-500 font-black uppercase tracking-[0.2em] leading-relaxed">
                  Güvenliğiniz için bildirim ayarlarını profilinizden yönetebilirsiniz.
                </p>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
