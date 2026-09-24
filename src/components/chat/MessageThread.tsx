"use client";

import { useRef, useState, type ReactNode } from "react";
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
// Her kategoride tam 24 emoji var (6 sütun x 4 satır ile tam sığıyor).
const EMOJI_CATEGORIES: EmojiCategory[] = [
    {
        key: "pets", label: "Petler", icon: "🐾",
        emojis: ["🐶", "🐱", "🐭", "🐹", "🐰", "🦊", "🐻", "🐼", "🐨", "🐯", "🦁", "🐮", "🐷", "🐸", "🐵", "🙈", "🙉", "🙊", "🐔", "🐧", "🐦", "🐤", "🐺", "🐴"],
    },
    {
        key: "faces", label: "Yüzler", icon: "😀",
        emojis: ["😀", "😂", "😍", "😊", "😉", "😢", "😮", "😡", "🥰", "😘", "😎", "🤔", "😴", "🥳", "😱", "🙄", "😅", "😇", "🤗", "🤩", "😋", "🥺", "😭", "🤯"],
    },
    {
        key: "hearts", label: "Kalpler", icon: "❤️",
        emojis: ["❤️", "🧡", "💛", "💚", "💙", "💜", "🖤", "🤍", "🤎", "💔", "❤️‍🔥", "❤️‍🩹", "💕", "💞", "💓", "💗", "💖", "💘", "💝", "💟", "♥️", "✨", "🌹", "💐"],
    },
    {
        key: "gestures", label: "Eller", icon: "👍",
        emojis: ["👍", "👎", "👏", "🙌", "🙏", "👋", "🤝", "💪", "✌️", "🤞", "🤟", "🤘", "👌", "🤙", "👈", "👉", "👆", "👇", "☝️", "✊", "👊", "🤛", "🤜", "🖐️"],
    },
    {
        key: "symbols", label: "Semboller", icon: "🔥",
        emojis: ["🔥", "🎉", "🎊", "✅", "❌", "⭐", "🌟", "💥", "💫", "🎁", "🎈", "🎀", "🏆", "🥇", "🎯", "📷", "📸", "🎵", "🎶", "💬", "💭", "⏰", "🔔", "📍"],
    },
];

interface ChatComposerProps {
    onSend: (text: string, attachmentUrl?: string) => Promise<void> | void;
    uploadImage: (file: File) => Promise<string>;
    sending?: boolean;
    placeholder?: string;
    // Kullanıcı her karakter yazdığında çağrılır (ör. "yazıyor..." sinyali göndermek için).
    onTyping?: () => void;
}

// Metin + emoji + fotoğraf gönderebilen, ortak mesaj yazma kutusu.
export function ChatComposer({ onSend, uploadImage, sending, placeholder = "Mesajınızı yazın...", onTyping }: ChatComposerProps) {
    const [text, setText] = useState("");
    const [emojiOpen, setEmojiOpen] = useState(false);
    const [emojiCategory, setEmojiCategory] = useState(EMOJI_CATEGORIES[0].key);
    const [pendingFile, setPendingFile] = useState<File | null>(null);
    const [pendingPreview, setPendingPreview] = useState<string | null>(null);
    const [uploading, setUploading] = useState(false);
    const [sendError, setSendError] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const activeCategory = EMOJI_CATEGORIES.find((c) => c.key === emojiCategory) ?? EMOJI_CATEGORIES[0];

    const clearPendingImage = () => {
        if (pendingPreview) URL.revokeObjectURL(pendingPreview);
        setPendingFile(null);
        setPendingPreview(null);
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        e.target.value = "";
        if (!file) return;
        if (!file.type.startsWith("image/")) {
            window.alert("Sadece resim dosyası seçebilirsin.");
            return;
        }
        if (pendingPreview) URL.revokeObjectURL(pendingPreview);
        setPendingFile(file);
        setPendingPreview(URL.createObjectURL(file));
    };

    const handleSend = async () => {
        if (sending || uploading) return;
        if (!text.trim() && !pendingFile) return;

        try {
            let attachmentUrl: string | undefined;
            if (pendingFile) {
                setUploading(true);
                attachmentUrl = await uploadImage(pendingFile);
            }
            await onSend(text.trim(), attachmentUrl);
            setText("");
            clearPendingImage();
            setSendError(false);
        } catch (err) {
            console.error("Chat composer send error:", err);
            setSendError(true);
        } finally {
            setUploading(false);
        }
    };

    const canSend = (text.trim() || pendingFile) && !sending && !uploading;

    return (
        <div>
            {pendingPreview && (
                <div className="relative inline-block mb-2 ml-2">
                    <img
                        src={pendingPreview}
                        alt="Seçilen fotoğraf"
                        className="h-16 w-16 rounded-xl object-cover border border-card-border"
                    />
                    <button
                        type="button"
                        onClick={clearPendingImage}
                        className="absolute -top-1.5 -right-1.5 bg-zinc-900 text-white rounded-full w-5 h-5 flex items-center justify-center shadow-md"
                        aria-label="Fotoğrafı kaldır"
                    >
                        <X className="w-3 h-3" />
                    </button>
                </div>
            )}
            {sendError && (
                <div className="flex items-center justify-between gap-2 mb-1.5 ml-1 px-3 py-1.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-xs">
                    <span className="font-medium">Mesaj gönderilemedi.</span>
                    <button
                        type="button"
                        onClick={handleSend}
                        className="font-bold underline underline-offset-2 shrink-0"
                    >
                        Tekrar dene
                    </button>
                </div>
            )}
            {/* Tek parça, bütün gibi davranan kapsül: ikonlar, yazı alanı ve gönder butonu aynı zemin içinde */}
            <div className="flex items-end gap-1 bg-black/5 dark:bg-white/5 border border-card-border rounded-[1.75rem] p-1.5 focus-within:border-accent/50 transition-colors">
                <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                />
                <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="p-2.5 rounded-full text-zinc-400 hover:text-foreground hover:bg-black/5 dark:hover:bg-white/10 transition-colors shrink-0"
                    aria-label="Fotoğraf ekle"
                >
                    <ImageIcon className="w-5 h-5" />
                </button>
                <div className="relative shrink-0">
                    <button
                        type="button"
                        onClick={() => setEmojiOpen((v) => !v)}
                        className={cn(
                            "p-2.5 rounded-full transition-colors",
                            emojiOpen ? "text-accent bg-accent/10" : "text-zinc-400 hover:text-foreground hover:bg-black/5 dark:hover:bg-white/10"
                        )}
                        aria-label="Emoji ekle"
                    >
                        <Smile className="w-5 h-5" />
                    </button>
                    {emojiOpen && (
                        <>
                            <div className="fixed inset-0 z-10" onClick={() => setEmojiOpen(false)} />
                            <div className="absolute bottom-full left-0 mb-3 bg-card border border-card-border rounded-2xl shadow-xl overflow-hidden z-20 w-64">
                                <div className="flex items-center gap-0.5 px-1.5 pt-1.5 pb-1 border-b border-card-border">
                                    {EMOJI_CATEGORIES.map((cat) => (
                                        <button
                                            key={cat.key}
                                            type="button"
                                            onClick={() => setEmojiCategory(cat.key)}
                                            className={cn(
                                                "flex-1 text-base py-1.5 rounded-lg transition-colors",
                                                emojiCategory === cat.key ? "bg-accent/15" : "hover:bg-black/5 dark:hover:bg-white/10 opacity-60"
                                            )}
                                            aria-label={cat.label}
                                            title={cat.label}
                                        >
                                            {cat.icon}
                                        </button>
                                    ))}
                                </div>
                                <div className="grid grid-cols-6 gap-1 p-2">
                                    {activeCategory.emojis.map((emoji, i) => (
                                        <button
                                            key={`${activeCategory.key}-${i}`}
                                            type="button"
                                            onClick={() => {
                                                setText((t) => t + emoji);
                                                setEmojiOpen(false);
                                            }}
                                            className="text-xl hover:bg-black/5 dark:hover:bg-white/10 rounded-lg p-1"
                                        >
                                            {emoji}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </>
                    )}
                </div>
                <textarea
                    value={text}
                    onChange={(e) => {
                        setText(e.target.value);
                        setSendError(false);
                        onTyping?.();
                    }}
                    onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                            e.preventDefault();
                            handleSend();
                        }
                    }}
                    placeholder={placeholder}
                    rows={1}
                    className="flex-1 min-w-0 bg-transparent border-none resize-none py-2.5 px-1 text-sm leading-tight max-h-24 focus:outline-none focus:ring-0 text-foreground placeholder:text-secondary"
                />
                <button
                    type="button"
                    onClick={handleSend}
                    disabled={!canSend}
                    className={cn(
                        "w-10 h-10 rounded-full flex items-center justify-center shrink-0 transition-all",
                        canSend ? "bg-accent text-white hover:opacity-90 active:scale-95" : "bg-black/10 dark:bg-white/10 text-zinc-400 cursor-not-allowed"
                    )}
                    aria-label="Gönder"
                >
                    {uploading ? (
                        <span className="w-4 h-4 rounded-full border-2 border-current/30 border-t-current animate-spin" />
                    ) : (
                        <Send className="w-4 h-4" />
                    )}
                </button>
            </div>
        </div>
    );
}
