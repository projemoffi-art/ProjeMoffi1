
import { NextResponse } from 'next/server';

// In-memory storage (resets on server restart)
let store = {
    sceneId: "studio",
    styleId: "clean",
    formatId: "square"
};

export async function GET() {
    return NextResponse.json(store);
}

export async function POST(request: Request) {
    const body = await request.json();
    const { sceneId, styleId, formatId } = body;

    // Update store if values are provided
    if (sceneId) store.sceneId = sceneId;
    if (styleId) store.styleId = styleId;
    if (formatId) store.formatId = formatId;

    return NextResponse.json(store);
}
