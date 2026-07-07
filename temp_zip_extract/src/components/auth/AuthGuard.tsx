"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

interface AuthGuardProps {
    children: React.ReactNode;
}

/**
 * AuthGuard — wraps protected pages.
 * If user is not logged in, redirects to "/" (auth flow).
 * Shows nothing while loading to prevent flash of content.
 */
export function AuthGuard({ children }: AuthGuardProps) {
    const { user, isLoading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!isLoading && !user) {
            router.replace("/");
        }
    }, [user, isLoading, router]);

    // Loading state — show skeleton
    if (isLoading) {
        return (
            <div className="min-h-screen bg-[#FAFAFA] dark:bg-black flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin" />
                    <p className="text-sm text-gray-400 font-medium">Yükleniyor...</p>
                </div>
            </div>
        );
    }

    // Not logged in — show nothing (redirect is happening)
    if (!user) {
        return null;
    }

    // Authenticated — render children
    return <>{children}</>;
}
