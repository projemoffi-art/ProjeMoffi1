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

function escapeHtml(value: string) {
    return value.replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch] as string));
}

// Randevu bildirimleri ve hatırlatmaları için ortak şablon (email_outbox'tan gelen metinler kullanıcı
// adları içerebildiği için mutlaka kaçışlanır).
export function getNotificationEmailHtml(heading: string, body: string, ctaUrl?: string | null) {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://app.moffi.net';
    const link = ctaUrl ? `${appUrl}${ctaUrl.startsWith('/') ? ctaUrl : `/${ctaUrl}`}` : appUrl;
    return `
    <div style="background:#F7F3EA;padding:32px 16px;font-family:Arial,Helvetica,sans-serif;color:#201B16;">
        <div style="max-width:560px;margin:0 auto;background:#ffffff;border:1px solid #ECE6D9;border-radius:16px;padding:32px;">
            <div style="font-size:20px;font-weight:800;color:#EE5B3D;margin-bottom:24px;">Moffi</div>
            <h1 style="font-size:20px;line-height:1.3;margin:0 0 12px;">${escapeHtml(heading)}</h1>
            <p style="font-size:15px;line-height:1.6;color:#6F675B;margin:0 0 24px;">${escapeHtml(body)}</p>
            <a href="${link}" style="display:inline-block;background:#EE5B3D;color:#ffffff;text-decoration:none;font-weight:700;font-size:14px;padding:12px 20px;border-radius:10px;">Moffi'de aç</a>
        </div>
        <p style="max-width:560px;margin:16px auto 0;font-size:12px;color:#6F675B;text-align:center;">
            Bu e-posta Moffi hesabındaki randevu hareketleri nedeniyle gönderildi.
        </p>
    </div>`;
}
