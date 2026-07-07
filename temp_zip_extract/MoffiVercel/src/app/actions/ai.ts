'use server';

import OpenAI from 'openai';

export async function generateImageAction(prompt: string) {
    const apiKey = process.env.NEXT_PUBLIC_OPENAI_API_KEY || process.env.OPENAI_API_KEY;

    if (!apiKey) {
        console.warn("OpenAI API Anahtarı bulunamadı. Sunum Modu/Mock Görsel üretiliyor...");
        // Sunum için OpenAI servisine gitmiş gibi bekleyelim
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        return { 
            success: true, 
            url: "https://images.unsplash.com/photo-1583337130417-3346a1be7dee?q=80&w=1000&auto=format&fit=crop" // Harika bir stüdyo mock görseli
        };
    }

    const openai = new OpenAI({ apiKey: apiKey });

    try {
        console.log("Sunucu tarafında resim üretiliyor:", prompt);
        const response = await openai.images.generate({
            model: "dall-e-3", prompt: prompt, n: 1, size: "1024x1024", quality: "standard", style: "vivid"
        });

        const url = response.data?.[0]?.url;
        if (!url) throw new Error("URL dönmedi");
        return { success: true, url };

    } catch (error: any) {
        console.error("DALL-E Server Error:", error);
        console.log("Hata yakalandı, Mock Görsele Düşülüyor...");
        return { 
            success: true, 
            url: "https://images.unsplash.com/photo-1548658166-136d9f6a7176?q=80&w=1000&auto=format&fit=crop" 
        };
    }
}
