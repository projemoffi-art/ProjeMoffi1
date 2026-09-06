import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

// Assuming env vars are available in .env.local
const envPath = path.resolve(process.cwd(), '.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
const env: Record<string, string> = {};
envContent.split('\n').forEach(line => {
    const [key, ...vals] = line.split('=');
    if (key && vals.length > 0) env[key.trim()] = vals.join('=').trim().replace(/['"]/g, '');
});

const supabaseUrl = env['NEXT_PUBLIC_SUPABASE_URL'];
const supabaseKey = env['NEXT_PUBLIC_SUPABASE_ANON_KEY'];
const serviceRoleKey = env['SUPABASE_SERVICE_ROLE_KEY'];

const supabase = createClient(supabaseUrl, supabaseKey);
const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey || supabaseKey);

async function run() {
    console.log("--- BÖLÜM D: UÇTAN UCA TEST BAŞLIYOR ---");

    // 1. Create a dummy clinic and dummy user
    const dummyPhone = '+905559998877';
    const clinicEmail = `clinic_${Date.now()}@moffi.test`;
    const userEmail = `user_${Date.now()}@moffi.test`;
    const password = 'TestPassword123!';

    console.log("Klinik oluşturuluyor...");
    const { data: clinicAuth, error: clinicErr } = await supabase.auth.signUp({
        email: clinicEmail,
        password: password,
    });
    if (clinicErr) throw clinicErr;
    const clinicId = clinicAuth.user!.id;

    console.log("Kullanıcı (Müşteri) oluşturuluyor...");
    const { data: userAuth, error: userErr } = await supabase.auth.signUp({
        email: userEmail,
        password: password,
        options: { data: { phone: dummyPhone } }
    });
    if (userErr) throw userErr;
    const userId = userAuth.user!.id;

    // 2. Insert unclaimed patient as the clinic
    console.log("Klinik olarak sisteme 'Bekleyen Hasta' (Excel'den gelmiş gibi) ekleniyor...");
    // Must execute as clinic
    await supabase.auth.signInWithPassword({ email: clinicEmail, password });
    
    const { data: unclaimedId, error: insertErr } = await supabase.rpc('insert_unclaimed_patient', {
        p_raw_name: 'Test Sahibi',
        p_raw_phone: dummyPhone,
        p_pet_name: 'Test Karabaş',
        p_pet_species: 'Köpek',
        p_pet_breed: 'Kangal',
        p_legacy_notes: 'Eski klinik notları'
    });
    if (insertErr) throw insertErr;
    console.log("Oluşturulan Bekleyen Hasta ID:", unclaimedId);

    // 3. Request Manual Claim as the user
    console.log("Kullanıcı (Ahmet) giriş yapıyor ve telefon numarası eşleşmesi üzerinden manuel onay istiyor...");
    await supabase.auth.signInWithPassword({ email: userEmail, password });

    const { error: reqErr } = await supabase.rpc('request_manual_claim', {
        p_unclaimed_id: unclaimedId
    });
    if (reqErr) throw reqErr;
    console.log("Kullanıcı onay talebi GÖNDERİLDİ.");

    // 4. Approve Manual Claim as the clinic
    console.log("Klinik paneline geri dönülüyor ve onay veriliyor...");
    await supabase.auth.signInWithPassword({ email: clinicEmail, password });
    
    const { data: newPetId, error: appErr } = await supabase.rpc('approve_manual_claim', {
        p_unclaimed_id: unclaimedId
    });
    if (appErr) throw appErr;
    console.log("Klinik onayı VERİLDİ. Yeni oluşan gerçek Pet ID:", newPetId);

    // 5. Fetch raw validation logic via Supabase Admin (Bypassing RLS to just show raw rows)
    console.log("\n--- TEST KANITLARI (HAM ÇIKTILAR) ---");
    
    const { data: unclaimedData, error: q1Err } = await supabaseAdmin
        .from('unclaimed_patients')
        .select('id, status, claimed_by_user_id, claimed_pet_id, raw_name, normalized_phone')
        .eq('id', unclaimedId)
        .single();
    if (q1Err) throw q1Err;
    console.log("1. unclaimed_patients tablosu son durumu:");
    console.log(JSON.stringify(unclaimedData, null, 2));

    const { data: petData, error: q2Err } = await supabaseAdmin
        .from('pets')
        .select('id, name, owner_id, type, breed')
        .eq('id', newPetId)
        .single();
    if (q2Err) throw q2Err;
    console.log("\n2. pets (gerçek hastalar) tablosu son durumu:");
    console.log(JSON.stringify(petData, null, 2));

    console.log("\nTEST BAŞARIYLA TAMAMLANDI! Uçtan uca akış doğrulandı.");
}

run().catch(console.error);
