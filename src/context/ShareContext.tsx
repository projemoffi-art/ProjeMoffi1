'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';

export interface ShareData {
    title?: string;
    text?: string;
    url?: string;
}

interface ShareContextType {
    openShare: (data: ShareData) => void;
    closeShare: () => void;
    shareData: ShareData | null;
    isShareOpen: boolean;
}

const ShareContext = createContext<ShareContextType | undefined>(undefined);

export function ShareProvider({ children }: { children: ReactNode }) {
    const [isShareOpen, setIsShareOpen] = useState(false);
    const [shareData, setShareData] = useState<ShareData | null>(null);

    const openShare = async (data: ShareData) => {
        try {
            const shareUrl = data.url || (typeof window !== 'undefined' ? window.location.href : '');
            
            if (typeof navigator !== 'undefined' && navigator.share) {
                try {
                    await navigator.share({
                        title: data.title || 'Moffi',
                        text: data.text || '',
                        url: shareUrl,
                    });
                    return;
                } catch (err) {
                    if ((err as Error).name === 'AbortError') return;
                    console.error("Native share failed, falling back to custom modal", err);
                    alert("Native Share Hatası: " + (err as Error).message + "\nFallback'e geçiliyor.");
                }
            }
            
            setShareData({ ...data, url: shareUrl });
            setIsShareOpen(true);
        } catch (globalErr: any) {
            alert("ShareContext Hatası: " + globalErr.message);
        }
    };

    const closeShare = () => {
        setIsShareOpen(false);
        setTimeout(() => setShareData(null), 300);
    };

    return (
        <ShareContext.Provider value={{ openShare, closeShare, shareData, isShareOpen }}>
            {children}
        </ShareContext.Provider>
    );
}

export function useShare() {
    const context = useContext(ShareContext);
    if (context === undefined) {
        throw new Error('useShare must be used within a ShareProvider');
    }
    return context;
}
