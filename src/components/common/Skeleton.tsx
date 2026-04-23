'use client';

import { cn } from '@/lib/utils';

interface SkeletonProps {
    className?: string;
}

export function Skeleton({ className }: SkeletonProps) {
    return (
        <div className={cn(
            "animate-pulse bg-white/5 rounded-2xl relative overflow-hidden",
            className
        )}>
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full animate-[shimmer_2s_infinite]" />
        </div>
    );
}

export function PostSkeleton() {
    return (
        <div className="bg-[#12121A] border border-white/5 rounded-[3.5rem] overflow-hidden space-y-6 pb-8">
            <div className="p-8 pb-0 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Skeleton className="w-14 h-14 rounded-2xl" />
                    <div className="space-y-2">
                        <Skeleton className="w-24 h-4" />
                        <Skeleton className="w-16 h-3" />
                    </div>
                </div>
            </div>
            <Skeleton className="w-full aspect-[4/5]" />
            <div className="px-8 space-y-3">
                <Skeleton className="w-3/4 h-4" />
                <Skeleton className="w-1/2 h-4" />
            </div>
        </div>
    );
}
