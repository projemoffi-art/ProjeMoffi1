import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || '';
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';

serve(async (req) => {
    // CORS headers for preflight and standard responses
    if (req.method === 'OPTIONS') {
        return new Response('ok', {
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'POST',
                'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
            }
        });
    }

    try {
        const { unclaimedPatientId } = await req.json();
        const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

        const { data: patient } = await supabase
            .from('unclaimed_patients')
            .select('*')
            .eq('id', unclaimedPatientId)
            .single();
            
        if (!patient) {
            return new Response(JSON.stringify({ error: 'Kayıt bulunamadı' }), { 
                status: 404,
                headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
            });
        }

        const { data: smsSettings } = await supabase
            .from('clinic_sms_settings')
            .select('*')
            .eq('clinic_id', patient.clinic_id)
            .eq('is_active', true)
            .maybeSingle();

        const message = `Sayın ${patient.raw_name}, ${patient.pet_name || 'petiniz'} için sağlık kayıtlarınız Moffi'ye taşındı. Görmek için: https://app.moffi.net/claim`;

        if (!smsSettings) {
            // MOCK MOD — klinik henüz bağlamamış
            await supabase.from('sms_log').insert({
                unclaimed_patient_id: patient.id,
                clinic_id: patient.clinic_id,
                phone: patient.normalized_phone,
                message,
                mode: 'mock',
                status: 'logged',
                provider_response: 'Klinik SMS sağlayıcı bağlamamış, gerçek gönderim yapılmadı.',
            });
            await supabase.from('unclaimed_patients').update({ status: 'sms_sent', consent_sms_sent_at: new Date().toISOString() }).eq('id', patient.id);
            return new Response(JSON.stringify({ mode: 'mock', sent: false }), {
                headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
            });
        }

        // GERÇEK GÖNDERİM — kliniğin kendi hesabıyla
        // Generate a 6-digit random code
        const claimCode = Math.floor(100000 + Math.random() * 900000).toString();
        const messageWithCode = `${message} \nOnay Kodunuz: ${claimCode}`;

        let response;
        if (smsSettings.provider === 'netgsm') {
            response = await fetch('https://api.netgsm.com.tr/sms/send/get', {
                method: 'POST',
                // Netgsm API formatı
                body: new URLSearchParams({
                    usercode: smsSettings.api_username,
                    password: smsSettings.api_key,
                    gsmno: patient.normalized_phone.replace('+', ''), // Netgsm format needs digits
                    message: messageWithCode,
                    msgheader: smsSettings.sender_id,
                }),
            });
        }
        // (iletimerkezi branch benzer şekilde eklenir)
        else {
            throw new Error(`Bilinmeyen SMS sağlayıcısı: ${smsSettings.provider}`);
        }

        const responseText = await response.text();
        
        // Extract Netgsm bulk ID from response. Format is typically "00 123456789"
        let providerMessageId = null;
        if (smsSettings.provider === 'netgsm' && responseText.startsWith('00 ')) {
            providerMessageId = responseText.split(' ')[1]?.trim() || responseText;
        } else {
            providerMessageId = responseText; // fallback to raw response if not standard 00
        }

        await supabase.from('sms_log').insert({
            unclaimed_patient_id: patient.id,
            clinic_id: patient.clinic_id,
            phone: patient.normalized_phone,
            message: messageWithCode,
            mode: 'real',
            status: 'sent',
            provider_response: responseText,
            provider_message_id: providerMessageId
        });
        
        await supabase.from('unclaimed_patients').update({ 
            status: 'sms_sent', 
            consent_sms_sent_at: new Date().toISOString(),
            claim_code: claimCode
        }).eq('id', patient.id);
        
        return new Response(JSON.stringify({ mode: 'real', sent: true, response: responseText }), {
            headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
        });
    } catch (e: any) {
        return new Response(JSON.stringify({ error: e.message }), { 
            status: 500,
            headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
        });
    }
});
