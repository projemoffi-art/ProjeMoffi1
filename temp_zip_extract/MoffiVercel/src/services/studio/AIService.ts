/**
 * STUDIO AI SERVICE (REAL)
 * -----------------
 * Handles Generative AI operations via the Next.js API Route.
 * Connects to /api/ai/generate for server-side processing.
 */

export interface GenerationResult {
    url: string;
    width: number;
    height: number;
    prompt: string;
}

export const StudioAI = {
    /**
     * TEXT-TO-STICKER (REAL API)
     * Sends prompt to backend -> OpenAI DALL-E 3
     */
    generateSticker: async (prompt: string): Promise<GenerationResult> => {
        console.log(`[StudioAI] Generating sticker for: "${prompt}"`);

        try {
            const response = await fetch('/api/ai/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ prompt })
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.details || 'Generation Failed');
            }

            const data = await response.json();

            return {
                url: data.url,
                width: 1024,
                height: 1024,
                prompt
            };
        } catch (e) {
            console.error("AI Service Error:", e);
            throw e;
        }
    },

    /**
     * REMOVE BACKGROUND
     * (Placeholder for future API integration)
     */
    removeBackground: async (imageUrl: string): Promise<string> => {
        // TODO: Integrate PhotoRoom API or similar here
        return imageUrl;
    }
};
