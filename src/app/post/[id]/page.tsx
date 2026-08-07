"use client";

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Loader2, HeartBreak } from 'lucide-react';
import { apiService } from '@/services/apiService';
import { Post } from '@/services/types';
import { ImmersivePostCard } from '@/components/community/ImmersivePostCard';

export default function PostDetailPage() {
    const params = useParams();
    const router = useRouter();
    const postId = params?.id as string;
    
    const [post, setPost] = useState<Post | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchPost = async () => {
            if (!postId) return;
            try {
                const data = await apiService.getPostById(postId);
                setPost(data);
            } catch (error) {
                console.error("Error fetching post:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchPost();
    }, [postId]);

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-[#0A0A0A] flex flex-col items-center justify-center gap-4">
                <Loader2 className="w-8 h-8 animate-spin text-cyan-500" />
                <p className="text-gray-500 dark:text-gray-400 font-medium">Gönderi yükleniyor...</p>
            </div>
        );
    }

    if (!post) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-[#0A0A0A] flex flex-col items-center justify-center gap-4 px-4 text-center">
                <div className="w-16 h-16 rounded-full bg-red-50 dark:bg-red-500/10 flex items-center justify-center">
                    <HeartBreak className="w-8 h-8 text-red-500" />
                </div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Gönderi Bulunamadı</h2>
                <p className="text-gray-500 dark:text-gray-400 text-sm max-w-sm">Bu gönderi silinmiş veya mevcut değil. Lütfen başka bir gönderiye bak.</p>
                <button 
                    onClick={() => router.back()}
                    className="mt-4 px-6 py-2.5 bg-black dark:bg-white text-white dark:text-black font-bold rounded-full hover:scale-105 active:scale-95 transition-all"
                >
                    Geri Dön
                </button>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-[#0A0A0A] pb-20 md:pb-0">
            {/* HEADER */}
            <div className="sticky top-0 z-50 bg-white/80 dark:bg-[#0A0A0A]/80 backdrop-blur-xl border-b border-gray-100 dark:border-white/5 px-4 h-16 flex items-center justify-between">
                <button 
                    onClick={() => router.back()}
                    className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                >
                    <ArrowLeft className="w-6 h-6 text-gray-900 dark:text-gray-100" />
                </button>
                <h1 className="font-bold text-lg text-gray-900 dark:text-gray-100">Gönderi</h1>
                <div className="w-10" /> {/* Spacer for centering */}
            </div>

            {/* CONTENT */}
            <div className="max-w-[500px] mx-auto pt-4 px-4 md:px-0">
                <ImmersivePostCard post={post} />
            </div>
        </div>
    );
}
