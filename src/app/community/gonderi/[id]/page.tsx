'use client';

// Referans Ekran 7 — Gönderi Detayı: gönderi, açıklama ve ilk yorumlar. Paylaşım bağlantısı giriş gerektirmez.

import React, { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { Share2 } from 'lucide-react';
import { HealthHeader, LoadingBlocks } from '@/components/health/HealthUI';
import { PostCard, sharePost } from '@/components/social/SocialUI';
import { CommentThread, useComments } from '@/components/social/CommentThread';
import { socialService, type SocialPost } from '@/services/socialService';

export default function PostDetailPage() {
    return <Suspense fallback={null}><PostDetail /></Suspense>;
}

function PostDetail() {
    const { id } = useParams<{ id: string }>();
    const router = useRouter();
    const justShared = useSearchParams().get('paylas') === '1';
    const [post, setPost] = useState<SocialPost | null | undefined>(undefined);
    const { comments, reload } = useComments(id);

    useEffect(() => { socialService.post(id).then(setPost).catch(() => setPost(null)); }, [id]);

    if (post === undefined) return <main className="max-w-2xl mx-auto px-4 pt-16"><LoadingBlocks count={3} /></main>;
    if (!post) {
        return (
            <main className="max-w-2xl mx-auto px-4 pt-16 text-center space-y-3">
                <h1 className="text-lg font-black">Gönderi bulunamadı</h1>
                <p className="text-sm font-semibold text-secondary">Gönderi silinmiş ya da görüntüleme iznin yok.</p>
                <Link href="/community" className="inline-flex h-11 px-5 items-center rounded-2xl bg-accent text-white font-black text-sm">Keşfet'e dön</Link>
            </main>
        );
    }

    return (
        <>
            <HealthHeader title="Gönderi" backHref="/community" />
            <main className="max-w-2xl mx-auto pb-44">
                {justShared && (
                    <div className="mx-4 mb-1 flex items-center gap-3 rounded-2xl border border-accent/30 bg-accent/5 p-3">
                        <span className="flex-1 text-sm font-bold">Gönderin yayında. Diğer uygulamalarda da paylaşabilirsin.</span>
                        <button onClick={() => sharePost(post)} className="h-9 px-3 rounded-xl bg-accent text-white text-xs font-black flex items-center gap-1.5"><Share2 className="w-4 h-4" /> Paylaş</button>
                    </div>
                )}
                <PostCard post={post} onChange={setPost} detail />
                <section className="px-4 pt-2 space-y-3">
                    <h2 className="text-sm font-black">Yorumlar{post.comments ? ` (${post.comments})` : ''}</h2>
                    <CommentThread post={post} comments={comments} reload={() => { reload(); socialService.post(id).then(p => p && setPost(p)); }}
                        limit={3} onOpenAll={() => router.push(`/community/gonderi/${id}/yorumlar`)} />
                </section>
            </main>
        </>
    );
}
