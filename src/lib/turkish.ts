// Özel isimlere Türkçe ek getirme (ünlü uyumu + kaynaştırma). Ör. Luna'nın, Milo'nun, Zeytin'in, Karabaş'ın;
// Luna'da, Zeytin'de, Max'ta.

const VOWELS = 'aeıioöuüAEIİOÖUÜ';
const BACK = 'aıouAIOU';
const ROUNDED = 'oöuüOÖUÜ';
const HARD = 'çfhkpsştxÇFHKPSŞTX';

function lastVowel(word: string): string | null {
    for (let i = word.length - 1; i >= 0; i--) if (VOWELS.includes(word[i])) return word[i];
    return null;
}

/** İyelik (tamlayan) eki: -(n)ın/in/un/ün */
export function genitive(name: string): string {
    const n = name.trim();
    if (!n) return n;
    const v = lastVowel(n) || 'e';
    const back = BACK.includes(v);
    const round = ROUNDED.includes(v);
    const suffix = round ? (back ? 'un' : 'ün') : (back ? 'ın' : 'in');
    return `${n}'${VOWELS.includes(n[n.length - 1]) ? 'n' : ''}${suffix}`;
}

/** Bulunma eki: -da/de/ta/te */
export function locative(name: string): string {
    const n = name.trim();
    if (!n) return n;
    const v = lastVowel(n) || 'e';
    const back = BACK.includes(v);
    const hard = HARD.includes(n[n.length - 1]);
    return `${n}'${hard ? 't' : 'd'}${back ? 'a' : 'e'}`;
}
