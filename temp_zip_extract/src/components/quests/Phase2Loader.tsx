"use client";

import dynamic from 'next/dynamic';

const LiveEventsHUD = dynamic(
    () => import('./LiveEventsHUD').then(m => m.LiveEventsHUD),
    { ssr: false }
);

const RareDropSystem = dynamic(
    () => import('./RareDropSystem').then(m => m.RareDropSystem),
    { ssr: false }
);

export function Phase2Loader() {
    return null;
}
