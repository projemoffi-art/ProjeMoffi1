"use client";

import { usePathname } from "next/navigation";
import { useAuth } from "../../context/AuthContext";
import { MoffiAssistant } from "./MoffiAssistant";

/**
 * GlobalAIWidget
 * 
 * A wrapper for the MoffiAssistant to handle visibility across the application.
 * It ensures the AI bubble floats on all pages except for specific ones where it might collide with UI.
 */
export function GlobalAIWidget() {
    const { showAIAssistant } = useAuth();
    
    // Hide ONLY if disabled in settings
    if (!showAIAssistant) return null;

    return <MoffiAssistant />;
}
