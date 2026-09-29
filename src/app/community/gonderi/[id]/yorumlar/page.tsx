'use client';

// Referans Ekran 8 — Yorumlar ve yanıtlar (tek seviye).

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { HealthHeader, LoadingBlocks } from '@/components/health/HealthUI';
import { Avatar, Caption } from '@/components/social/SocialUI';
import { CommentThread, useComments } from '@/components/social/CommentThread';
import { socialService, timeAgo, type SocialPost } from '@/services/socialService';

export default function CommentsPage() {
    const { id } = useParams<{ id: string }>();
    const [post, setPost] = useState<SocialPost | null | undefined>(undefined);
    const { comments, reload } = useComments(id);
    useEffect(() => { socialService.post(id).then(setPost).catch(() => setPost(null)); }, [id]);

    if (post === undefined) return <main className="max-w-2xl mx-auto px-4 pt-16"><LoadingBlocks count={3} /></main>;
    if (!post) {
        return (
            <main className="max-w-2xl mx-auto px-4 pt-16 text-center space-y-3">
                <h1 className="text-lg font-black">Gönderi bulunamadı</h1>
                <Link href="/community" className="inline-flex h-11 px-5 items-center rounded-2xl bg-accent text-white font-black text-sm">Keşfet'e dön</Link>
            </main>
        );
    }
    return (
        <>
            <HealthHeader title="Yorumlar" backHref={`/community/gonderi/${id}`} />
            <main className="max-w-2xl mx-auto px-4 pb-44 space-y-4">
                <Link href={`/community/gonderi/${id}`} className="flex gap-3 pb-3 border-b border-card-border">
                    <Avatar src={post.author.avatar} name={post.author.name} className="w-9 h-9" />
                    <div className="flex-1 min-w-0">
                        <div className="text-[13px] font-black">{post.author.username || post.author.name} <span className="font-semibold text-secondary text-[11px]">{timeAgo(post.createdAt)}</span></div>
                        <Caption text={post.content} />
                    </div>
                    {post.media[0] && !post.isVideo && <img src={post.media[0]} alt="" className="w-12 h-12 rounded-lg object-cover shrink-0" />}
                </Link>
                <CommentThread post={post} comments={comments} reload={reload} />
            </main>
        </>
    );
}
