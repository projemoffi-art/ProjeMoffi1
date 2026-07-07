export interface PromptAnalysisResult {
    originalText: string;
    enrichedText: string;
    keywords: string[];
    safetyStatus: 'safe' | 'warning' | 'unsafe';
    warnings: string[];
    detectedLanguage: 'tr' | 'en';
}

import { GeminiService } from "./GeminiService";

export interface PromptAnalysisResult {
    originalText: string;
    enrichedText: string;
    keywords: string[];
    safetyStatus: 'safe' | 'warning' | 'unsafe';
    warnings: string[];
    detectedLanguage: 'tr' | 'en';
}

export const PromptLogic = {
    /**
     * Analyzes the user input using Google Gemini (Real AI).
     * Transforms simple inputs into professional art prompts.
     */
    analyzePrompt: async (text: string, selectedStyle?: string): Promise<PromptAnalysisResult> => {
        try {
            // 1. Send to Gemini for intelligent analysis & enrichment
            const geminiResult = await GeminiService.enrichPrompt(text, selectedStyle);

            return {
                originalText: text,
                enrichedText: geminiResult.enrichedPrompt,
                keywords: geminiResult.keywords,
                safetyStatus: geminiResult.safetyRating === 'unsafe' ? 'unsafe' : 'safe',
                warnings: geminiResult.safetyRating === 'unsafe' ? ['AI İçerik Politikası: Uygunsuz içerik.'] : [],
                detectedLanguage: geminiResult.language
            };
        } catch (error) {
            console.error("Gemini Critical Failure:", error);
            // Fallback only if the AI service itself is down/unreachable
            return {
                originalText: text,
                enrichedText: text,
                keywords: [],
                safetyStatus: 'safe',
                warnings: ['Yapay zeka servisine erişilemedi.'],
                detectedLanguage: 'tr'
            };
        }
    }
};
