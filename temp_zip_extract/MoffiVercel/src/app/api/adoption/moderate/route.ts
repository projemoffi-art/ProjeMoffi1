import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const API_KEY = process.env.GEMINI_API_KEY || "AIzaSyBnUBpO38MhK4lImGdzk0xVcus73JXGoTQ";
const genAI = new GoogleGenerativeAI(API_KEY);

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabaseAdmin = (supabaseUrl && supabaseKey)
    ? createClient(supabaseUrl, supabaseKey)
    : null;

// ─── KVKK & GÜVENLİK: Regex Tabanlı Hızlı Tarayıcı ────────────────────────
const REGEX_RULES: { pattern: RegExp; reason: string; category: string }[] = [
    // 1. Telefon numarası (KVKK Madde 6 - özel nitelikli kişisel veri)
    {
        pattern: /(\+?90|0)?[\s\-\.]?5\d{2}[\s\-\.]?\d{3}[\s\-\.]?\d{2}[\s\-\.]?\d{2}/,
        reason: "Telefon numarası paylaşımı KVKK kapsamında kişisel veri sayılır. Lütfen Moffi Güvenli Mesajlaşma'yı kullanın.",
        category: "kvkk_phone"
    },
    // 2. IBAN / Banka hesabı
    {
        pattern: /TR\d{2}\s?\d{4}\s?\d{4}\s?\d{4}\s?\d{4}\s?\d{4}\s?\d{2}/i,
        reason: "IBAN paylaşımı ücret talebi olarak değerlendirilir ve KVKK ihlali oluşturur.",
        category: "iban"
    },
    // 3. TC Kimlik Numarası
    {
        pattern: /\b[1-9]\d{10}\b/,
        reason: "TC Kimlik Numarası paylaşımı KVKK kapsamında kesinlikle yasaktır.",
        category: "kvkk_tckn"
    },
    // 4. Sosyal medya / WhatsApp linki
    {
        pattern: /wa\.me|whatsapp|t\.me\/|instagram\.com|twitter\.com|tiktok\.com|facebook\.com/i,
        reason: "Sosyal medya linkleri güvenlik nedeniyle ilanlardan kaldırılır. Moffi mesajlaşmasını kullanın.",
        category: "external_link"
    },
    // 5. E-posta adresi
    {
        pattern: /[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/,
        reason: "E-posta adresi kişisel veri sayılır (KVKK). Lütfen Moffi Güvenli Mesajlaşma'yı kullanın.",
        category: "kvkk_email"
    },
];

// ─── YASAK KELİMELER (Kategorize Edilmiş) ──────────────────────────────────
const BANNED_KEYWORDS: { words: string[]; reason: string; category: string; removable: boolean }[] = [
    {
        words: ["satılık", "satılır", "satış fiyatı", "müzayede", "açık artırma", "ihaleliyorum"],
        reason: "Moffi'de hayvan satışı kesinlikle yasaktır. Yalnızca ücretsiz sahiplendirme ilanı verilebilir.",
        category: "animal_sale",
        removable: true
    },
    {
        words: ["ücret", "ödeme", "fiyat", "para", "tl", "lira", "katkı payı", "aidat", "depozito", "masraf", "kargo ücreti", "nakliye bedeli"],
        reason: "Sahiplendirme karşılığında ücret talep etmek yasaktır.",
        category: "fee_request",
        removable: true
    },
    {
        words: ["iban", "hesap no", "banka", "havale", "eft", "papara", "paytr"],
        reason: "Ödeme bilgisi paylaşımı ücret talebi kapsamındadır.",
        category: "payment_info",
        removable: true
    },
    {
        words: ["cinsel", "erotik", "yetişkin", "+18", "18+"],
        reason: "Uygunsuz içerik topluluk standartlarını ihlal ediyor.",
        category: "explicit_content",
        removable: true
    },
    {
        words: ["döv", "işkence", "terk ettim", "kafese koydum", "zincirliyorum", "acı çektir"],
        reason: "Hayvan refahını tehdit eden içerik kabul edilmez.",
        category: "animal_abuse",
        removable: true
    },
    {
        words: ["uyuşturucu", "eroin", "kokain", "uyuştur", "esrar"],
        reason: "Yasadışı madde referansı içeriyor.",
        category: "illegal",
        removable: true
    },
];

// ─── ANA MODERASYON FONKSİYONU ──────────────────────────────────────────────
export async function POST(req: Request) {
    try {
        const { adId, name, breed, description, age } = await req.json();

        if (!adId) {
            return NextResponse.json({ error: "adId required" }, { status: 400 });
        }

        const fullText = `${name || ""} ${breed || ""} ${age || ""} ${description || ""}`.toLowerCase();

        let isSafe = true;
        let violationReason = "";
        let violationCategory = "";
        let confidence = 100;

        // ─── ADIM 1: REGEX Hızlı Tarama ────────────────────────────────────
        for (const rule of REGEX_RULES) {
            if (rule.pattern.test(fullText)) {
                isSafe = false;
                violationReason = rule.reason;
                violationCategory = rule.category;
                confidence = 99; // Regex match = yüksek güven
                break;
            }
        }

        // ─── ADIM 2: Anahtar Kelime Tarama ─────────────────────────────────
        if (isSafe) {
            for (const rule of BANNED_KEYWORDS) {
                const found = rule.words.find(word => fullText.includes(word));
                if (found) {
                    isSafe = false;
                    violationReason = rule.reason;
                    violationCategory = rule.category;
                    confidence = 95;
                    break;
                }
            }
        }

        // ─── ADIM 3: Gemini AI Derin Analiz (ancak önceki adımlar geçildiyse) ─
        if (isSafe) {
            try {
                const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
                const prompt = `
Sen Moffi Türkiye'nin içerik güvenlik yapay zekasısın.
Aşağıdaki evcil hayvan sahiplendirme ilanını analiz et.

İLAN İÇERİĞİ:
- Ad: ${name}
- Irk: ${breed}
- Yaş: ${age || "Belirtilmemiş"}
- Açıklama: ${description || "Açıklama yok"}

TÜRK PLATFORMU İÇİN ÖZEL KURALLAR:
1. Para, ücret, TL, bedel, katkı, aidat → YASAK (ilan kaldırılır)
2. Banka, IBAN, havale, EFT bilgisi → YASAK (ücret talebi sayılır)
3. Telefon, e-posta, adres paylaşımı → YASAK (KVKK ihlali)
4. WhatsApp/Instagram/Twitter linkleri → YASAK
5. Hayvan istismarı, işkence ima eden ifadeler → YASAK
6. Cinsel içerik ima → YASAK
7. Sahte/yanıltıcı bilgi (örn: farklı ırk iddiası) → YASAK

Özellikle dikkat et: "Mama masrafını karşıla", "aşı parasını ver" gibi dolaylı ücret talepleri de YASAK!

YANIT FORMAT (sadece JSON):
{
  "safe": true/false,
  "reason": "Türkçe kısa açıklama (max 120 karakter)",
  "category": "fee_request|animal_sale|kvkk_violation|explicit|abuse|fake|spam|safe",
  "confidence": 0-100,
  "tip": "Kullanıcıya pozitif öneri (ihlal varsa)"
}`;

                const result = await model.generateContent(prompt);
                const text = result.response.text().trim();
                const jsonMatch = text.match(/\{[\s\S]*\}/);

                if (jsonMatch) {
                    const parsed = JSON.parse(jsonMatch[0]);
                    if (parsed.safe === false) {
                        isSafe = false;
                        violationReason = parsed.reason ?? "İçerik uygunsuz bulundu.";
                        violationCategory = parsed.category ?? "ai_detected";
                        confidence = parsed.confidence ?? 80;
                    }
                }
            } catch (aiErr) {
                console.error("Gemini AI analysis skipped (fallback to rules only):", aiErr);
                // Regex + keyword zaten geçildi, devam et
            }
        }

        // ─── ADIM 4: Supabase Güncelleme ────────────────────────────────────
        if (!supabaseAdmin) {
            console.warn("Supabase not configured, skipping database update.");
            return NextResponse.json({
                success: true,
                safe: isSafe,
                reason: isSafe ? "İçerik güvenli (Veritabanı kaydı atlandı)" : `❌ ${violationReason}`,
                category: violationCategory || "safe",
                confidence,
                newStatus: isSafe ? "active" : "removed"
            });
        }

        const newStatus = isSafe ? "active" : "removed";
        await supabaseAdmin
            .from("adoption_ads")
            .update({
                status: newStatus,
                moderation_result: isSafe ? "✅ İçerik güvenli" : `❌ ${violationReason}`,
                moderation_passed: isSafe,
                moderated_at: new Date().toISOString()
            })
            .eq("id", adId);

        return NextResponse.json({
            success: true,
            safe: isSafe,
            reason: violationReason || "İlan güvenlik denetiminden geçti.",
            category: violationCategory || "safe",
            confidence,
            newStatus,
            // Kaldırıldıysa kullanıcıya rehber mesaj
            actionableMessage: !isSafe
                ? `İlanınız şu sebepten yayınlanamadı: ${violationReason}\n\nMoffi ilanlarında kişisel iletişim bilgisi, ücret talebi veya uygunsuz içerik bulundurulmamalıdır. İlanınızı düzenleyip tekrar gönderebilirsiniz.`
                : null
        });

    } catch (error: any) {
        console.error("Moderation Error:", error);
        return NextResponse.json(
            { error: "Moderation failed", details: error.message },
            { status: 500 }
        );
    }
}
