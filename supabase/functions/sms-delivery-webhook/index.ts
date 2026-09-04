import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || '';
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';

serve(async (req) => {
    // CORS headers for preflight
    if (req.method === 'OPTIONS') {
        return new Response('ok', {
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
                'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
            }
        });
    }

    try {
        // Parse incoming data (could be GET query params or POST JSON/Form)
        const url = new URL(req.url);
        let messageid = url.searchParams.get('messageid') || url.searchParams.get('bulkid');
        let status = url.searchParams.get('status');

        if (req.method === 'POST') {
            try {
                // Determine content type
                const contentType = req.headers.get('content-type') || '';
                if (contentType.includes('application/json')) {
                    const body = await req.json();
                    messageid = messageid || body.messageid || body.provider_message_id;
                    status = status || body.status || body.delivery_status;
                } else if (contentType.includes('application/x-www-form-urlencoded')) {
                    const formData = await req.formData();
                    messageid = messageid || formData.get('messageid');
                    status = status || formData.get('status');
                }
            } catch (e) {
                console.warn('Failed to parse POST body:', e);
            }
        }

        if (!messageid) {
            return new Response('No messageid provided', { status: 400 });
        }

        // Map Netgsm status codes to our standard
        // Netgsm standard: 0 (Delivered), 1 (Failed/Timeout), 2 (Pending), etc.
        let mappedStatus = 'unknown';
        const strStatus = String(status).toLowerCase();
        
        if (strStatus === '0' || strStatus === 'delivered' || strStatus === 'iletildi') {
            mappedStatus = 'delivered';
        } else if (strStatus === '1' || strStatus === 'failed' || strStatus === 'hata' || strStatus === 'zaman_asimi') {
            mappedStatus = 'failed';
        } else if (strStatus === '2' || strStatus === 'pending' || strStatus === 'bekliyor') {
            mappedStatus = 'pending';
        }

        const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

        // Update the sms_log table
        const { data, error } = await supabase
            .from('sms_log')
            .update({ 
                delivery_status: mappedStatus,
                delivered_at: mappedStatus === 'delivered' ? new Date().toISOString() : null
            })
            .eq('provider_message_id', String(messageid))
            .select();

        if (error) throw error;

        return new Response(JSON.stringify({ success: true, updated: data?.length || 0 }), {
            headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
        });

    } catch (error: any) {
        console.error('Webhook error:', error);
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
        });
    }
});
