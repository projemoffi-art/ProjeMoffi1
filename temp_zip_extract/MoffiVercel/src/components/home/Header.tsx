import { Bell, MessageCircle } from "lucide-react";
import Image from "next/image";

export function Header() {
    return (
        <header className="flex items-center justify-between px-6 py-4 bg-card sticky top-0 z-10">
            {/* Profile Section */}
            <div className="flex items-center gap-2">
                <div className="relative">
                    {/* Pet Avatar */}
                    <div className="w-10 h-10 rounded-full border-2 border-white overflow-hidden bg-moffi-light shadow-sm z-10 relative">
                        <Image
                            src="/pet-avatar-placeholder.png"
                            alt="Pet"
                            width={40}
                            height={40}
                            className="object-cover"
                        />
                    </div>
                    {/* User Avatar - Slightly behind */}
                    <div className="w-10 h-10 rounded-full border-2 border-white overflow-hidden bg-purple-100 absolute left-6 top-0 -z-0">
                        <Image
                            src="/user-avatar-placeholder.png"
                            alt="User"
                            width={40}
                            height={40}
                            className="object-cover"
                        />
                    </div>
                </div>
            </div>

            {/* App Title */}
            <div className="font-bold text-xl text-moffi-text flex items-center gap-1">
                MoffiPet<span className="text-red-500 text-lg">+</span>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3 text-moffi-gray">
                <button className="p-2 hover:bg-gray-100 rounded-full">
                    <Bell className="w-6 h-6" />
                </button>
                <button className="p-2 hover:bg-gray-100 rounded-full">
                    <MessageCircle className="w-6 h-6" />
                </button>
            </div>
        </header>
    );
}
