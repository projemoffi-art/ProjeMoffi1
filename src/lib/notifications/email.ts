import { Resend } from 'resend';

// Initialize Resend with API key from environment
const resendApiKey = process.env.RESEND_API_KEY;
const resend = resendApiKey ? new Resend(resendApiKey) : null;

export interface SendEmailOptions {
    to: string;
    subject: string;
    html: string;
}

/**
 * Sends an email using Resend.
 * Wraps the call in a try/catch so it never crashes the main thread.
 * If RESEND_API_KEY is missing, it mocks the sending.
 */
export async function sendEmail({ to, subject, html }: SendEmailOptions) {
    if (!resend) {
        console.warn("[EMAIL MOCK] RESEND_API_KEY bulunamadı. E-posta simüle edildi:", { to, subject });
        return { success: true, simulated: true };
    }

    try {
        const fromEmail = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev';
        const data = await resend.emails.send({
            from: `Moffi <${fromEmail}>`, // Change to verified domain later via env var
            to,
            subject,
            html
        });
        
        console.log(`[EMAIL SUCCESS] E-posta başarıyla gönderildi: ${to} - ${subject}`);
        return { success: true, data };
    } catch (error) {
        console.error("[EMAIL ERROR] Resend e-posta gönderim hatası:", error);
        // We return success: false instead of throwing so it doesn't break the caller's flow
        return { success: false, error };
    }
}

// ==========================================
// EMAIL TEMPLATES
// ==========================================

export interface OrderItemData {
    name: string;
    quantity: number;
    price: number;
}

export function getOrderConfirmationHtml(orderId: string, totalAmount: number, items: OrderItemData[] = []) {
    const itemsHtml = items.map(item => `
        <tr>
            <td style="padding: 10px; border-bottom: 1px solid #eee;">${item.name}</td>
            <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: center;">${item.quantity} adet</td>
            <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">${item.price.toFixed(2)} TL</td>
        </tr>
    `).join('');

    return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
        <div style="text-align: center; padding: 20px 0;">
            <h1 style="color: #4F46E5;">Moffi</h1>
        </div>
        <div style="background-color: #f9fafb; padding: 30px; border-radius: 10px;">
            <h2 style="margin-top: 0;">Siparişiniz Onaylandı! 🎉</h2>
            <p>Sipariş numaranız: <strong>#${orderId.substring(0, 8).toUpperCase()}</strong></p>
            <p>Siparişiniz başarıyla alındı ve ödemeniz onaylandı. Satıcılarımız ürünlerinizi hazırlamaya başladı.</p>
            
            ${items.length > 0 ? `
            <table style="width: 100%; border-collapse: collapse; margin: 20px 0; background: white; border-radius: 8px; overflow: hidden;">
                <thead>
                    <tr style="background-color: #f3f4f6;">
                        <th style="padding: 10px; text-align: left;">Ürün</th>
                        <th style="padding: 10px; text-align: center;">Adet</th>
                        <th style="padding: 10px; text-align: right;">Fiyat</th>
                    </tr>
                </thead>
                <tbody>
                    ${itemsHtml}
                </tbody>
            </table>
            ` : ''}
            
            <div style="text-align: right; font-size: 18px; margin-top: 20px;">
                <strong>Toplam Tutar: ${totalAmount.toFixed(2)} TL</strong>
            </div>
        </div>
        <div style="text-align: center; padding: 20px; font-size: 12px; color: #888;">
            Bu e-posta Moffi platformu tarafından otomatik oluşturulmuştur.
        </div>
    </div>
    `;
}

export function getAppointmentConfirmationHtml(clinicName: string, date: string, time: string, petName?: string) {
    return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
        <div style="text-align: center; padding: 20px 0;">
            <h1 style="color: #4F46E5;">Moffi</h1>
        </div>
        <div style="background-color: #f9fafb; padding: 30px; border-radius: 10px;">
            <h2 style="margin-top: 0;">Randevunuz Onaylandı! 📅</h2>
            <p><strong>${clinicName}</strong> isimli klinikten aldığınız randevu talebi onaylanmıştır.</p>
            
            <div style="background-color: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #4F46E5;">
                ${petName ? `<p style="margin: 5px 0;"><strong>Dostumuz:</strong> ${petName}</p>` : ''}
                <p style="margin: 5px 0;"><strong>Tarih:</strong> ${date}</p>
                <p style="margin: 5px 0;"><strong>Saat:</strong> ${time}</p>
            </div>
            
            <p>Lütfen randevu saatinden en az 10 dakika önce klinikte olmaya özen gösterin.</p>
        </div>
        <div style="text-align: center; padding: 20px; font-size: 12px; color: #888;">
            Bu e-posta Moffi platformu tarafından otomatik oluşturulmuştur.
        </div>
    </div>
    `;
}
