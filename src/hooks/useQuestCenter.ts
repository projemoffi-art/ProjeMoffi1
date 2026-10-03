'use client';

// Görev Merkezi ana verisi (quest_center). Sunucu çağrıldığında ilerlemeyi gerçek kayıtlardan ölçer ve yeni ödülleri verir;
// bu kanca o ödülleri kutlama katmanına (QuestCelebration) ve PawCoin bakiyesine iletir.
// Tazelenme: açılışta, sekmeye dönüşte, bakım kaydı değişince ve Görev Merkezi eylemlerinden sonra (QUESTS_CHANGED).

import { useCallback, useEffect, useRef, useState } from 'react';
import { questService, QUESTS_CHANGED, type QuestCenter } from '@/services/questService';
import { petCareService } from '@/services/petCareService';
import { BALANCE_CHANGED } from '@/context/DailyProgressContext';
import { celebrate } from '@/components/quests/QuestCelebration';

export function useQuestCenter(petId: string | null) {
    const [data, setData] = useState<QuestCenter | null>(null);
    const [error, setError] = useState<string | null>(null);
    const levelRef = useRef<Record<string, number>>({});
    const busyRef = useRef(false);
    const againRef = useRef(false);

    const load = useCallback(async () => {
        if (!petId) return;
        // Aynı anda tek çağrı; çağrı sürerken gelen istek bir kez daha çalıştırılır.
        if (busyRef.current) { againRef.current = true; return; }
        busyRef.current = true;
        try {
            const c = await questService.center(petId);
            setData(c);
            setError(null);
            const prev = levelRef.current[c.pet.id];
            levelRef.current[c.pet.id] = c.pet.level.level;
            const levelUp = prev !== undefined && c.pet.level.level > prev ? c.pet.level : null;
            if (c.awarded.length || c.new_badges.length || levelUp) {
                window.dispatchEvent(new Event(BALANCE_CHANGED));
                celebrate({ awarded: c.awarded, badges: c.new_badges, levelUp, petName: c.pet.name });
            }
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Görevler yüklenemedi.');
        } finally {
            busyRef.current = false;
            if (againRef.current) { againRef.current = false; void load(); }
        }
    }, [petId]);

    useEffect(() => {
        if (!petId) return;
        void load();
        const onVisible = () => { if (document.visibilityState === 'visible') void load(); };
        const onChanged = () => { void load(); };
        window.addEventListener(QUESTS_CHANGED, onChanged);
        document.addEventListener('visibilitychange', onVisible);
        const unsubCare = petCareService.subscribe(petId, onChanged);
        return () => {
            window.removeEventListener(QUESTS_CHANGED, onChanged);
            document.removeEventListener('visibilitychange', onVisible);
            unsubCare();
        };
    }, [petId, load]);

    const current = data && data.pet.id === petId ? data : null;
    return { data: current, error, reload: load };
}
