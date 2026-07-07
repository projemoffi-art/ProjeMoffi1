import { GoogleGenerativeAI } from "@google/generative-ai";

const API_KEY = process.env.GEMINI_API_KEY!;

// Initialize Gemini
const genAI = new GoogleGenerativeAI(API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-pro" });

export interface GeminiAnalysisResult {
    enrichedPrompt: string;
    keywords: string[];
    safetyRating: 'safe' | 'unsafe';
    language: 'tr' | 'en';
}

export const GeminiService = {
    /**
     * Analyzes and enriches the user's prompt using Google Gemini.
     * Transforms simple inputs like "kedi" into artistic descriptions.
     */
    enrichPrompt: async (userPrompt: string, style?: string): Promise<GeminiAnalysisResult> => {
        try {
            if (!API_KEY) throw new Error("GEMINI_API_KEY is missing");

            const prompt = `
            Act as an expert AI Art Prompt Engineer.
            Task: Analyze the user's input and transform it into a high-quality image generation prompt.
            
            User Input: "${userPrompt}"
            Selected Style: "${style || 'Cinematic'}"

            Output Format: JSON with these keys: 
            - "enrichedPrompt" (English, detailed, including lighting, texture, artistic style), 
            - "keywords" (Array of 3-5 main aesthetic keywords),
            - "safety" ("safe" or "unsafe" - strictly filter NSWF/Violence),
            - "lang" ("en" or "tr" - detected language of user input).

            Strictly return ONLY valid JSON.
            `;

            const result = await model.generateContent(prompt);
            const response = await result.response;
            const text = response.text();

            // Clean markdown code blocks if present
            const cleanJson = text.replace(/```json/g, '').replace(/```/g, '').trim();

            const data = JSON.parse(cleanJson);

            return {
                enrichedPrompt: data.enrichedPrompt || userPrompt,
                keywords: data.keywords || [],
                safetyRating: data.safety === 'safe' ? 'safe' : 'unsafe',
                language: data.lang || 'tr'
            };

        } catch (error) {
            console.error("Gemini Analysis Failed:", error);
            // Fallback to basic reflection
            return {
                enrichedPrompt: userPrompt,
                keywords: [],
                safetyRating: 'safe',
                language: 'tr'
            };
        }
    }
};
