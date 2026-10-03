// Türkiye kimlik/iletişim numaralarının biçim doğrulaması (tek yer). Sunucu aynı kuralları uygular:
// tckn_is_valid, vkn_is_valid, tr_phone_e164 (20261004102000). Burada yalnızca anında geri bildirim için.
// Not: bu denetimler numaranın KURALA UYDUĞUNU gösterir, kişiye/işletmeye ait olduğunu değil (o, başvuru incelemesinde).

const digits = (raw: string) => raw.replace(/\D/g, '');

/** T.C. kimlik no: 11 hane, ilk hane 0 değil, 10. ve 11. hane kontrol basamağı. */
export function isValidTckn(raw: string): boolean {
    const s = digits(raw);
    if (!/^[1-9]\d{10}$/.test(s)) return false;
    const d = [...s].map(Number);
    const odd = d[0] + d[2] + d[4] + d[6] + d[8];
    const even = d[1] + d[3] + d[5] + d[7];
    if ((((odd * 7 - even) % 10) + 10) % 10 !== d[9]) return false;
    return d.slice(0, 10).reduce((a, b) => a + b, 0) % 10 === d[10];
}

/** Vergi kimlik no: 10 hane, son hane Gelir İdaresi kontrol basamağı. */
export function isValidVkn(raw: string): boolean {
    const s = digits(raw);
    if (!/^\d{10}$/.test(s)) return false;
    let sum = 0;
    for (let i = 0; i < 9; i++) {
        const tmp = (Number(s[i]) + 9 - i) % 10;
        let r = (tmp * 2 ** (9 - i)) % 9;
        if (tmp !== 0 && r === 0) r = 9;
        sum += r;
    }
    return (10 - (sum % 10)) % 10 === Number(s[9]);
}

/** 10 hane → vergi no, 11 hane → T.C. kimlik no kuralı. */
export const isValidTaxId = (raw: string) => (digits(raw).length === 11 ? isValidTckn(raw) : isValidVkn(raw));

/**
 * Türkiye telefonunu tek biçime getirir: "+90XXXXXXXXXX" (sabit hat 2xx/3xx/4xx, cep 5xx, 850) ya da "444XXXX".
 * Geçersizse null. "0532…", "532…", "+90 532…", "90532…" hepsi kabul edilir.
 */
export function normalizeTrPhone(raw: string): string | null {
    let s = digits(raw);
    if (/^444\d{4}$/.test(s)) return s;
    if (s.length === 12 && s.startsWith('90')) s = s.slice(2);
    else if (s.length === 11 && s.startsWith('0')) s = s.slice(1);
    if (!/^(?:[2-5]\d{2}|850)\d{7}$/.test(s)) return null;
    return '+90' + s;
}

/** Gösterim: "0532 123 45 67" / "444 12 34". Geçersizse olduğu gibi döner. */
export function formatTrPhone(raw: string): string {
    const n = normalizeTrPhone(raw);
    if (!n) return raw;
    if (n.startsWith('444')) return `444 ${n.slice(3, 5)} ${n.slice(5)}`;
    const s = n.slice(3);
    return `0${s.slice(0, 3)} ${s.slice(3, 6)} ${s.slice(6, 8)} ${s.slice(8)}`;
}
