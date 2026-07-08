import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

const COOKIE_NAME = 'moffi_studio_state';

const DEFAULT_STATE = {
    sceneId: "studio",
    styleId: "clean",
    formatId: "square"
};

export async function GET() {
    const cookieStore = cookies();
    const stateCookie = cookieStore.get(COOKIE_NAME);
    
    let currentState = { ...DEFAULT_STATE };
    
    if (stateCookie?.value) {
        try {
            const parsed = JSON.parse(stateCookie.value);
            currentState = { ...currentState, ...parsed };
        } catch (e) {
            console.error('Failed to parse studio state cookie');
        }
    }
    
    return NextResponse.json(currentState);
}

export async function POST(request: Request) {
    const body = await request.json();
    const { sceneId, styleId, formatId } = body;

    // Retrieve existing state from cookie to preserve other fields
    const cookieStore = cookies();
    const stateCookie = cookieStore.get(COOKIE_NAME);
    let currentState = { ...DEFAULT_STATE };
    
    if (stateCookie?.value) {
        try {
            currentState = { ...currentState, ...JSON.parse(stateCookie.value) };
        } catch (e) {}
    }

    // Update state if values are provided
    if (sceneId) currentState.sceneId = sceneId;
    if (styleId) currentState.styleId = styleId;
    if (formatId) currentState.formatId = formatId;

    // Save to cookie (valid for 30 days)
    const response = NextResponse.json(currentState);
    response.cookies.set({
        name: COOKIE_NAME,
        value: JSON.stringify(currentState),
        path: '/',
        maxAge: 30 * 24 * 60 * 60, 
        sameSite: 'lax'
    });

    return response;
}
