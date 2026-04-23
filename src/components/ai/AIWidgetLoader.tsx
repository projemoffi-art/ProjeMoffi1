"use client";

import dynamic from "next/dynamic";

const GlobalAIWidget = dynamic(
    () => import("@/components/ai/GlobalAIWidget").then(mod => mod.GlobalAIWidget),
    { ssr: false }
);

export function AIWidgetLoader() {
    return <GlobalAIWidget />;
}
