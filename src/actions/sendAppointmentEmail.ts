"use server";

import { sendEmail, getAppointmentConfirmationHtml } from "@/lib/notifications/email";
import { createClient } from "@supabase/supabase-js";

export interface SendAppointmentEmailProps {
    userId: string;
    clinicName: string;
    date: string;
    time: string;
    petName?: string;
}

/**
 * Server Action to send an appointment confirmation email.
 * This ensures the RESEND_API_KEY is not exposed to the client.
 * 
 * V1 NOT: Bu mekanizma client'ın tarayıcı oturumuna bağlıdır ve garantili değildir.
 * İstemci (tarayıcı) "Kabul Et" dedikten sonra interneti koparsa veritabanı güncellenir
 * ama bu e-posta gitmeyebilir. V1 için kabul edilebilir bir kısayoldur. 
 * Ölçeklenirken (Örn: B12 cron görevlerinde) doğrudan veritabanı tetikleyicisi (trigger)
 * veya arka plan kuyruğuna (background queue) taşınmalıdır.
 */
export async function sendAppointmentConfirmationEmail(props: SendAppointmentEmailProps) {
    if (!props.userId) {
        return { success: false, error: "Kullanıcı ID eksik." };
    }

    try {
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
        
        if (!supabaseUrl || !supabaseKey) {
            console.warn("Server action: Supabase admin keys missing. Cannot fetch email.");
            return { success: false, error: "Supabase config error" };
        }

        const supabaseAdmin = createClient(supabaseUrl, supabaseKey);
        const { data: userData, error: userErr } = await supabaseAdmin.auth.admin.getUserById(props.userId);

        if (userErr || !userData?.user?.email) {
            console.error("Server action: Failed to fetch user email:", userErr);
            return { success: false, error: "Email not found" };
        }

        const result = await sendEmail({
            to: userData.user.email,
            subject: "Moffi - Randevunuz Onaylandı 📅",
            html: getAppointmentConfirmationHtml(
                props.clinicName,
                props.date,
                props.time,
                props.petName
            )
        });

        return result;
    } catch (e) {
        console.error("Server Action hatası (Randevu E-posta):", e);
        return { success: false, error: e };
    }
}
