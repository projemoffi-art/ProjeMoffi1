export type Source = "MOFFI" | "MERCHANT";

export interface StudioProduct {
    id: string;
    title: string;
    price: number;
    currency: string;
    source: Source;
    image?: string;
    colors?: string[];
    sizes?: string[];
}

export interface Layer {
    id: string;
    type: 'text' | 'image' | 'sticker';
    x: number;
    y: number;
    rotation: number;
    scale: number;
    opacity: number;
    name: string;
}

export interface TextLayer extends Layer {
    type: 'text';
    text: string;
    color: string;
    fontFamily: string;
    fontSize: number;
    fontWeight: number;
    fontStyle?: 'normal' | 'italic';
}

export interface ImageLayer extends Layer {
    type: 'image';
    src: string; // Data URL or Remote URL
    width: number;
    height: number;
}

export interface StickerLayer extends Layer {
    type: 'sticker';
    stickerId: string;
    svgContent?: string; // Optional: if we want to render inline SVG
}

export type CanvasMode = 'select' | 'text' | 'draw';

export interface CartItem {
    id: string;
    productTitle: string;
    price: number;
    preview: string; // Data URL of the design
}
