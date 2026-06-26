import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

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

        // Upgraded to Gemini 2.5 Flash Lite for stable quota and high availability
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-lite" });

        // Construct history/prompt
        let systemInstruction = "You are Moffi AI, a friendly and helpful assistant for the MoffiPet Super App. You help users with pet care, app navigation, and creative ideas. Keep answers concise, and use emojis. Always answer in Turkish.";

        if (context) {
            systemInstruction += ` The user is currently on the "${context}" page.`;
        }

        if (petData) {
            systemInstruction += `\n\n[Active Pet Data Context]\n` +
                `Name: ${petData.name}\n` +
                `Breed: ${petData.breed}\n` +
                `Weight: ${petData.weight}\n` +
                `Gender: ${petData.gender}\n` +
                `Daily Water Intake: ${petData.waterCurrent} ml (Target: ${petData.waterTarget} ml)\n` +
                `Daily Calories Intake: ${petData.foodCurrent} kcal (Target: ${petData.foodTarget} kcal)\n` +
                `Vaccines Schedule: ${JSON.stringify(petData.vaccines || [])}\n\n` +
                `If the user asks questions about their pet, answer using this data. For example, if they ask if the pet drank enough water today, compare the daily water intake with the target. If they ask about vaccines, check the upcoming vaccine dates in the schedule. Answer naturally in Turkish.`;
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

            if (petData && (lastMessage.includes("su") || lastMessage.includes("içti mi") || lastMessage.includes("su miktarı"))) {
                const diff = petData.waterTarget - petData.waterCurrent;
                if (diff <= 0) {
                    fallbackResponse = `${petData.name} bugün ${petData.waterCurrent} ml su içti. Günlük hedefine (${petData.waterTarget} ml) başarıyla ulaştı! Harika! 💧🎉`;
                } else {
                    fallbackResponse = `${petData.name} bugün ${petData.waterCurrent} ml su içti. Günlük hedefine ulaşması için ${diff} ml daha su içmesi gerekiyor. 💧`;
                }
            } else if (petData && (lastMessage.includes("kalori") || lastMessage.includes("mama") || lastMessage.includes("öğün") || lastMessage.includes("yemek") || lastMessage.includes("yedi"))) {
                const diff = petData.foodTarget - petData.foodCurrent;
                if (diff <= 0) {
                    fallbackResponse = `${petData.name} bugün ${petData.foodCurrent} kcal kalori aldı. Günlük hedefine (${petData.foodTarget} kcal) ulaştı! 🍖✨`;
                } else {
                    fallbackResponse = `${petData.name} bugün ${petData.foodCurrent} kcal kalori aldı. Günlük hedefe ulaşmak için ${diff} kcal daha beslenmesi gerekiyor. 🍖`;
                }
            } else if (petData && (lastMessage.includes("aşı") || lastMessage.includes("aşıları") || lastMessage.includes("aşı takvimi"))) {
                const pendingVaccines = (petData.vaccines || []).filter((v: any) => v.status !== 'completed');
                if (pendingVaccines.length > 0) {
                    fallbackResponse = `${petData.name}'in yaklaşan aşıları:\n` + pendingVaccines.map((v: any) => `- ${v.name} (Tarih: ${v.dueDate})`).join("\n") + " 💉";
                } else {
                    fallbackResponse = `${petData.name}'in yaklaşan veya gecikmiş bir aşısı görünmüyor, harika! 💉✨`;
                }
            } else if (petData && (lastMessage.includes("kilo") || lastMessage.includes("ağırlık") || lastMessage.includes("kaç kilo"))) {
                fallbackResponse = `${petData.name}'in güncel kilosu: ${petData.weight}. ⚖️`;
            } else if (lastMessage.includes("merhaba") || lastMessage.includes("selam")) {
                fallbackResponse = `Merhaba! 😺 Ben Moffi AI. ${petData ? `${petData.name} hakkında sorularını sorabilirsin, verileri anlık takip ediyorum!` : 'Evcil hayvanının günlük hedeflerini ve aşılarını takip edebilirim.'}`;
            } else if (lastMessage.includes("nasılsın")) {
                fallbackResponse = "Harikayım, teşekkürler! Patilerim kod yazmaktan biraz yoruldu ama sizin için buradayım. 😹";
            } else {
                fallbackResponse = `Anladım. Şu an Gemini API çevrimdışı olduğundan genel sorularına cevap veremiyorum, ancak ${petData ? `${petData.name}'in su tüketimi (${petData.waterCurrent}/${petData.waterTarget} ml), kalori tüketimi (${petData.foodCurrent}/${petData.foodTarget} kcal) veya aşıları` : 'evcil hayvanının verileri'} hakkında bana soru sorabilirsin! 🐾`;
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
