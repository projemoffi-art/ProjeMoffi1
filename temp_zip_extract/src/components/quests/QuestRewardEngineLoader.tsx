"use client";

import dynamic from 'next/dynamic';

const QuestRewardEngine = dynamic(
    () => import('./QuestRewardEngine').then(m => m.QuestRewardEngine),
    { ssr: false }
);

export function QuestRewardEngineLoader() {
    return <QuestRewardEngine />;
}
