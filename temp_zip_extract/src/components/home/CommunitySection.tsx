import Image from "next/image";
import { Heart, MessageCircle } from "lucide-react";

export function CommunitySection() {
    const posts = [
        { id: 1, image: "/cat-box.jpg", likes: 125, user: "/user1.jpg" },
        { id: 2, image: "/dog-smile.jpg", likes: 340, user: "/user2.jpg" },
        { id: 3, image: "/parrot.jpg", likes: 78, user: "/user3.jpg" },
    ];

    return (
        <div className="mt-8 px-6">
            <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-lg text-moffi-text">Toplulukta Neler Var?</h3>
                <button className="text-xs text-moffi-gray font-medium hover:text-moffi-primary">Tümünü Gör</button>
            </div>

            <div className="flex gap-4 overflow-x-auto pb-4 -mx-6 px-6 scrollbar-hide">
                {posts.map((post) => (
                    <div key={post.id} className="min-w-[140px] flex flex-col gap-2">
                        <div className="relative aspect-square rounded-2xl overflow-hidden bg-gray-100 border border-card-border">
                            {/* Placeholder for actual image */}
                            <div className="absolute inset-0 bg-gray-200 flex items-center justify-center text-gray-400 text-xs">
                                Pet Image
                            </div>

                            {/* User Avatar Overlay */}
                            <div className="absolute top-2 right-2 w-8 h-8 rounded-full border-2 border-white bg-card overflow-hidden shadow-moffi-card">
                                <div className="w-full h-full bg-blue-100" />
                            </div>
                        </div>

                        <div className="flex items-center gap-4 text-xs font-bold text-moffi-text px-1">
                            <div className="flex items-center gap-1">
                                <div className="w-6 h-6 rounded-full overflow-hidden bg-gray-100 border-2 border-white shadow-sm flex-shrink-0 relative -ml-2">
                                    {/* User who liked or posted */}
                                    <div className="w-full h-full bg-pink-100" />
                                </div>
                                <span>{post.likes} Beğeni</span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
