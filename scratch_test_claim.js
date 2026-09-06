"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
var supabase_js_1 = require("@supabase/supabase-js");
var fs = require("fs");
var path = require("path");
// Assuming env vars are available in .env.local
var envPath = path.resolve(process.cwd(), '.env.local');
var envContent = fs.readFileSync(envPath, 'utf8');
var env = {};
envContent.split('\n').forEach(function (line) {
    var _a = line.split('='), key = _a[0], vals = _a.slice(1);
    if (key && vals.length > 0)
        env[key.trim()] = vals.join('=').trim().replace(/['"]/g, '');
});
var supabaseUrl = env['NEXT_PUBLIC_SUPABASE_URL'];
var supabaseKey = env['NEXT_PUBLIC_SUPABASE_ANON_KEY'];
var serviceRoleKey = env['SUPABASE_SERVICE_ROLE_KEY'];
var supabase = (0, supabase_js_1.createClient)(supabaseUrl, supabaseKey);
var supabaseAdmin = (0, supabase_js_1.createClient)(supabaseUrl, serviceRoleKey || supabaseKey);
function run() {
    return __awaiter(this, void 0, void 0, function () {
        var dummyPhone, clinicEmail, userEmail, password, _a, clinicAuth, clinicErr, clinicId, _b, userAuth, userErr, userId, _c, unclaimedId, insertErr, reqErr, _d, newPetId, appErr, _e, unclaimedData, q1Err, _f, petData, q2Err;
        return __generator(this, function (_g) {
            switch (_g.label) {
                case 0:
                    console.log("--- BÖLÜM D: UÇTAN UCA TEST BAŞLIYOR ---");
                    dummyPhone = '+905559998877';
                    clinicEmail = "clinic_".concat(Date.now(), "@moffi.test");
                    userEmail = "user_".concat(Date.now(), "@moffi.test");
                    password = 'TestPassword123!';
                    console.log("Klinik oluşturuluyor...");
                    return [4 /*yield*/, supabase.auth.signUp({
                            email: clinicEmail,
                            password: password,
                        })];
                case 1:
                    _a = _g.sent(), clinicAuth = _a.data, clinicErr = _a.error;
                    if (clinicErr)
                        throw clinicErr;
                    clinicId = clinicAuth.user.id;
                    console.log("Kullanıcı (Müşteri) oluşturuluyor...");
                    return [4 /*yield*/, supabase.auth.signUp({
                            email: userEmail,
                            password: password,
                            options: { data: { phone: dummyPhone } }
                        })];
                case 2:
                    _b = _g.sent(), userAuth = _b.data, userErr = _b.error;
                    if (userErr)
                        throw userErr;
                    userId = userAuth.user.id;
                    // 2. Insert unclaimed patient as the clinic
                    console.log("Klinik olarak sisteme 'Bekleyen Hasta' (Excel'den gelmiş gibi) ekleniyor...");
                    // Must execute as clinic
                    return [4 /*yield*/, supabase.auth.signInWithPassword({ email: clinicEmail, password: password })];
                case 3:
                    // Must execute as clinic
                    _g.sent();
                    return [4 /*yield*/, supabase.rpc('insert_unclaimed_patient', {
                            p_raw_name: 'Test Sahibi',
                            p_raw_phone: dummyPhone,
                            p_pet_name: 'Test Karabaş',
                            p_pet_species: 'Köpek',
                            p_pet_breed: 'Kangal',
                            p_legacy_notes: 'Eski klinik notları'
                        })];
                case 4:
                    _c = _g.sent(), unclaimedId = _c.data, insertErr = _c.error;
                    if (insertErr)
                        throw insertErr;
                    console.log("Oluşturulan Bekleyen Hasta ID:", unclaimedId);
                    // 3. Request Manual Claim as the user
                    console.log("Kullanıcı (Ahmet) giriş yapıyor ve telefon numarası eşleşmesi üzerinden manuel onay istiyor...");
                    return [4 /*yield*/, supabase.auth.signInWithPassword({ email: userEmail, password: password })];
                case 5:
                    _g.sent();
                    return [4 /*yield*/, supabase.rpc('request_manual_claim', {
                            p_unclaimed_id: unclaimedId
                        })];
                case 6:
                    reqErr = (_g.sent()).error;
                    if (reqErr)
                        throw reqErr;
                    console.log("Kullanıcı onay talebi GÖNDERİLDİ.");
                    // 4. Approve Manual Claim as the clinic
                    console.log("Klinik paneline geri dönülüyor ve onay veriliyor...");
                    return [4 /*yield*/, supabase.auth.signInWithPassword({ email: clinicEmail, password: password })];
                case 7:
                    _g.sent();
                    return [4 /*yield*/, supabase.rpc('approve_manual_claim', {
                            p_unclaimed_id: unclaimedId
                        })];
                case 8:
                    _d = _g.sent(), newPetId = _d.data, appErr = _d.error;
                    if (appErr)
                        throw appErr;
                    console.log("Klinik onayı VERİLDİ. Yeni oluşan gerçek Pet ID:", newPetId);
                    // 5. Fetch raw validation logic via Supabase Admin (Bypassing RLS to just show raw rows)
                    console.log("\n--- TEST KANITLARI (HAM ÇIKTILAR) ---");
                    return [4 /*yield*/, supabaseAdmin
                            .from('unclaimed_patients')
                            .select('id, status, claimed_by_user_id, claimed_pet_id, raw_name, normalized_phone')
                            .eq('id', unclaimedId)
                            .single()];
                case 9:
                    _e = _g.sent(), unclaimedData = _e.data, q1Err = _e.error;
                    if (q1Err)
                        throw q1Err;
                    console.log("1. unclaimed_patients tablosu son durumu:");
                    console.log(JSON.stringify(unclaimedData, null, 2));
                    return [4 /*yield*/, supabaseAdmin
                            .from('pets')
                            .select('id, name, owner_id, type, breed')
                            .eq('id', newPetId)
                            .single()];
                case 10:
                    _f = _g.sent(), petData = _f.data, q2Err = _f.error;
                    if (q2Err)
                        throw q2Err;
                    console.log("\n2. pets (gerçek hastalar) tablosu son durumu:");
                    console.log(JSON.stringify(petData, null, 2));
                    console.log("\nTEST BAŞARIYLA TAMAMLANDI! Uçtan uca akış doğrulandı.");
                    return [2 /*return*/];
            }
        });
    });
}
run().catch(console.error);
