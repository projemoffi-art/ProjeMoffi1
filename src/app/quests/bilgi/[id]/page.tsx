'use client';

// Günün Bilgisi · okuma ekranı: başlık, özet, bölümler, ipucu ve kaynak. "Okudum" bilgi kartını okunmuş sayar
// (+10 XP, günlük "Günün bilgisi" görevini tamamlar). Okuma sunucuda kaydedilir (lesson_mark_read).

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Clock } from 'lucide-react';
import { usePet } from '@/context/PetContext';
import { questService, type Lesson } from '@/services/questService';
import { LoadingBlocks } from '@/components/health/HealthUI';
import { CoralButton, QuestHeader, Tile } from '@/components/quests/QuestUI';
import { showToast } from '@/lib/utils';

export default function LessonPage() {
    const { id } = useParams<{ id: string }>();
    const { activePet } = usePet();
    const [state, setState] = useState<{ id: string; lesson: Lesson | null } | null>(null);
    const [busy, setBusy] = useState(false);
    const [justRead, setJustRead] = useState(false);

    useEffect(() => {
        if (!id) return;
        let alive = true;
        questService.lesson(id).then(lesson => alive && setState({ id, lesson })).catch(() => alive && setState({ id, lesson: null }));
        return () => { alive = false; };
    }, [id]);

    const lesson = state && state.id === id ? state.lesson : undefined;
    const read = !!lesson?.read || justRead;

    const markRead = async () => {
        if (!lesson) return;
        setBusy(true);
        try {
            const r = await questService.markLessonRead(lesson.id, activePet?.id ?? null);
            setJustRead(true);
            showToast(r.xp > 0 ? `Okundu · +${r.xp} XP` : 'Okundu olarak işaretlendi.', 'CheckCircle2', 'text-emerald-500 font-bold');
        } catch (e) {
            showToast(e instanceof Error ? e.message : 'Kaydedilemedi.', 'AlertCircle', 'text-red-500 font-bold');
        } finally {
            setBusy(false);
        }
    };

    return (
        <>
            <QuestHeader title="Günün Bilgisi" icon="💡" fallback="/quests/bilgi" />
            <div className="px-4">
                {lesson === undefined ? <LoadingBlocks count={3} /> : lesson === null ? (
                    <p className="text-center text-[14px] font-semibold text-secondary py-10">Bu bilgi bulunamadı.</p>
                ) : (
                    <article className="space-y-4">
                        <Tile emoji={lesson.emoji} tint={lesson.tint} className="w-full h-40" size="lg" />
                        <div>
                            <h1 className="text-[22px] font-extrabold leading-tight">{lesson.title}</h1>
                            <p className="text-[12.5px] font-semibold text-secondary mt-1 inline-flex items-center gap-1"><Clock className="w-3.5 h-3.5" />{lesson.read_minutes} dk okuma</p>
                        </div>
                        <p className="text-[15.5px] font-bold leading-relaxed">{lesson.summary}</p>
                        {lesson.body.map((b, i) => (
                            <section key={i}>
                                {b.h && <h2 className="text-[16px] font-extrabold mb-1">{b.h}</h2>}
                                <p className="text-[15px] font-medium text-foreground/85 leading-relaxed">{b.p}</p>
                            </section>
                        ))}
                        {lesson.tip && (
                            <div className="rounded-2xl bg-accent/5 border border-accent/15 p-4">
                                <p className="text-[12px] font-black text-accent mb-0.5">İpucu</p>
                                <p className="text-[14px] font-semibold leading-relaxed">{lesson.tip}</p>
                            </div>
                        )}
                        <p className="text-[12px] font-semibold text-secondary">
                            Kaynak: {lesson.source}.{!lesson.vet_reviewed && ' Genel bilgilendirme amaçlıdır; hayvanına özel durumlar için veterinerine danış.'}
                        </p>
                        <CoralButton onClick={markRead} disabled={busy || read}>{read ? 'Okundu ✓' : 'Okudum'}</CoralButton>
                    </article>
                )}
            </div>
        </>
    );
}
