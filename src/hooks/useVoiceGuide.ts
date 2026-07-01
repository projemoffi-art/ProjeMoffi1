import { useCallback, useEffect, useState } from 'react';

export function useVoiceGuide(enabled: boolean = true) {
    const [isSpeaking, setIsSpeaking] = useState(false);

    const stop = useCallback(() => {
        if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
            window.speechSynthesis.cancel();
            setIsSpeaking(false);
        }
    }, []);

    const speak = useCallback((text: string) => {
        if (!enabled) return;
        if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;

        // Cancel previous speech first
        window.speechSynthesis.cancel();

        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'tr-TR';
        utterance.rate = 0.95; // Slightly slower for elderly comprehension
        utterance.pitch = 1.0;

        // Try to find a Turkish voice if available
        const voices = window.speechSynthesis.getVoices();
        const trVoice = voices.find(voice => voice.lang.includes('tr') || voice.lang.includes('TR'));
        if (trVoice) {
            utterance.voice = trVoice;
        }

        utterance.onstart = () => setIsSpeaking(true);
        utterance.onend = () => setIsSpeaking(false);
        utterance.onerror = () => setIsSpeaking(false);

        window.speechSynthesis.speak(utterance);
    }, [enabled]);

    // Load voices if not loaded (Chrome issue fix)
    useEffect(() => {
        if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
            window.speechSynthesis.getVoices();
        }
    }, []);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
                window.speechSynthesis.cancel();
            }
        };
    }, []);

    // Helper props for button hover/focus
    const getSpeakProps = useCallback((text: string) => {
        if (!enabled) return {};
        return {
            onMouseEnter: () => speak(text),
            onFocus: () => speak(text)
        };
    }, [enabled, speak]);

    return { speak, stop, isSpeaking, getSpeakProps };
}
