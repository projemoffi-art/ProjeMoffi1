import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

const API_KEY = process.env.GEMINI_API_KEY || "";
const genAI = API_KEY ? new GoogleGenerativeAI(API_KEY) : null;

export async function POST(req: Request) {
    try {
        const { messages, context, petData } = await req.json(); // Expecting array of messages

        if (!API_KEY || !genAI) {
            return NextResponse.json(
                { error: "API Key not configured" },
                { status: 500 }
            );
        }

        // KİMLİK DOĞRULAMA (Spam / Maliyet Engeli)
        const cookieStore = cookies();
        const supabase = createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            {
                cookies: {
                    get(name: string) { return cookieStore.get(name)?.value; },
                    set() {},
                    remove() {}
                }
            }
        );

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Upgraded to Gemini 2.5 Flash Lite for stable quota and high availability
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-lite" });

        // Construct history/prompt
        let systemInstruction = "You are Moffi AI, a friendly and helpful assistant for the MoffiPet Super App. You help users with pet care, app navigation, and creative ideas. Keep answers concise, and use emojis. Always answer in Turkish.";

        if (context) {
            systemInstruction += ` The user is currently on the "${context}" page.`;
        }

        const health = petData?.health || null;
        if (petData) {
            systemInstruction += `\n\n[Aktif evcil hayvan]\nAd: ${petData.name}\nIrk: ${petData.breed}\n`;
            if (health) {
                systemInstruction += `[Sağlık Kaydı özeti — sahibin Moffi'deki kaydı]\n` +
                    `Genel durum: ${health.status}\n` +
                    `Yaklaşan/geciken işler: ${JSON.stringify(health.upcoming || [])}\n` +
                    `Kullandığı ilaçlar: ${(health.activeMedications || []).join(', ') || 'yok'}\n` +
                    `Alerjiler: ${(health.allergies || []).join(', ') || 'kayıtlı değil'}\n` +
                    `Kronik hastalıklar: ${(health.chronicConditions || []).join(', ') || 'kayıtlı değil'}\n` +
                    `Sağlık notu: ${health.notes || 'yok'}\n` +
                    `Son kilo: ${health.latestWeightKg != null ? `${health.latestWeightKg} kg` : 'ölçüm yok'}\n\n` +
                    `Evcil hayvanla ilgili sorularda sadece bu veriyi kullan; veride olmayan bir şeyi biliyormuş gibi söyleme. ` +
                    `Tıbbi teşhis koyma; ciddi belirtilerde veterinere yönlendir.`;
            } else {
                systemInstruction += 'Bu hayvanın sağlık kaydına şu an ulaşılamıyor; aşı veya ilaç sorulursa Sağlık Merkezi ekranına bakmasını söyle.';
            }
        }

        try {
            // Start chat with Gemini
            const chat = model.startChat({
                history: [
                    {
                        role: "user",
                        parts: [{ text: systemInstruction }],
                    },
                    {
                        role: "model",
                        parts: [{ text: "Understood! I am Moffi AI, ready to help." }],
                    }
                ],
                generationConfig: {
                    maxOutputTokens: 500,
                },
            });

            const lastMessage = messages[messages.length - 1].content;
            const result = await chat.sendMessage(lastMessage);
            const response = await result.response;
            const text = response.text();

            return NextResponse.json({
                success: true,
                message: text
            });
        } catch (apiError) {
            console.error("Gemini API Failed, switching to Offline Mode:", apiError);

            // OFFLINE FALLBACK MODE
            const lastMessage = messages[messages.length - 1].content.toLowerCase();
            let fallbackResponse = "";

            if (petData && (lastMessage.includes("aşı") || lastMessage.includes("parazit") || lastMessage.includes("ne zaman"))) {
                const upcoming = health?.upcoming || [];
                if (!health) {
                    fallbackResponse = `${petData.name} için sağlık kaydına şu an ulaşamıyorum; Sağlık Merkezi'nden bakabilirsin. 💉`;
                } else if (upcoming.length > 0) {
                    fallbackResponse = `${petData.name} için sıradaki işler:\n` + upcoming.map((u: any) => `- ${u.title} (${u.when})`).join("\n") + " 💉";
                } else {
                    fallbackResponse = `${petData.name} için kayıtta yaklaşan ya da geciken bir aşı veya parazit uygulaması yok. 💉`;
                }
            } else if (petData && (lastMessage.includes("ilaç") || lastMessage.includes("alerji"))) {
                fallbackResponse = health
                    ? `${petData.name} için kayıtlı ilaçlar: ${(health.activeMedications || []).join(', ') || 'yok'}. Alerjiler: ${(health.allergies || []).join(', ') || 'kayıtlı değil'}.`
                    : `${petData.name} için sağlık kaydına şu an ulaşamıyorum; Sağlık Merkezi'nden bakabilirsin.`;
            } else if (petData && (lastMessage.includes("kilo") || lastMessage.includes("ağırlık"))) {
                fallbackResponse = health?.latestWeightKg != null
                    ? `${petData.name} için son ölçülen kilo: ${health.latestWeightKg} kg. ⚖️`
                    : `${petData.name} için kayıtlı bir kilo ölçümü yok. Sağlık Merkezi → Kilo'dan ekleyebilirsin. ⚖️`;
            } else if (lastMessage.includes("merhaba") || lastMessage.includes("selam")) {
                fallbackResponse = `Merhaba! 😺 Ben Moffi AI. ${petData ? `${petData.name} hakkında sorularını sorabilirsin, verileri anlık takip ediyorum!` : 'Evcil hayvanının aşı, ilaç ve kilo kayıtları hakkında soru sorabilirsin.'}`;
            } else if (lastMessage.includes("nasılsın")) {
                fallbackResponse = "Harikayım, teşekkürler! Patilerim kod yazmaktan biraz yoruldu ama sizin için buradayım. 😹";
            } else {
                fallbackResponse = `Şu an genel sorulara cevap veremiyorum${petData ? `, ama ${petData.name}'in aşı, ilaç ve kilo kayıtlarını sorabilirsin` : ''}. 🐾`;
            }

            return NextResponse.json({
                success: true,
                message: fallbackResponse + " (Çevrimdışı Mod)"
            });
        }

    } catch (error: any) {
        console.error("AI Chat Error:", error);
        return NextResponse.json(
            { error: "Chat failed", details: error.message },
            { status: 500 }
        );
    }
}
