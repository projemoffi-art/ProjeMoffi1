import { useState, useCallback, useMemo } from 'react';

export type Adjustments = {
    brightness: number; // -100 to 100
    contrast: number;
    saturation: number;
    exposure: number;
    warmth: number;
    tint: number;
    highlights: number;
    shadows: number;
    vignette: number;
    sharpness: number;
    blur: number;
};

export type FilterType = 'none' | 'vivid' | 'chrome' | 'mono' | 'noir' | 'warm' | 'cool' | 'dramatic' | 'silvertone';

export type EditorState = {
    adjustments: Adjustments;
    filter: FilterType;
    rotation: number;
    scale: number;
    crop: { x: number, y: number, width: number, height: number } | null;
};

const DEFAULT_ADJUSTMENTS: Adjustments = {
    brightness: 0, contrast: 0, saturation: 0, exposure: 0,
    warmth: 0, tint: 0, highlights: 0, shadows: 0,
    vignette: 0, sharpness: 0, blur: 0
};

const INITIAL_STATE: EditorState = {
    adjustments: DEFAULT_ADJUSTMENTS,
    filter: 'none',
    rotation: 0,
    scale: 1,
    crop: null
};

// --- CSS FILTER GENERATOR ---
export const generateFilterString = (state: EditorState) => {
    const { adjustments, filter } = state;
    let filters = `brightness(${100 + adjustments.brightness}%) contrast(${100 + adjustments.contrast}%) saturate(${100 + adjustments.saturation}%)`;

    // Simulating advanced params via CSS where possible
    if (adjustments.exposure !== 0) filters += ` brightness(${100 + adjustments.exposure}%)`; // Approx
    if (adjustments.blur > 0) filters += ` blur(${adjustments.blur}px)`;
    if (adjustments.vignette > 0) {
        // Vignette is usually an overlay, handled in component
    }

    // Sepia for warmth approx
    if (adjustments.warmth > 0) filters += ` sepia(${adjustments.warmth}%)`;
    if (adjustments.warmth < 0) filters += ` hue-rotate(${adjustments.warmth}deg)`; // Cool shift

    // Presets
    switch (filter) {
        case 'vivid': filters += ' saturate(150%) contrast(110%)'; break;
        case 'mono': filters += ' grayscale(100%)'; break;
        case 'noir': filters += ' grayscale(100%) contrast(150%) brightness(80%)'; break;
        case 'chrome': filters += ' saturate(0%) contrast(120%) brightness(110%)'; break;
        case 'warm': filters += ' sepia(30%) saturate(120%)'; break;
        case 'dramatic': filters += ' contrast(140%) saturate(80%)'; break;
    }

    return filters;
};

export function usePhotoEditor() {
    // History Stack
    const [history, setHistory] = useState<EditorState[]>([INITIAL_STATE]);
    const [currentIndex, setCurrentIndex] = useState(0);

    const state = history[currentIndex];

    // Push new state to history
    const updateState = useCallback((newState: Partial<EditorState>) => {
        setHistory(prev => {
            const newHistory = prev.slice(0, currentIndex + 1);
            const mergedState = { ...newHistory[newHistory.length - 1], ...newState };

            // Limit history size to 20
            if (newHistory.length > 20) newHistory.shift();

            return [...newHistory, mergedState];
        });
        setCurrentIndex(prev => Math.min(prev + 1, 20)); // Adjust index logic carefully
    }, [currentIndex]);

    // Specialized Updaters
    const setAdjustment = useCallback((key: keyof Adjustments, value: number) => {
        // Optimization: Don't flood history on every slide event.
        // In a real app we'd debounce or use a temp state for sliding.
        // For simplicity here, we update directly but typically 'onCommit' is better.

        // BETTER: We update the CURRENT state in place for sliders, commit on mouseUp.
        // But for React simplicity let's just update.
        const currentAdj = state.adjustments;
        updateState({ adjustments: { ...currentAdj, [key]: value } });
    }, [state, updateState]);

    const setFilter = useCallback((filter: FilterType) => {
        updateState({ filter });
    }, [updateState]);

    const undo = useCallback(() => {
        if (currentIndex > 0) setCurrentIndex(prev => prev - 1);
    }, [currentIndex]);

    const redo = useCallback(() => {
        if (currentIndex < history.length - 1) setCurrentIndex(prev => prev + 1);
    }, [currentIndex, history.length]);

    const reset = useCallback(() => {
        updateState(INITIAL_STATE);
    }, [updateState]);

    return {
        state,
        setAdjustment,
        setFilter,
        undo,
        redo,
        reset,
        canUndo: currentIndex > 0,
        canRedo: currentIndex < history.length - 1,
        generateFilterString
    };
}
