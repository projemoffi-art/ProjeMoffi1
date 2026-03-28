"use client";

import { Heart, MessageCircle, Share2, MoreHorizontal, Sparkles, MapPin } from "lucide-react";
import Image from "next/image";
import { useState } from "react";

interface PostProps {
    user: {
        name: string;
        avatar: string;
        location?: string;
    };
    content: {
        image: string;
        caption: string;
        hashtags: string[];
        likes: number;
        comments: number;
    };
    isSponsored?: boolean;
    context?: {
        type: 'memory';
        date: string;
        mood: string;
    };
}

export function SocialPostCard({ user, content, isSponsored, context }: PostProps) {
    const [liked, setLiked] = useState(false);
    const [likeCount, setLikeCount] = useState(content.likes);

    const handleLike = () => {
        if (liked) {
            setLikeCount(prev => prev - 1);
        } else {
            setLikeCount(prev => prev + 1);
            // Trigger gamification +5 coins visual here ideally
        }
        setLiked(!liked);
    };

    return (
        <div className="bg-white mb-6 rounded-none relative">
            {/* Header */}
            <div className="flex items-center justify-between p-4">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-purple-400 to-orange-400 p-[2px]">
                        <div className="w-full h-full rounded-full bg-white p-[2px]">
                            <div className="w-full h-full rounded-full bg-gray-100 overflow-hidden relative">
                                {/* Avatar Placeholder */}
                                <div className="absolute inset-0 bg-gray-200" />
                            </div>
                        </div>
                    </div>
                    <div>
                        <div className="flex items-center gap-1">
                            <span className="font-bold text-sm text-gray-900">{user.name}</span>
                            {isSponsored && (
                                <span className="bg-yellow-100 text-yellow-700 text-[9px] px-1.5 py-0.5 rounded-full font-bold">Premium</span>
                            )}
                        </div>
                        {user.location && (
                            <div className="flex items-center gap-0.5 text-xs text-gray-400">
                                <MapPin className="w-3 h-3" />
                                {user.location}
                            </div>
                        )}
                    </div>
                </div>
                <button className="text-gray-400">
                    <MoreHorizontal className="w-5 h-5" />
                </button>
            </div>

            {/* Media */}
            <div className="aspect-[4/5] bg-gray-100 relative group cursor-pointer" onDoubleClick={handleLike}>
                {/* Render Image or Placeholder */}
                {content.image.startsWith('data:') ? (
                    <Image src={content.image} alt="Post content" fill className="object-cover" />
                ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-gray-300 font-medium text-4xl">
                        {content.image}
                    </div>
                )}

                {/* Gamification Floating Badge */}
                <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-full shadow-lg flex items-center gap-2 transform translate-y-[-10px] opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
                    <Sparkles className="w-3 h-3 text-yellow-500" />
                    <span className="text-xs font-bold bg-gradient-to-r from-yellow-500 to-orange-500 bg-clip-text text-transparent">MoffiPuan +10</span>
                </div>
            </div>

            {/* Actions */}
            <div className="p-4 pb-2 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <button onClick={handleLike} className="flex flex-col items-center gap-0.5 group">
                        <Heart className={`w-7 h-7 transition-colors ${liked ? 'fill-red-500 text-red-500' : 'text-gray-800 group-hover:text-red-400'}`} />
                        <span className="text-[10px] font-bold text-gray-900">{likeCount}</span>
                    </button>

                    <button className="flex flex-col items-center gap-0.5 group">
                        <MessageCircle className="w-7 h-7 text-gray-800 group-hover:text-blue-500 transition-colors" />
                        <span className="text-[10px] font-bold text-gray-900">{content.comments}</span>
                    </button>

                    <button className="flex flex-col items-center gap-0.5 group">
                        <Share2 className="w-7 h-7 text-gray-800 group-hover:text-green-500 transition-colors" />
                        <span className="text-[10px] font-bold text-gray-900">Share</span>
                    </button>
                </div>

                {/* Save/Collection */}
                <button>
                    <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center hover:bg-gray-100 transition-colors">
                        <Sparkles className="w-4 h-4 text-purple-500" />
                    </div>
                </button>
            </div>

            {/* Context Badge (For Memories) */}
            {isSponsored && context?.type === 'memory' && (
                <div className="px-4 pb-1">
                    <span className="text-[10px] font-bold text-[#5B4D9D] flex items-center gap-1 bg-purple-50 px-2 py-1 rounded-lg w-fit">
                        <Sparkles className="w-3 h-3" />
                        Moffi'nin Günlüğünden • {context.date}
                    </span>
                </div>
            )}

            {/* Context Badge (General) */}
            {!isSponsored && context?.type === 'memory' && (
                <div className="px-4 pb-1">
                    <span className="text-[10px] font-bold text-[#5B4D9D] flex items-center gap-1 bg-purple-50 px-2 py-1 rounded-lg w-fit">
                        <Sparkles className="w-3 h-3" />
                        Moffi'nin Günlüğünden • {context.date}
                    </span>
                </div>
            )}

            {/* Caption */}
            <div className="px-4 pb-4">
                <p className="text-sm text-gray-800 leading-relaxed">
                    <span className="font-bold mr-2">{user.name}</span>
                    {content.caption}
                    <span className="block mt-1 text-blue-600 font-medium">
                        {content.hashtags.map(t => `#${t} `)}
                    </span>
                </p>
            </div>
        </div>
    );
}
