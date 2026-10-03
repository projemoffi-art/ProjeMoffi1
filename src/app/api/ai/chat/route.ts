import { GoogleGenerativeAI, type Content } from "@google/generative-ai";
import { NextResponse } from "next/server";
import { startAi, AI_MODEL } from "@/lib/server/aiGuard";

// Moffi AI sohbeti. Hak/kota aiGuard'da (8.60). Hayvan bilgisi istemciden gelir ama yalnızca sahibinin kendi
// kaydıdır (asistan herkese açık değil). Model yanıt veremezse hak iade edilir ve uydurma cevap dönülmez.

const API_KEY = process.env.GEMINI_API_KEY || "";
const genAI = API_KEY ? new GoogleGenerativeAI(API_KEY) : null;

const MAX_HISTORY = 12;
const MAX_CHARS = 2000;

const TONE: Record<string, string> = {
    friendly: "Sıcak, samimi ve cesaret verici bir dille konuş; ölçülü emoji kullanabilirsin.",
    professional: "Net, sakin ve bilgiye dayalı bir dille konuş; emoji kullanma.",
    protective: "Sağlık ve güvenlik konusunda dikkatli ol; riskleri açıkça belirt ve gerektiğinde veterinere yönlendir.",
};
const LENGTH: Record<string, { text: string; tokens: number }> = {
    short: { text: "Yanıtların kısa olsun (en fazla 3-4 cümle ya da birkaç madde).", tokens: 350 },
    medium: { text: "Yanıtların orta uzunlukta olsun; gerekirse kısa maddeler kullan.", tokens: 600 },
    long: { text: "Gerektiğinde ayrıntılı yanıt ver; başlık yerine kısa paragraflar ve maddeler kullan.", tokens: 900 },
};

function clean(value: unknown, max = 200): string {
    return String(value ?? "").replace(/\s+/g, " ").trim().slice(0, max);
}

type List = unknown[] | undefined;
interface PetPayload {
    name?: unknown; species?: unknown; breed?: unknown; age?: unknown; sex?: unknown; neutered?: unknown; weightKg?: unknown;
    health?: { status?: unknown; upcoming?: { title?: unknown; when?: unknown }[]; activeMedications?: List; allergies?: List; chronicConditions?: List; notes?: unknown } | null;
    walks?: { todayKm?: unknown; todaySteps?: unknown; goalSteps?: unknown; weekCount?: unknown; weekKm?: unknown } | null;
}
interface Prefs { personality?: string; detailLevel?: string }
interface ChatBody { messages?: unknown; petData?: PetPayload | null; prefs?: Prefs; page?: unknown; pay?: unknown }

function buildSystem(petData: PetPayload | null | undefined, prefs: Prefs | undefined, page: string): string {
    const tone = TONE[prefs?.personality || ""] || TONE.friendly;
    const length = (LENGTH[prefs?.detailLevel || ""] || LENGTH.medium).text;
    let s =
        "Sen Moffi AI'sın: Moffi uygulamasında evcil hayvan sahiplerine yardım eden asistan. Her zaman Türkçe yanıt ver.\n" +
        `${tone} ${length}\n` +
        "Kurallar:\n" +
        "- Tıbbi teşhis koyma ve ilaç dozu önerme; belirtilerde olası nedenleri genel olarak açıkla, ne zaman veterinere gidilmesi gerektiğini söyle.\n" +
        "- Acil belirtilerde (nefes darlığı, zehirlenme şüphesi, bilinç kaybı, durmayan kanama, şişkin ve sert karın, nöbet) ilk cümlede hemen veterinere gitmesini söyle.\n" +
        "- Hayvanın kayıtlı bilgilerini kullan; kayıtta olmayan bir şeyi biliyormuş gibi davranma.\n" +
        "- Uygulamadaki yerleri gerektiğinde adıyla söyle: Sağlık Merkezi (aşı, ilaç, kilo, belgeler), Veteriner (klinik bul, randevu), Yürüyüş, Kayıp İlanları, Sahiplendirme, Market.\n" +
        "- Markdown başlık ve tablo kullanma; kalın yazı ve '- ' ile başlayan maddeler kullanabilirsin.\n";
    if (page) s += `Kullanıcı şu an uygulamanın "${clean(page, 60)}" ekranında.\n`;

    if (petData && typeof petData === "object") {
        s += "\n[Sorulan evcil hayvan]\n";
        s += `Ad: ${clean(petData.name, 60)}\n`;
        if (petData.species) s += `Tür: ${clean(petData.species, 30)}\n`;
        if (petData.breed) s += `Irk: ${clean(petData.breed, 60)}\n`;
        if (petData.age) s += `Yaş: ${clean(petData.age, 40)}\n`;
        if (petData.sex) s += `Cinsiyet: ${clean(petData.sex, 20)}\n`;
        if (petData.neutered != null) s += `Kısırlaştırılmış: ${petData.neutered ? "evet" : "hayır"}\n`;
        if (petData.weightKg) s += `Kayıtlı kilo: ${Number(petData.weightKg)} kg\n`;
        const h = petData.health;
        if (h) {
            s += "[Sağlık kaydı özeti]\n" +
                `Genel durum: ${clean(h.status, 80)}\n` +
                `Yaklaşan/geciken işler: ${(h.upcoming || []).slice(0, 6).map(u => `${clean(u.title, 60)} (${clean(u.when, 30)})`).join("; ") || "yok"}\n` +
                `Kullandığı ilaçlar: ${(h.activeMedications || []).slice(0, 6).map((m: unknown) => clean(m, 80)).join("; ") || "yok"}\n` +
                `Alerjiler: ${(h.allergies || []).slice(0, 10).map((a: unknown) => clean(a, 40)).join(", ") || "kayıtlı değil"}\n` +
                `Kronik hastalıklar: ${(h.chronicConditions || []).slice(0, 10).map((a: unknown) => clean(a, 60)).join(", ") || "kayıtlı değil"}\n` +
                `Sağlık notu: ${clean(h.notes, 300) || "yok"}\n`;
        } else {
            s += "Sağlık kaydına şu an ulaşılamıyor; aşı veya ilaç sorulursa Sağlık Merkezi'ne bakmasını söyle.\n";
        }
        const w = petData.walks;
        if (w) {
            s += "[Yürüyüş]\n" +
                `Bugün: ${Math.round(Number(w.todaySteps || 0))} adım (${Number(w.todayKm || 0).toFixed(2)} km), günlük hedef ${Math.round(Number(w.goalSteps || 0))} adım\n` +
                `Son 7 gün: ${Number(w.weekCount || 0)} yürüyüş, toplam ${Number(w.weekKm || 0).toFixed(1)} km\n`;
        }
    }
    return s;
}

export async function POST(req: Request) {
    let body: ChatBody;
    try { body = await req.json(); } catch { return NextResponse.json({ error: "bad_request", message: "Geçersiz istek." }, { status: 400 }); }

    const raw = Array.isArray(body?.messages) ? body.messages : [];
    const messages = raw
        .filter((m): m is { role: "user" | "assistant"; content: string } => {
            const r = m as { role?: unknown; content?: unknown } | null;
            return !!r && (r.role === "user" || r.role === "assistant") && typeof r.content === "string" && !!r.content.trim();
        })
        .slice(-MAX_HISTORY)
        .map(m => ({ role: m.role, content: m.content.slice(0, MAX_CHARS) }));
    const last = messages[messages.length - 1];
    if (!last || last.role !== "user") {
        return NextResponse.json({ error: "bad_request", message: "Soru bulunamadı." }, { status: 400 });
    }

    if (!genAI) {
        return NextResponse.json({ error: "not_configured", message: "Moffi AI şu an kullanılamıyor." }, { status: 503 });
    }

    // Giriş + günlük hak (ücretsiz/Prime, bitince PawCoin ile ek hak)
    const gate = await startAi("message", "ai/chat", !!body?.pay);
    if (!gate.ok) return gate.response;

    const lengthPref = LENGTH[body?.prefs?.detailLevel || ""] || LENGTH.medium;
    const model = genAI.getGenerativeModel({
        model: AI_MODEL,
        systemInstruction: buildSystem(body?.petData, body?.prefs, clean(body?.page, 60)),
        generationConfig: { maxOutputTokens: lengthPref.tokens, temperature: 0.6 },
    });

    // Gemini geçmişi kullanıcıyla başlamalı ve sırayla ilerlemeli.
    const history: Content[] = [];
    for (const m of messages.slice(0, -1)) {
        const role = m.role === "user" ? "user" : "model";
        if (history.length === 0 && role !== "user") continue;
        const prev = history[history.length - 1];
        if (prev && prev.role === role) prev.parts.push({ text: m.content });
        else history.push({ role, parts: [{ text: m.content }] });
    }
    // Yanıtsız kalmış önceki soru (ör. bağlantı koptu) son soruyla birleştirilir; ardışık iki kullanıcı turu olmaz.
    let outgoing = last.content;
    if (history.length && history[history.length - 1].role === "user") {
        const pending = history.pop()!;
        outgoing = [...pending.parts.map(p => p.text || ""), outgoing].join("\n");
    }

    try {
        const chat = model.startChat({ history });
        const result = await chat.sendMessage(outgoing);
        const response = result.response;
        const text = response.text().trim();
        if (!text) throw new Error("Boş yanıt");
        await gate.finish(true, {
            inputTokens: response.usageMetadata?.promptTokenCount,
            outputTokens: response.usageMetadata?.candidatesTokenCount,
        });
        return NextResponse.json({ success: true, message: text });
    } catch (error) {
        console.error("Moffi AI yanıt veremedi:", error);
        // Hak geri verilir (PawCoin ile alındıysa iade edilir); uydurma yanıt dönülmez.
        await gate.finish(false);
        return NextResponse.json(
            { error: "model_failed", message: "Şu an yanıt veremedim, hakkın iade edildi. Birazdan tekrar dener misin?" },
            { status: 503 },
        );
    }
}
