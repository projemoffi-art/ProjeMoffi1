"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { Layer, TextLayer, ImageLayer, StickerLayer } from "./types";

interface HistoryState {
    layers: Layer[];
    selectedId: string | null;
}

export function useStudioEngine() {
    const [layers, setLayers] = useState<Layer[]>([]);
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [history, setHistory] = useState<HistoryState[]>([]);
    const [historyIndex, setHistoryIndex] = useState(-1);
    const [tab, setTab] = useState<'stickers' | 'images' | 'text' | null>(null);

    // -- HISTORY (Undo/Redo) --
    const saveToHistory = useCallback((newLayers: Layer[], newSelectedId: string | null) => {
        setHistory(prev => {
            const newHistory = prev.slice(0, historyIndex + 1);
            return [...newHistory, { layers: newLayers, selectedId: newSelectedId }];
        });
        setHistoryIndex(prev => prev + 1);
    }, [historyIndex]);

    const undo = useCallback(() => {
        if (historyIndex > 0) {
            const prevState = history[historyIndex - 1];
            setLayers(prevState.layers);
            setSelectedId(prevState.selectedId);
            setHistoryIndex(historyIndex - 1);
        }
    }, [history, historyIndex]);

    const redo = useCallback(() => {
        if (historyIndex < history.length - 1) {
            const nextState = history[historyIndex + 1];
            setLayers(nextState.layers);
            setSelectedId(nextState.selectedId);
            setHistoryIndex(historyIndex + 1);
        }
    }, [history, historyIndex]);

    // Initialize history
    useEffect(() => {
        if (history.length === 0) {
            saveToHistory([], null);
        }
    }, []);

    // -- LAYER MANAGEMENT --
    const addLayer = (layer: Layer) => {
        const newLayers = [...layers, layer];
        setLayers(newLayers);
        setSelectedId(layer.id);
        saveToHistory(newLayers, layer.id);
    };

    const updateLayer = (id: string, updates: Partial<Layer>) => {
        const newLayers = layers.map(l => l.id === id ? { ...l, ...updates } : l);
        setLayers(newLayers);
        // We generally don't save history on every drag frame, but for simple property updates we can.
        // For drag, we'll handle history on mouse up.
    };

    // Commit changes to history (called after drag end, or discrete property change)
    const commitChanges = () => {
        saveToHistory(layers, selectedId);
    };

    const removeLayer = (id: string) => {
        const newLayers = layers.filter(l => l.id !== id);
        setLayers(newLayers);
        setSelectedId(null);
        saveToHistory(newLayers, null);
    };

    const selectedLayer = layers.find(l => l.id === selectedId) || null;

    // -- ACTIONS --
    const addText = (text: string = "Metin") => {
        addLayer({
            id: crypto.randomUUID(), type: 'text',
            text, color: '#000000', fontFamily: 'Inter', fontSize: 24, fontWeight: 700,
            name: text, x: 150, y: 150, rotation: 0, scale: 1, opacity: 1
        } as TextLayer);
    };

    const addSticker = (stickerSrc: string) => {
        addLayer({
            id: crypto.randomUUID(), type: 'image', // Treat stickers as images for simplicity in this engine or update types
            src: stickerSrc, width: 100, height: 100, // Default size
            name: 'Sticker',
            x: 200, y: 200, rotation: 0, scale: 1, opacity: 1
        } as ImageLayer); // Using ImageLayer for stickers since they are external URLs now
    };

    const addImageFromFile = (file: File) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const src = e.target?.result as string;
            const img = new Image();
            img.src = src;
            img.onload = () => {
                // NEW LOGIC: Full Screen / Instagram Story Style
                // Target width is ~450px to fill the mobile view width.
                const targetWidth = 450;
                const scale = targetWidth / img.width;

                addLayer({
                    id: crypto.randomUUID(), type: 'image',
                    src, width: img.width, height: img.height,
                    name: file.name, x: 225, y: 400, rotation: 0, scale: scale, opacity: 1
                } as ImageLayer);
            };
        };
        reader.readAsDataURL(file);
    };

    return {
        layers, setLayers,
        selectedId, setSelectedId,
        selectedLayer,
        addText, addSticker, addImageFromFile,
        updateLayer, removeLayer, commitChanges,
        undo, redo,
        tab, setTab
    };
}
