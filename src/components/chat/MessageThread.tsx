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

const QUICK_EMOJIS = [
    "😀", "😂", "😍", "😊", "😉", "😢", "😮", "😡", "👍", "👎", "🙏", "👏",
    "❤️", "🔥", "🎉", "✅", "❌", "🐶", "🐱", "🐾", "📷", "⏰", "💬", "🤔",
];

interface ChatComposerProps {
    onSend: (text: string, attachmentUrl?: string) => Promise<void> | void;
    uploadImage: (file: File) => Promise<string>;
    sending?: boolean;
    placeholder?: string;
}

// Metin + emoji + fotoğraf gönderebilen, ortak mesaj yazma kutusu.
export function ChatComposer({ onSend, uploadImage, sending, placeholder = "Mesajınızı yazın..." }: ChatComposerProps) {
    const [text, setText] = useState("");
    const [emojiOpen, setEmojiOpen] = useState(false);
    const [pendingFile, setPendingFile] = useState<File | null>(null);
    const [pendingPreview, setPendingPreview] = useState<string | null>(null);
    const [uploading, setUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

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
        } catch (err) {
            console.error("Chat composer send error:", err);
        } finally {
            setUploading(false);
        }
    };

    return (
        <div>
            {pendingPreview && (
                <div className="relative inline-block mb-2 ml-1">
                    <img
                        src={pendingPreview}
                        alt="Seçilen fotoğraf"
                        className="h-16 w-16 rounded-xl object-cover border border-card-border"
                    />
                    <button
                        type="button"
                        onClick={clearPendingImage}
                        className="absolute -top-1.5 -right-1.5 bg-zinc-900 text-white rounded-full w-5 h-5 flex items-center justify-center"
                        aria-label="Fotoğrafı kaldır"
                    >
                        <X className="w-3 h-3" />
                    </button>
                </div>
            )}
            <div className="flex items-center gap-1.5">
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
                    className="p-2.5 rounded-full text-zinc-400 hover:text-foreground hover:bg-black/5 dark:hover:bg-white/10 shrink-0"
                    aria-label="Fotoğraf ekle"
                >
                    <ImageIcon className="w-5 h-5" />
                </button>
                <div className="relative shrink-0">
                    <button
                        type="button"
                        onClick={() => setEmojiOpen((v) => !v)}
                        className="p-2.5 rounded-full text-zinc-400 hover:text-foreground hover:bg-black/5 dark:hover:bg-white/10"
                        aria-label="Emoji ekle"
                    >
                        <Smile className="w-5 h-5" />
                    </button>
                    {emojiOpen && (
                        <>
                            <div className="fixed inset-0 z-10" onClick={() => setEmojiOpen(false)} />
                            <div className="absolute bottom-full left-0 mb-2 bg-card border border-card-border rounded-2xl shadow-lg p-2 grid grid-cols-6 gap-1 z-20 w-56">
                                {QUICK_EMOJIS.map((emoji) => (
                                    <button
                                        key={emoji}
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
                        </>
                    )}
                </div>
                <input
                    type="text"
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key === "Enter") handleSend();
                    }}
                    placeholder={placeholder}
                    className="flex-1 min-w-0 bg-transparent border border-card-border rounded-full px-4 py-2.5 text-sm focus:outline-none focus:border-accent transition-colors text-foreground"
                />
                <button
                    type="button"
                    onClick={handleSend}
                    disabled={(!text.trim() && !pendingFile) || sending || uploading}
                    className="bg-accent text-white w-10 h-10 rounded-full hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center shrink-0"
                    aria-label="Gönder"
                >
                    <Send className="w-4 h-4" />
                </button>
            </div>
        </div>
    );
}
