import { Type, Sticker, Image, Shapes, Award, Heart, Zap, Star, Smile, Crown } from "lucide-react";

// --- TYPES ---
export type AssetCategory = 'stickers' | 'shapes' | 'backgrounds' | 'text_presets';

export interface StudioAsset {
    id: string;
    url?: string;  // For images
    icon?: any;    // For vector shapes (Lucide)
    label: string;
    category: AssetCategory;
    tags: string[];
    premium?: boolean;
}

// --- MOCK DATABASE ---
export const STUDIO_ASSETS: StudioAsset[] = [
    // --- STICKERS (High Quality PNGs from Flaticon/Demo) ---
    { id: 's1', category: 'stickers', label: 'Cool Dog', tags: ['dog', 'cool'], url: 'https://cdn-icons-png.flaticon.com/512/4692/4692305.png' },
    { id: 's2', category: 'stickers', label: 'Party Cat', tags: ['cat', 'fun'], url: 'https://cdn-icons-png.flaticon.com/512/616/616430.png' }, // Bone actually
    { id: 's3', category: 'stickers', label: 'Rainbow', tags: ['cute', 'nature'], url: 'https://cdn-icons-png.flaticon.com/512/4151/4151970.png' },
    { id: 's4', category: 'stickers', label: 'Pizza', tags: ['food'], url: 'https://cdn-icons-png.flaticon.com/512/3132/3132693.png' },
    { id: 's5', category: 'stickers', label: 'Crown', tags: ['royal', 'yellow'], url: 'https://cdn-icons-png.flaticon.com/512/2640/2640740.png' },

    // --- SHAPES (Using Lucide for Vector-like feel) ---
    { id: 'sh1', category: 'shapes', label: 'Star', tags: ['basic'], icon: Star },
    { id: 'sh2', category: 'shapes', label: 'Heart', tags: ['love'], icon: Heart },
    { id: 'sh3', category: 'shapes', label: 'Zap', tags: ['energy'], icon: Zap },
    { id: 'sh4', category: 'shapes', label: 'Shield', tags: ['protection'], icon: Award },

    // --- BACKGROUNDS (Unsplash) ---
    { id: 'bg1', category: 'backgrounds', label: 'Cosmic', tags: ['space', 'purple'], url: 'https://images.unsplash.com/photo-1534796636912-3b95b3ab5986?w=400&q=80' },
    { id: 'bg2', category: 'backgrounds', label: 'Abstract', tags: ['modern', 'blue'], url: 'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?w=400&q=80' },
    { id: 'bg3', category: 'backgrounds', label: 'Gradient', tags: ['soft', 'pink'], url: 'https://images.unsplash.com/photo-1557682250-33bd709cbe85?w=400&q=80' },
];

export const STUDIO_FONTS = [
    { name: 'Inter', family: 'Inter, sans-serif', category: 'Modern' },
    { name: 'Playfair Display', family: 'Playfair Display, serif', category: 'Elegant' },
    { name: 'Bangers', family: 'Bangers, cursive', category: 'Fun' },
    { name: 'Permanent Marker', family: 'Permanent Marker, cursive', category: 'Handwritten' },
    { name: 'Roboto Mono', family: 'Roboto Mono, monospace', category: 'Tech' },
];

export const AI_STYLES = [
    { id: 'cartoon', label: '3D Cartoon', image: 'https://images.unsplash.com/photo-1633511090164-b43840ea1607?w=100' },
    { id: 'watercolor', label: 'Sulu Boya', image: 'https://images.unsplash.com/photo-1579783902614-a3fb392796a5?w=100' },
    { id: 'sketch', label: 'Karakalem', image: 'https://images.unsplash.com/photo-1597423244039-4402633002f2?w=100' },
    { id: 'neon', label: 'Cyberpunk', image: 'https://images.unsplash.com/photo-1555680202-c86f0e12f086?w=100' },
];
