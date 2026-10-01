"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { MoreVertical, Undo2, Image as ImageIcon, Smile, Send, X } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ChatBubbleMessage {
    id: string;
    text: string;
    attachmentUrl?: string | null;
    sentByMe: boolean;
    createdAt?: string;
    deleted?: boolean;
}

// Bugünse sadece saat ("14:32"), değilse gün + saat ("17 Eyl 14:32")
export function formatBubbleTime(createdAt?: string): string {
    if (!createdAt) return "";
    const date = new Date(createdAt);
    if (isNaN(date.getTime())) return "";

    const now = new Date();
    const isToday =
        date.getFullYear() === now.getFullYear() &&
        date.getMonth() === now.getMonth() &&
        date.getDate() === now.getDate();

    const time = date.toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" });
    if (isToday) return time;

    const day = date.toLocaleDateString("tr-TR", { day: "numeric", month: "short" });
    return `${day} ${time}`;
}

interface ChatMessageBubbleProps {
    message: ChatBubbleMessage;
    onRecall?: (id: string) => void;
}

export function ChatMessageBubble({ message, onRecall }: ChatMessageBubbleProps) {
    const [menuOpen, setMenuOpen] = useState(false);
    const isMine = message.sentByMe;
    const timestamp = formatBubbleTime(message.createdAt);

    if (message.deleted) {
        return (
            <div className={cn("flex w-full", isMine ? "justify-end" : "justify-start")}>
                <div className="max-w-[75%] rounded-2xl px-4 py-2.5 text-xs italic opacity-50 border border-dashed border-card-border">
                    Bu mesaj geri alındı
                </div>
            </div>
        );
    }

    return (
        <div className={cn("flex w-full items-end gap-1 group", isMine ? "justify-end" : "justify-start")}>
            {isMine && onRecall && (
                <div className="relative opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                    <button
                        type="button"
                        onClick={() => setMenuOpen((v) => !v)}
                        className="p-1 rounded-full hover:bg-black/5 dark:hover:bg-white/10 text-zinc-400"
                        aria-label="Mesaj seçenekleri"
                    >
                        <MoreVertical className="w-4 h-4" />
                    </button>
                    {menuOpen && (
                        <>
                            <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
                            <div className="absolute bottom-full right-0 mb-1 bg-card border border-card-border rounded-xl shadow-lg overflow-hidden z-20 whitespace-nowrap">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setMenuOpen(false);
                                        onRecall(message.id);
                                    }}
                                    className="flex items-center gap-2 px-3 py-2 text-xs font-bold text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 w-full"
                                >
                                    <Undo2 className="w-3.5 h-3.5" />
                                    Mesajı geri al
                                </button>
                            </div>
                        </>
                    )}
                </div>
            )}
            <div
                className={cn(
                    "max-w-[75%] rounded-2xl px-4 py-2.5 text-sm relative shadow-sm",
                    isMine
                        ? "bg-card text-foreground border border-card-border rounded-tr-sm"
                        : "bg-zinc-900 dark:bg-zinc-700 text-white rounded-tl-sm"
                )}
            >
                {message.attachmentUrl && (
                    <a href={message.attachmentUrl} target="_blank" rel="noopener noreferrer">
                        <img
                            src={message.attachmentUrl}
                            alt="Gönderilen fotoğraf"
                            className={cn("rounded-xl max-w-full max-h-64 object-cover", message.text && "mb-2")}
                        />
                    </a>
                )}
                {message.text && <p className="whitespace-pre-wrap break-words">{message.text}</p>}
                {timestamp && (
                    <span
                        className={cn(
                            "block text-[9px] mt-1 font-bold uppercase tracking-wide text-right",
                            isMine ? "text-zinc-400" : "text-white/70"
                        )}
                    >
                        {timestamp}
                    </span>
                )}
            </div>
        </div>
    );
}

interface ChatMessageListProps {
    messages: ChatBubbleMessage[];
    onRecall?: (id: string) => void;
    emptyLabel?: string;
    emptyIcon?: ReactNode;
}

// Boş durumu da dahil, mesaj listesinin tamamını çizer.
// Sarmalayan (overflow-y-auto, padding, vs.) container'ı kullanan ekran kendi sağlar.
export function ChatMessageList({ messages, onRecall, emptyLabel = "Henüz mesaj yok", emptyIcon }: ChatMessageListProps) {
    if (messages.length === 0) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center opacity-30 text-center px-8">
                {emptyIcon}
                <p className="text-[10px] font-black uppercase tracking-widest mt-2">{emptyLabel}</p>
            </div>
        );
    }

    return (
        <>
            {messages.map((msg) => (
                <ChatMessageBubble key={msg.id} message={msg} onRecall={onRecall} />
            ))}
        </>
    );
}

interface EmojiCategory {
    key: string;
    label: string;
    icon: string;
    emojis: string[];
}

// Petler her zaman ilk kategori - Moffi bir evcil hayvan uygulaması.
const EMOJI_CATEGORIES: EmojiCategory[] = [
    {
        key: "pets", label: "Hayvanlar", icon: "🐾",
        emojis: ["🐶", "🐕", "🦮", "🐕‍🦺", "🐩", "🐺", "🐱", "🐈", "🐈‍⬛", "🦁", "🐯", "🐰", "🐇", "🐹", "🐭", "🐁", "🐀", "🐿️", "🦔", "🦊", "🐻", "🐼", "🐨", "🐮", "🐷", "🐸", "🐵", "🐔", "🐣", "🐤", "🐦", "🦜", "🐧", "🕊️", "🦆", "🦉", "🐢", "🦎", "🐍", "🐠", "🐟", "🐡", "🐴", "🦄", "🐑", "🐐", "🦙", "🐾"],
    },
    {
        key: "faces", label: "Yüzler", icon: "😀",
        emojis: ["😀", "😃", "😄", "😁", "😆", "😅", "😂", "🤣", "😊", "😇", "🙂", "😉", "😍", "🥰", "😘", "😋", "😛", "😜", "🤪", "😎", "🤩", "🥳", "😏", "🤔", "🤗", "🤭", "🫢", "😶", "😐", "🙄", "😬", "😮‍💨", "😴", "🥱", "😌", "🥺", "😢", "😭", "😤", "😡", "🤯", "😱", "😨", "😰", "🤒", "🤕", "😵‍💫", "🫠"],
    },
    {
        key: "hearts", label: "Kalpler", icon: "❤️",
        emojis: ["❤️", "🧡", "💛", "💚", "🩵", "💙", "💜", "🤎", "🖤", "🩶", "🤍", "🩷", "💔", "❤️‍🔥", "❤️‍🩹", "💕", "💞", "💓", "💗", "💖", "💘", "💝", "💟", "😻"],
    },
    {
        key: "hands", label: "Eller", icon: "👍",
        emojis: ["👍", "👎", "👏", "🙌", "🫶", "🙏", "👋", "🤝", "💪", "✌️", "🤞", "🫰", "🤟", "🤘", "👌", "🤌", "🤙", "👈", "👉", "👆", "👇", "☝️", "✊", "👊"],
    },
    {
        key: "life", label: "Gezi ve günlük", icon: "🌳",
        emojis: ["🦴", "🥩", "🍗", "🥕", "🧀", "🍪", "🎾", "⚽", "🧸", "🪀", "🛁", "🧼", "💉", "💊", "🩺", "🏥", "🌳", "🌲", "🌸", "🌻", "🍂", "❄️", "☀️", "🌧️", "🌈", "🌙", "⭐", "🏞️", "🏖️", "🚶", "🏃", "🚗"],
    },
    {
        key: "symbols", label: "Semboller", icon: "🔥",
        emojis: ["🔥", "✨", "🎉", "🎊", "🎁", "🎈", "🎂", "🏆", "🥇", "🎯", "✅", "❌", "⚠️", "❗", "❓", "💯", "💥", "💫", "📷", "📸", "🎵", "💬", "⏰", "📍"],
    },
];

const RECENT_KEY = "moffi_recent_emojis";
function readRecent(): string[] {
    try { const v = JSON.parse(localStorage.getItem(RECENT_KEY) || "[]"); return Array.isArray(v) ? v.slice(0, 24) : []; } catch { return []; }
}
function pushRecent(emoji: string) {
    try { localStorage.setItem(RECENT_KEY, JSON.stringify([emoji, ...readRecent().filter(e => e !== emoji)].slice(0, 24))); } catch { /* sadece bu oturumda */ }
}

interface ChatComposerProps {
    onSend: (text: string, attachmentUrl?: string) => Promise<void> | void;
    uploadImage: (file: File) => Promise<string>;
    sending?: boolean;
    placeholder?: string;
    // Kullanıcı her karakter yazdığında çağrılır (ör. "yazıyor..." sinyali göndermek için).
    onTyping?: () => void;
}

const MAX_IMAGE_MB = 15;

// Metin + emoji + fotoğraf gönderebilen, ortak mesaj yazma kutusu.
export function ChatComposer({ onSend, uploadImage, sending, placeholder = "Mesaj yaz…", onTyping }: ChatComposerProps) {
    const [text, setText] = useState("");
    const [emojiOpen, setEmojiOpen] = useState(false);
    const [recent, setRecent] = useState<string[]>([]);
    const [emojiCategory, setEmojiCategory] = useState<string>(EMOJI_CATEGORIES[0].key);
    const [pendingFile, setPendingFile] = useState<File | null>(null);
    const [pendingPreview, setPendingPreview] = useState<string | null>(null);
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const textRef = useRef<HTMLTextAreaElement>(null);
    const categories = recent.length ? [{ key: "recent", label: "Son kullanılanlar", icon: "🕘", emojis: recent }, ...EMOJI_CATEGORIES] : EMOJI_CATEGORIES;
    const activeCategory = categories.find((c) => c.key === emojiCategory) ?? categories[0];

    const toggleEmoji = () => {
        setEmojiOpen(v => {
            if (!v) { const r = readRecent(); setRecent(r); setEmojiCategory(r.length ? "recent" : EMOJI_CATEGORIES[0].key); }
            return !v;
        });
    };

    const insertEmoji = (emoji: string) => {
        const el = textRef.current;
        if (el && typeof el.selectionStart === "number") {
            const s = el.selectionStart, e = el.selectionEnd ?? s;
            setText(t => t.slice(0, s) + emoji + t.slice(e));
            requestAnimationFrame(() => { el.focus(); el.setSelectionRange(s + emoji.length, s + emoji.length); });
        } else setText(t => t + emoji);
        pushRecent(emoji);
        onTyping?.();
    };

    const autosize = () => {
        const el = textRef.current;
        if (!el) return;
        el.style.height = "auto";
        el.style.height = `${Math.min(el.scrollHeight, 128)}px`;
    };
    useEffect(autosize, [text]);

    const clearPendingImage = () => {
        if (pendingPreview) URL.revokeObjectURL(pendingPreview);
        setPendingFile(null);
        setPendingPreview(null);
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        e.target.value = "";
        if (!file) return;
        if (!file.type.startsWith("image/")) { setError("Sadece fotoğraf gönderebilirsin."); return; }
        if (file.size > MAX_IMAGE_MB * 1024 * 1024) { setError(`Fotoğraf en fazla ${MAX_IMAGE_MB} MB olabilir.`); return; }
        setError(null);
        if (pendingPreview) URL.revokeObjectURL(pendingPreview);
        setPendingFile(file);
        setPendingPreview(URL.createObjectURL(file));
    };

    const handleSend = async () => {
        if (sending || uploading) return;
        if (!text.trim() && !pendingFile) return;
        const draft = text;
        try {
            let attachmentUrl: string | undefined;
            if (pendingFile) {
                setUploading(true);
                attachmentUrl = await uploadImage(pendingFile);
            }
            setText("");
            clearPendingImage();
            setEmojiOpen(false);
            setError(null);
            await onSend(draft.trim(), attachmentUrl);
        } catch (err) {
            console.error("Chat composer send error:", err);
            if (pendingFile) setError("Fotoğraf yüklenemedi, tekrar dene.");
        } finally {
            setUploading(false);
        }
    };

    const canSend = (text.trim() || pendingFile) && !sending && !uploading;

    return (
        <div className="space-y-2">
            {emojiOpen && (
                <div className="rounded-2xl border border-card-border bg-card overflow-hidden">
                    <div className="flex gap-0.5 px-1.5 pt-1.5 pb-1 border-b border-card-border overflow-x-auto no-scrollbar">
                        {categories.map((cat) => (
                            <button key={cat.key} type="button" onClick={() => setEmojiCategory(cat.key)} aria-label={cat.label} title={cat.label}
                                className={cn("shrink-0 w-10 text-lg py-1.5 rounded-lg transition-colors", emojiCategory === cat.key ? "bg-accent/15" : "opacity-60")}>
                                {cat.icon}
                            </button>
                        ))}
                    </div>
                    <div className="text-[11px] font-bold text-secondary px-3 pt-2">{activeCategory.label}</div>
                    <div className="grid grid-cols-8 gap-0.5 p-1.5 max-h-48 overflow-y-auto">
                        {activeCategory.emojis.map((emoji, i) => (
                            <button key={`${activeCategory.key}-${i}`} type="button" onClick={() => insertEmoji(emoji)}
                                className="text-2xl leading-none aspect-square rounded-lg active:scale-90 transition-transform hover:bg-black/5 dark:hover:bg-white/10">
                                {emoji}
                            </button>
                        ))}
                    </div>
                </div>
            )}
            {pendingPreview && (
                <div className="relative inline-block ml-1">
                    <img src={pendingPreview} alt="Seçilen fotoğraf" className="h-20 w-20 rounded-xl object-cover border border-card-border" />
                    <button type="button" onClick={clearPendingImage} aria-label="Fotoğrafı kaldır"
                        className="absolute -top-1.5 -right-1.5 bg-foreground text-background rounded-full w-6 h-6 flex items-center justify-center shadow-md">
                        <X className="w-3.5 h-3.5" />
                    </button>
                </div>
            )}
            {error && <div className="px-3 py-1.5 rounded-xl bg-red-500/10 text-red-600 text-xs font-bold">{error}</div>}
            <div className="flex items-end gap-1 bg-card border border-card-border rounded-[1.6rem] p-1 focus-within:border-accent/60 transition-colors">
                <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
                <button type="button" onClick={() => fileInputRef.current?.click()} aria-label="Fotoğraf ekle"
                    className="w-10 h-10 rounded-full text-secondary flex items-center justify-center shrink-0 active:scale-90 transition-transform">
                    <ImageIcon className="w-5 h-5" />
                </button>
                <button type="button" onClick={toggleEmoji} aria-label="Emoji ekle" aria-pressed={emojiOpen}
                    className={cn("w-10 h-10 rounded-full flex items-center justify-center shrink-0 active:scale-90 transition-transform", emojiOpen ? "text-accent bg-accent/10" : "text-secondary")}>
                    <Smile className="w-5 h-5" />
                </button>
                <textarea
                    ref={textRef}
                    value={text}
                    maxLength={2000}
                    onChange={(e) => { setText(e.target.value); setError(null); onTyping?.(); }}
                    onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                    placeholder={placeholder}
                    rows={1}
                    className="flex-1 min-w-0 bg-transparent border-none resize-none py-2.5 px-1 text-[15px] leading-snug focus:outline-none text-foreground placeholder:text-secondary"
                />
                <button type="button" onClick={handleSend} disabled={!canSend} aria-label="Gönder"
                    className={cn("w-10 h-10 rounded-full flex items-center justify-center shrink-0 transition-all",
                        canSend ? "bg-accent text-white active:scale-90" : "bg-card-border/60 text-secondary")}>
                    {uploading ? <span className="w-4 h-4 rounded-full border-2 border-current/30 border-t-current animate-spin" /> : <Send className="w-4 h-4" />}
                </button>
            </div>
        </div>
    );
}
