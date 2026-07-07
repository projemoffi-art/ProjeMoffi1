import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

const API_KEY = process.env.GEMINI_API_KEY || "AIzaSyBnUBpO38MhK4lImGdzk0xVcus73JXGoTQ";
const genAI = new GoogleGenerativeAI(API_KEY);

export async function POST(req: Request) {
    try {
        const { prompt, style, action = 'generate' } = await req.json();

        if (!API_KEY) {
            return NextResponse.json(
                { error: "API Key not configured" },
                { status: 500 }
            );
        }

        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

        // --- ACTION: SUGGESTION ---
        if (action === 'suggestion') {
            const result = await model.generateContent(`
                You are a creative design assistant for a POD (Print on Demand) app.
                Suggest 3 creative, short, and punchy image prompts for a user who wants to design a custom product.
                The prompts should be diverse (e.g., cute, cool, artistic).
                Format: JSON array of strings. Example: ["Cute space cat", "Retro sunset", "Floral pattern"]
                Return ONLY the JSON.
            `);
            const text = result.response.text();
            // Basic cleaning to ensure json
            const cleanedText = text.replace(/```json/g, '').replace(/```/g, '').trim();
            let suggestions = [];
            try {
                suggestions = JSON.parse(cleanedText);
            } catch (e) {
                suggestions = ["Cool astronaut cat", "Vintage floral pattern", "Cyberpunk city"];
            }
            return NextResponse.json({ success: true, suggestions });
        }

        // --- ACTION: REMOVE BG / ERASER (Simulated for now) ---
        if (action === 'remove-bg' || action === 'eraser') {
            // In a real app, this would process the image. 
            // Here we simulate network delay and return success.
            await new Promise(resolve => setTimeout(resolve, 2000));
            return NextResponse.json({ success: true, message: "Processing complete" });
        }

        // --- ACTION: GENERATE (Default) ---
        // Enhancing the prompt based on style
        let finalPrompt = prompt;
        if (style === 'sticker') {
            finalPrompt = `Sticker design of ${prompt}, die-cut sticker, white border, vector art, high quality, isolated on black background`;
        } else if (style === 'pattern') {
            finalPrompt = `Seamless pattern design of ${prompt}, repeating pattern, wallpaper style, high quality texture`;
        } else if (style === '3d') {
            finalPrompt = `3D render of ${prompt}, cute, isometric, claymorphism style, soft lighting, 4k`;
        } else if (style === 'watercolor') {
            finalPrompt = `Watercolor painting of ${prompt}, artistic, soft edges, pastel colors, white background`;
        } else if (style === 'pixel') {
            finalPrompt = `Pixel art of ${prompt}, 8-bit style, retro game asset, vibrant colors`;
        } else if (style === 'vector') {
            finalPrompt = `Flat vector illustration of ${prompt}, minimal, clean lines, professional graphic design`;
        }

        // Determine keyword for picsum fallback
        // Ideally we would generate real image here using Imagen 3 if available to key
        // For now, continuing with reliable picsum fallback but varying seed
        const seed = Math.floor(Math.random() * 99999);
        const unsplashUrl = `https://picsum.photos/seed/${seed}/500/500`;

        return NextResponse.json({
            success: true,
            image: unsplashUrl,
        });

    } catch (error) {
        console.error("AI Generate Error:", error);
        return NextResponse.json(
            { error: "Generation failed" },
            { status: 500 }
        );
    }
}
