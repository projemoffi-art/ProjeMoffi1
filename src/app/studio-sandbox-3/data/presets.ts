
import { Square, Smartphone, Monitor, Maximize } from 'lucide-react';

// --- TYPES ---

export type ExportIntent = 'personal' | 'store-preview';

export interface ExportCapability {
    allowed: boolean;
    formats: ('png' | 'jpg')[];
}

export interface ScenePreset {
    id: string;
    label: string;
    color: string;
    shadow: string; // Tailwind shadow class
    dark?: boolean;
}

export interface StylePreset {
    id: string;
    label: string;
    filter: string; // CSS filter string (e.g. "contrast(1.1) brightness(1.05)")
    overlay: string; // Tailwind bg color with opacity (e.g. "bg-orange-500/10")
}

export interface FramePreset {
    id: string;
    label: string;
    icon: any; // Lucide icon
    ratio: string;
}

export interface LookConfiguration {
    scene: ScenePreset;
    style: StylePreset;
    frame: FramePreset;
    intent: ExportIntent; // INTERNAL STATE
    export: ExportCapability; // PERMISSION STATE
    timestamp: number;
}

export const SCENES: ScenePreset[] = [
    { id: 'studio', label: 'Studio', color: 'from-gray-50 to-white', shadow: 'shadow-xl' },
    { id: 'lifestyle', label: 'Lifestyle', color: 'from-orange-50 to-white', shadow: 'shadow-2xl shadow-orange-900/10' },
    { id: 'premium', label: 'Premium', color: 'from-slate-900 to-slate-800', shadow: 'shadow-2xl shadow-black/50', dark: true },
    { id: 'social', label: 'Social', color: 'from-purple-50 to-white', shadow: 'shadow-xl shadow-purple-900/10' },
];

export const STYLES: StylePreset[] = [
    { id: 'clean', label: 'Clean', filter: 'brightness(1.02) contrast(1.02) saturate(1.01)', overlay: 'bg-transparent' },
    { id: 'cozy', label: 'Cozy', filter: 'sepia(0.15) brightness(0.98) contrast(0.95) saturate(1.1)', overlay: 'bg-orange-100/10' },
    { id: 'soft', label: 'Soft Light', filter: 'brightness(1.08) contrast(0.90) saturate(0.95)', overlay: 'bg-white/5' },
    { id: 'contrast', label: 'Contrast', filter: 'contrast(1.20) saturate(1.1) brightness(0.98)', overlay: 'bg-transparent' },
    { id: 'warm', label: 'Warm', filter: 'sepia(0.25) saturate(1.15) contrast(1.05)', overlay: 'bg-yellow-500/5' },
];

export const FRAMES: FramePreset[] = [
    { id: 'square', label: 'Square', icon: Square, ratio: 'aspect-square' },
    { id: 'story', label: 'Vertical', icon: Smartphone, ratio: 'aspect-[9/16]' },
    { id: 'wide', label: 'Wide', icon: Monitor, ratio: 'aspect-[16/9]' },
    { id: 'full', label: 'Original', icon: Maximize, ratio: 'aspect-[4/5]' },
];

// --- LOGIC ---

export function buildLookConfig(
    sceneId: string,
    styleId: string,
    formatId: string,
    intent: ExportIntent = 'personal'
): LookConfiguration {
    const scene = SCENES.find(s => s.id === sceneId) || SCENES[0];
    const style = STYLES.find(s => s.id === styleId) || STYLES[0];
    const frame = FRAMES.find(f => f.id === formatId) || FRAMES[0];

    // Export Permission Logic
    const exportCapability: ExportCapability = {
        allowed: intent === 'personal',
        formats: ['png', 'jpg']
    };

    return {
        scene,
        style,
        frame,
        intent,
        export: exportCapability,
        timestamp: Date.now()
    };
}
