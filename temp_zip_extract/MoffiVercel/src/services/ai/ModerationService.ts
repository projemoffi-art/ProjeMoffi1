import { GeminiService } from "./GeminiService";

// Moffi Local Bad Word List (Basic Simulation)
const LOCAL_BAD_WORDS = [
    "küfür1", "küfür2", "hakaret1", "spam", "dolandırıcı",
    // Buraya gerçek hayatta yasaklı kelimeler eklenir
];

export interface ModerationResult {
    isSafe: boolean;
    reason: string;
    riskScore: number; // 0 to 1
    suggestedAction: 'none' | 'flag' | 'hide' | 'ban';
    detectedLanguage: string;
}

export const ModerationService = {
    /**
     * Analyzes content (text) for safety and community rules.
     */
    checkContent: async (text: string): Promise<ModerationResult> => {
        try {
            // 1. FAST LOCAL CHECK
            const lowerText = text.toLowerCase();
            const foundBadWords = LOCAL_BAD_WORDS.filter(word => lowerText.includes(word));
            
            if (foundBadWords.length > 0) {
                return {
                    isSafe: false,
                    reason: `Yerel süzgeç yakaladı: ${foundBadWords.join(', ')}`,
                    riskScore: 0.9,
                    suggestedAction: 'hide',
                    detectedLanguage: 'tr'
                };
            }

            // 2. DEEP AI CHECK (Using Gemini)
            // Note: We use Gemini because it understands context and sarcasm.
            const aiResult = await GeminiService.enrichPrompt(`
                MODERATION TASK:
                Analyze this user content for: Hate speech, violence, harassment, or illegal content.
                Content: "${text}"
                
                Rules: Moffi is a friendly pet-focused social network.
                Output requirements: Tell me if it's safe or unsafe. Give a risk score 0.0 to 1.0.
            `);

            const isSafe = aiResult.safetyRating === 'safe';
            
            return {
                isSafe,
                reason: isSafe ? "Temiz içerik" : "AI tarafından riskli bulundu",
                riskScore: isSafe ? 0.1 : 0.8,
                suggestedAction: isSafe ? 'none' : 'flag',
                detectedLanguage: aiResult.language
            };

        } catch (error) {
            console.error("Moderation Check Failed:", error);
            return {
                isSafe: true, // Fallback to safe but flag for manual review
                reason: "Sistem hatası (Süzgeç çalışmadı)",
                riskScore: 0.5,
                suggestedAction: 'flag',
                detectedLanguage: 'tr'
            };
        }
    },

    /**
     * Reports a user or post to the Admin Center.
     */
    reportItem: async (reportData: { 
        type: 'user' | 'post' | 'comment', 
        targetId: string, 
        reason: string,
        reporterId: string 
    }) => {
        console.log("Moffi Moderation: New Report Logged", reportData);
        
        const analysis = await ModerationService.checkContent(reportData.reason);
        
        // CROSS-TAB BROADCAST (Radio frequency for all Moffi tabs)
        try {
            const bc = new BroadcastChannel('moffi_moderation');
            bc.postMessage({
                type: 'ADMIN_SIGNAL',
                message: `Yeni Şikayet: ${reportData.type} - ${reportData.reason}`,
                severity: analysis.riskScore > 0.7 ? 'high' : 'normal',
                analysis
            });
            bc.close(); // Clean up
        } catch (e) {
            console.error("Broadcast failed:", e);
        }

        return { success: true, analysis };
    }
};
