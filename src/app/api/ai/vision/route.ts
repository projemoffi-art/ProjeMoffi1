import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";
import { startAi, AI_MODEL } from "@/lib/server/aiGuard";

// Evcil hayvan fotoğraf analizi (8.52: ücretsiz günde 1, Prime 10, fazlası 30 PawCoin).
// Model yanıt vermezse uydurma sonuç DÖNÜLMEZ: sağlıkla ilgili sahte bir "sorun yok" cevabı tehlikelidir.
// Not: şu an arayüzde bu uç noktayı çağıran bir ekran yok (CLAUDE.md Bölüm 12.1).

const API_KEY = process.env.GEMINI_API_KEY || "";
const genAI = API_KEY ? new GoogleGenerativeAI(API_KEY) : null;
const MAX_IMAGE_BYTES = 4 * 1024 * 1024;

export async function POST(req: Request) {
    if (!API_KEY || !genAI) {
        return NextResponse.json({ error: "not_configured", message: "Yapay zekâ şu an kullanılamıyor." }, { status: 503 });
    }

    const { imageBase64, mimeType, actionType, petData, pay } = await req.json();
    const data = String(imageBase64 || "").split(",").pop() || "";
    if (!data) return NextResponse.json({ error: "no_image", message: "Fotoğraf bulunamadı." }, { status: 400 });
    if (data.length * 0.75 > MAX_IMAGE_BYTES) return NextResponse.json({ error: "too_large", message: "Fotoğraf en fazla 4 MB olabilir." }, { status: 413 });
    const type = ["image/jpeg", "image/png", "image/webp", "image/heic"].includes(mimeType) ? mimeType : "image/jpeg";

    const gate = await startAi("photo", "ai/vision", !!pay);
    if (!gate.ok) return gate.response;

    const petName = petData?.name || "bu evcil hayvan";
    const prompt = actionType === "food"
        ? `Bu bir kedi/köpek maması ya da içerik etiketi fotoğrafı. İçeriği oku ve ${petName} için (ırk: ${petData?.breed || "bilinmiyor"}, kilo: ${petData?.weight || "bilinmiyor"}) protein/tahıl oranını ve olası alerjenleri Türkçe, kısa ve sade anlat. Etiket okunamıyorsa bunu açıkça söyle.`
        : actionType === "health"
            ? `Bu, ${petName} adlı evcil hayvanın göz, cilt, tüy ya da dışkı fotoğrafı olabilir. Görselde gördüklerini Türkçe, sade ve kısa anlat. Teşhis koyma; en sonda mutlaka "Kesin değerlendirme için veterinerine danış." de. Belirgin bir sorun görüyorsan veterinere gitmesini açıkça öner.`
            : `Bu fotoğrafa bakarak ${petName} adlı evcil hayvanın ağzından, tatlı ve kısa (en fazla 3-4 cümle) bir durum güncellemesi yaz. Türkçe olsun.`;

    try {
        const model = genAI.getGenerativeModel({ model: AI_MODEL });
        const result = await model.generateContent([prompt, { inlineData: { data, mimeType: type } }]);
        const response = result.response;
        const text = response.text();
        await gate.finish(true, {
            inputTokens: response.usageMetadata?.promptTokenCount,
            outputTokens: response.usageMetadata?.candidatesTokenCount,
        });
        return NextResponse.json({ success: true, result: text });
    } catch (error) {
        console.error("Gemini Vision API Failed:", error);
        await gate.finish(false);
        return NextResponse.json({ error: "ai_failed", message: "Fotoğraf şu an analiz edilemedi, hakkın geri verildi. Biraz sonra tekrar dene." }, { status: 502 });
    }
}
