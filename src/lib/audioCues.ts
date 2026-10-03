// Yürüyüş sesleri (tek modül): melodik sesler + isteğe bağlı sesli anons.
//
// Melodik sesler hiçbir ses dosyası kullanmadan tarayıcının Web Audio API'siyle ANINDA ÜRETİLİR (sentez):
// telif/lisans sorunu yoktur, indirme yükü yoktur ve Moffi'ye özgündür. Üç tema: Zil, Marimba, Pati.
// Sesli anons tarayıcının Web Speech API'si (cihazın kendi sesi); varsayılan kapalı.
// Tercihler bu cihazda saklanır. iOS'ta sessiz düğmesi açıksa melodik sesler de susar (sistem davranışı).
// Tarayıcılar sesin kullanıcı dokunuşuyla açılmasını ister: başlat düğmesinde unlock() çağrılır.

export type ToneTheme = 'zil' | 'marimba' | 'pati';
export type CueKind = 'start' | 'pause' | 'resume' | 'milestone' | 'goal' | 'finish';

interface AudioPrefs { tones: boolean; voice: boolean; theme: ToneTheme }
const KEY = 'moffi_walk_audio';
const DEFAULTS: AudioPrefs = { tones: true, voice: false, theme: 'zil' };

export const TONE_THEMES: { id: ToneTheme; label: string; desc: string }[] = [
    { id: 'zil', label: 'Zil', desc: 'Temiz, berrak çan' },
    { id: 'marimba', label: 'Marimba', desc: 'Sıcak, tahta tınısı' },
    { id: 'pati', label: 'Pati', desc: 'Yumuşak ve kısa' },
];

function readPrefs(): AudioPrefs {
    try { return { ...DEFAULTS, ...JSON.parse(localStorage.getItem(KEY) || '{}') }; } catch { return { ...DEFAULTS }; }
}
function writePrefs(p: AudioPrefs) {
    try { localStorage.setItem(KEY, JSON.stringify(p)); } catch { /* gizli sekme */ }
}

// --- Sentez -----------------------------------------------------------------------------------------------
let ctx: AudioContext | null = null;
function audio(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    const Ctor = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return null;
    if (!ctx) ctx = new Ctor();
    if (ctx.state === 'suspended') ctx.resume().catch(() => {});
    return ctx;
}

// Nota frekansları (Hz)
const N = { G4: 392, C5: 523.25, E5: 659.25, G5: 783.99, A5: 880, C6: 1046.5, E6: 1318.5 };

const SEQUENCES: Record<CueKind, { f: number; t: number }[]> = {
    start: [{ f: N.C5, t: 0 }, { f: N.E5, t: 0.12 }, { f: N.G5, t: 0.24 }],
    pause: [{ f: N.G5, t: 0 }, { f: N.C5, t: 0.16 }],
    resume: [{ f: N.C5, t: 0 }, { f: N.G5, t: 0.14 }],
    milestone: [{ f: N.E5, t: 0 }, { f: N.A5, t: 0.11 }],
    goal: [{ f: N.C5, t: 0 }, { f: N.E5, t: 0.09 }, { f: N.G5, t: 0.18 }, { f: N.C6, t: 0.27 }, { f: N.E6, t: 0.42 }],
    finish: [{ f: N.G4, t: 0 }, { f: N.C5, t: 0.14 }, { f: N.E5, t: 0.28 }, { f: N.G5, t: 0.42 }, { f: N.C6, t: 0.62 }],
};

function playNote(ac: AudioContext, theme: ToneTheme, freq: number, at: number, volume: number) {
    const out = ac.createGain();
    out.connect(ac.destination);
    // Her tema farklı kısmi sesler (partial) ve sönümle kendi tınısını üretir.
    const voices: { ratio: number; type: OscillatorType; gain: number; decay: number }[] =
        theme === 'zil'
            ? [{ ratio: 1, type: 'sine', gain: 0.6, decay: 1.4 }, { ratio: 2.76, type: 'sine', gain: 0.18, decay: 0.6 }, { ratio: 5.4, type: 'sine', gain: 0.07, decay: 0.3 }]
            : theme === 'marimba'
                ? [{ ratio: 1, type: 'sine', gain: 0.65, decay: 0.55 }, { ratio: 4, type: 'sine', gain: 0.2, decay: 0.12 }, { ratio: 10, type: 'sine', gain: 0.05, decay: 0.05 }]
                : [{ ratio: 0.5, type: 'triangle', gain: 0.55, decay: 0.32 }, { ratio: 1, type: 'sine', gain: 0.25, decay: 0.22 }];
    const filter = ac.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = theme === 'pati' ? 1800 : 6000;
    filter.connect(out);
    for (const v of voices) {
        const osc = ac.createOscillator();
        const g = ac.createGain();
        osc.type = v.type;
        osc.frequency.value = freq * v.ratio;
        g.gain.setValueAtTime(0.0001, at);
        g.gain.exponentialRampToValueAtTime(v.gain * volume, at + 0.012);
        g.gain.exponentialRampToValueAtTime(0.0001, at + v.decay);
        osc.connect(g).connect(filter);
        osc.start(at);
        osc.stop(at + v.decay + 0.05);
    }
}

function playCue(kind: CueKind, theme: ToneTheme, volume = 0.5) {
    const ac = audio();
    if (!ac) return;
    const now = ac.currentTime + 0.02;
    for (const n of SEQUENCES[kind]) playNote(ac, theme, n.f, now + n.t, volume);
}

// --- Sesli anons -------------------------------------------------------------------------------------------
function speak(text: string, delayMs = 0) {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    const run = () => {
        try {
            window.speechSynthesis.cancel();
            const u = new SpeechSynthesisUtterance(text);
            u.lang = 'tr-TR';
            u.rate = 1.0;
            u.volume = 0.9;
            window.speechSynthesis.speak(u);
        } catch { /* bazı sistemler dokunuş olmadan konuşmayı reddeder */ }
    };
    if (delayMs) setTimeout(run, delayMs); else run();
}

function formatPace(splitSeconds: number): string {
    const mins = Math.floor(splitSeconds / 60);
    const secs = Math.round(splitSeconds % 60);
    return secs === 0 ? `${mins} dakika` : `${mins} dakika ${secs} saniye`;
}

// --- Dışa açık arayüz ----------------------------------------------------------------------------------------
function cue(kind: CueKind, voiceText?: string) {
    const p = readPrefs();
    if (p.tones) playCue(kind, p.theme);
    if (p.voice && voiceText) speak(voiceText, p.tones ? 650 : 0);
}

export const audioCues = {
    getPrefs: readPrefs,
    setPrefs(patch: Partial<AudioPrefs>) { const next = { ...readPrefs(), ...patch }; writePrefs(next); return next; },
    /** Başlat düğmesine dokunurken çağrılır; tarayıcı sesi ancak dokunuşla açar. */
    unlock() { audio(); },
    /** Ayarlarda tema seçilince örnek çal. */
    preview(theme: ToneTheme) { audio(); playCue('start', theme); },
    walkStarted: () => cue('start', 'Yürüyüş başladı, iyi yürüyüşler!'),
    paused: () => cue('pause', 'Yürüyüş duraklatıldı.'),
    resumed: () => cue('resume', 'Yürüyüşe devam.'),
    split: (km: number, splitSeconds: number) => cue('milestone', `${km} kilometre tamamlandı. Bu kilometreyi ${formatPace(splitSeconds)}de yürüdün.`),
    goalReached: () => cue('goal', 'Tebrikler, günlük hedefe ulaştın!'),
    autoPaused: () => cue('pause', 'Hareketsizlik algılandı, yürüyüş duraklatıldı.'),
    autoResumed: () => cue('resume', 'Hareket algılandı, devam ediliyor.'),
    walkFinished: (distanceKm: number) => cue('finish', `Harika bir yürüyüş! Toplam ${distanceKm.toFixed(1).replace('.', ',')} kilometre.`),
};
