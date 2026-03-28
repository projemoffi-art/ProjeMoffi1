import OpenAI from 'openai';

// NOTE: This service requires the NEXT_PUBLIC_OPENAI_API_KEY env variable to be set.
// The user is currently obtaining this key.

export const DalleService = {
    /**
     * Generates an image using OpenAI's DALL-E 3 model.
     * @param prompt The enriched prompt text from Gemini
     */
    generateImage: async (prompt: string): Promise<string | null> => {
        const apiKey = process.env.NEXT_PUBLIC_OPENAI_API_KEY;

        if (!apiKey) {
            console.warn("DALL-E Service: Missing API Key");
            throw new Error("OPENAI_API_KEY_MISSING");
        }

        const openai = new OpenAI({
            apiKey: apiKey,
            dangerouslyAllowBrowser: true // For client-side demo, eventually move to backend proxy
        });

        try {
            const response = await openai.images.generate({
                model: "dall-e-3",
                prompt: prompt,
                n: 1,
                size: "1024x1024",
                quality: "standard", // or 'hd'
                style: "vivid" // or 'natural'
            });

            if (!response.data || response.data.length === 0) {
                return null;
            }

            return response.data[0].url || null;
        } catch (error) {
            console.error("DALL-E Generation Failed:", error);
            throw error;
        }
    }
};
