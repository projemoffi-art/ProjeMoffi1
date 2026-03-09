"use client";

import React, { createContext, useContext, useReducer, ReactNode, useCallback } from 'react';

// --- TYPES ---
export type LayerType = 'text' | 'image' | 'sticker' | 'shape';
export type StudioMode = 'PLACEMENT' | 'STAGING' | 'CREATION';

export interface StudioLayer {
    id: string;
    type: LayerType;
    content: string; // URL for image, Text for text
    isProduct?: boolean; // [NEW] Flag for product layer

    // Transform
    x: number;
    y: number;
    rotation: number;
    scale: number;

    // Style
    opacity: number;
    color?: string;
    backgroundColor?: string;
    fontFamily?: string;
    mask?: string; // CSS clip-path value

    // Image Manipulation (Crop)
    imageX?: number; // Offset X %
    imageY?: number; // Offset Y %
    imageScale?: number; // Inner Scale

    // Pro Effects (Photoroom Style)
    shadowColor?: string;
    shadowBlur?: number;
    shadowOffsetX?: number;
    shadowOffsetY?: number;
    shadowOpacity?: number;

    outlineColor?: string;
    outlineWidth?: number;

    // Blend & Filters (Advanced)
    blendMode?: 'normal' | 'multiply' | 'screen' | 'overlay' | 'soft-light';
    filterBrightness?: number;
    filterContrast?: number;
    filterGrayscale?: number;
    filterBlur?: number;
    filterHue?: number;
    filterSaturation?: number;
    flipX?: boolean;
    flipY?: boolean;
    reflection?: boolean;

    // State
    isLocked?: boolean;
}

interface StudioState {
    layers: StudioLayer[];
    activeLayerId: string | null;
    history: StudioLayer[][]; // Undo stack
    historyIndex: number;
    isProMode: boolean; // For advanced controls
    activeTool: LayerType | 'select' | 'ai_magic' | null;
    activeMode: StudioMode;
    gridVisible: boolean;
}

type StudioAction =
    | { type: 'ADD_LAYER', payload: StudioLayer }
    | { type: 'UPDATE_LAYER', payload: { id: string, changes: Partial<StudioLayer> } }
    | { type: 'REMOVE_LAYER', payload: string }
    | { type: 'SELECT_LAYER', payload: string | null }
    | { type: 'SET_TOOL', payload: StudioState['activeTool'] }
    | { type: 'SET_MODE', payload: StudioMode }
    | { type: 'TOGGLE_GRID' }
    | { type: 'UNDO' }
    | { type: 'REDO' }
    | { type: 'REORDER_LAYER', payload: 'front' | 'back' | 'forward' | 'backward' }
    | { type: 'DUPLICATE_LAYER' };

// --- INITIAL STATE ---
const initialState: StudioState = {
    layers: [],
    activeLayerId: null,
    history: [[]],
    historyIndex: 0,
    isProMode: true,
    activeTool: null,
    activeMode: 'PLACEMENT',
    gridVisible: false,
};

// --- REDUCER ---
function studioReducer(state: StudioState, action: StudioAction): StudioState {
    switch (action.type) {
        case 'ADD_LAYER': {
            const newLayers = [...state.layers, action.payload];
            const newHistory = state.history.slice(0, state.historyIndex + 1);
            return {
                ...state,
                layers: newLayers,
                activeLayerId: action.payload.id,
                history: [...newHistory, newLayers],
                historyIndex: newHistory.length,
            };
        }
        case 'UPDATE_LAYER': {
            const newLayers = state.layers.map(l =>
                l.id === action.payload.id ? { ...l, ...action.payload.changes } : l
            );
            return {
                ...state,
                layers: newLayers
            };
        }
        case 'REMOVE_LAYER': {
            const newLayers = state.layers.filter(l => l.id !== action.payload);
            const newHistory = state.history.slice(0, state.historyIndex + 1);
            return {
                ...state,
                layers: newLayers,
                activeLayerId: null,
                history: [...newHistory, newLayers],
                historyIndex: newHistory.length
            };
        }
        case 'SELECT_LAYER':
            return { ...state, activeLayerId: action.payload };

        case 'SET_TOOL':
            return { ...state, activeTool: action.payload };

        case 'SET_MODE':
            return { ...state, activeMode: action.payload };

        case 'TOGGLE_GRID':
            return { ...state, gridVisible: !state.gridVisible };

        case 'UNDO':
            if (state.historyIndex <= 0) return state;
            return {
                ...state,
                layers: state.history[state.historyIndex - 1],
                historyIndex: state.historyIndex - 1,
                activeLayerId: null
            };

        case 'REDO':
            if (state.historyIndex >= state.history.length - 1) return state;
            return {
                ...state,
                layers: state.history[state.historyIndex + 1],
                historyIndex: state.historyIndex + 1
            };

        case 'REORDER_LAYER': {
            if (!state.activeLayerId) return state;
            const idx = state.layers.findIndex(l => l.id === state.activeLayerId);
            if (idx === -1) return state;

            const newLayers = [...state.layers];
            const [layer] = newLayers.splice(idx, 1);

            if (action.payload === 'front') {
                newLayers.push(layer);
            } else if (action.payload === 'back') {
                newLayers.unshift(layer);
            } else if (action.payload === 'forward') {
                const newIdx = Math.min(newLayers.length, idx + 1);
                newLayers.splice(newIdx, 0, layer);
            } else if (action.payload === 'backward') {
                const newIdx = Math.max(0, idx - 1);
                newLayers.splice(newIdx, 0, layer);
            }

            const newHistory = state.history.slice(0, state.historyIndex + 1);
            return {
                ...state,
                layers: newLayers,
                history: [...newHistory, newLayers],
                historyIndex: newHistory.length
            };
        }

        case 'DUPLICATE_LAYER': {
            if (!state.activeLayerId) return state;
            const layer = state.layers.find(l => l.id === state.activeLayerId);
            if (!layer) return state;

            const newLayer = {
                ...layer,
                id: crypto.randomUUID(),
                x: Math.min(layer.x + 5, 90),
                y: Math.min(layer.y + 5, 90)
            };

            const newLayers = [...state.layers, newLayer];
            const newHistory = state.history.slice(0, state.historyIndex + 1);
            return {
                ...state,
                layers: newLayers,
                activeLayerId: newLayer.id,
                history: [...newHistory, newLayers],
                historyIndex: newHistory.length
            };
        }

        default:
            return state;
    }
}

// --- CONTEXT ---
const StudioContext = createContext<{
    state: StudioState;
    dispatch: React.Dispatch<StudioAction>;
    actions: {
        addLayer: (type: LayerType, content: string, extra?: any) => void;
        updateActiveLayer: (idOrChanges: string | Partial<StudioLayer>, changes?: Partial<StudioLayer>) => void;
        deleteActiveLayer: () => void;
        reorderActiveLayer: (direction: 'front' | 'back' | 'forward' | 'backward') => void;
        duplicateActiveLayer: () => void;
    };
} | null>(null);

// --- PROVIDER ---
export function StudioProvider({ children }: { children: ReactNode }) {
    const [state, dispatch] = useReducer(studioReducer, initialState);

    // Helpers
    const addLayer = useCallback((type: LayerType, content: string, extra: any = {}) => {
        const newLayer: StudioLayer = {
            id: crypto.randomUUID(),
            type,
            content,
            x: 50, y: 50, // Percentages
            rotation: 0,
            scale: 1,
            opacity: 100,
            color: type === 'text' ? '#000000' : undefined,
            fontFamily: type === 'text' ? 'Inter' : undefined,
            ...extra
        };
        dispatch({ type: 'ADD_LAYER', payload: newLayer });
    }, []);

    const updateActiveLayer = useCallback((idOrChanges: string | Partial<StudioLayer>, changes?: Partial<StudioLayer>) => {
        if (typeof idOrChanges === 'string' && changes) {
            dispatch({ type: 'UPDATE_LAYER', payload: { id: idOrChanges, changes } });
        } else if (typeof idOrChanges === 'object') {
            if (state.activeLayerId) {
                dispatch({ type: 'UPDATE_LAYER', payload: { id: state.activeLayerId, changes: idOrChanges } });
            }
        }
    }, [state.activeLayerId]);

    const deleteActiveLayer = useCallback(() => {
        if (state.activeLayerId) {
            dispatch({ type: 'REMOVE_LAYER', payload: state.activeLayerId });
        }
    }, [state.activeLayerId]);

    const reorderActiveLayer = useCallback((direction: 'front' | 'back' | 'forward' | 'backward') => {
        dispatch({ type: 'REORDER_LAYER', payload: direction });
    }, []);

    const duplicateActiveLayer = useCallback(() => {
        dispatch({ type: 'DUPLICATE_LAYER' });
    }, []);

    return (
        <StudioContext.Provider value={{ state, dispatch, actions: { addLayer, updateActiveLayer, deleteActiveLayer, reorderActiveLayer, duplicateActiveLayer } }}>
            {children}
        </StudioContext.Provider>
    );
}

// --- HOOK ---
export function useStudio() {
    const context = useContext(StudioContext);
    if (!context) throw new Error("useStudio must be used within StudioProvider");
    return context;
}
