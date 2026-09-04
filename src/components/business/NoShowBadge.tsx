'use client';

import React, { useEffect, useState } from 'react';
import { apiService } from '@/services/apiService';

interface NoShowBadgeProps {
    userId: string;
}

export function NoShowBadge({ userId }: NoShowBadgeProps) {
    const [noShowCount, setNoShowCount] = useState<number>(0);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!userId) {
            setLoading(false);
            return;
        }
        
        apiService.getNoShowCount(userId)
            .then(count => {
                setNoShowCount(count);
            })
            .catch(err => {
                console.error("Error fetching no-show count:", err);
            })
            .finally(() => {
                setLoading(false);
            });
    }, [userId]);

    if (loading || noShowCount === 0) return null;

    return (
        <span className="ml-2 text-[10px] bg-amber-500/10 text-amber-500 font-bold px-2 py-0.5 rounded-full border border-amber-500/20 whitespace-nowrap">
            ⚠️ {noShowCount} kez gelmedi
        </span>
    );
}

