"use client";

import { useSocial } from "@/context/SocialContext";
import { Heart, Play } from "lucide-react";

export function WalkMoments() {
    const { posts } = useSocial();
    // Filter only image/video posts for now
    const feed = posts.slice(0, 5);

    return (
        <div className="px-6 mb-24">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-black text-gray-800 dark:text-white transition-colors">Moments</h3>
                <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500">Topluluk</span>
            </div>

            <div className="grid grid-cols-2 gap-4">
                {feed.map((post, idx) => (
                    <div
                        key={post.id}
                        className={`rounded-[1.5rem] overflow-hidden relative shadow-md group cursor-pointer ${idx === 0 ? 'h-48 col-span-1 row-span-2' : 'h-22'}`}
                    >
                        {/* Image */}
                        {post.image ? (
                            <img src={post.image || "/api/placeholder/200/200"} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                        ) : (
                            <div className="w-full h-full bg-gray-100 flex items-center justify-center text-2xl">📸</div>
                        )}

                        {/* Overlay */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-60" />

                        {/* User Info */}
                        <div className="absolute bottom-3 left-3 right-3">
                            <div className="flex items-center gap-2 mb-1">
                                <div className="w-5 h-5 rounded-full border border-white bg-gray-200 overflow-hidden">
                                    {/* User Avatar Placeholder */}
                                    {/* <img src="" /> */}
                                </div>
                                <span className="text-[10px] font-bold text-white truncate max-w-[80px]">{post.userName}</span>
                            </div>
                            {idx === 0 && (
                                <p className="text-[10px] text-white/80 line-clamp-2 leading-tight">{post.desc}</p>
                            )}
                        </div>

                        {/* Type Indicator Placeholder */}
                    </div>
                ))}
            </div>
        </div>
    );
}
