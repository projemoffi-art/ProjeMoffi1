'use client';

// Üst kart → Petler: tüm hayvanlar (eski sağ üst "Evcil hayvanlarım" çekmecesinin yerini aldı; tek sistem).
// Dokununca o hayvan seçilir ve kart değişir. Durum rozetleri gerçek veriden: kayıp modu, geciken/yaklaşan sağlık işi.

import { useRouter } from 'next/navigation';
import { Check, IdCard, Plus } from 'lucide-react';
import { Avatar } from '@/components/social/SocialUI';
import { haptics } from '@/native';
import type { Pet } from '@/context/PetContext';
import type { CareItem } from '@/hooks/useUpcomingCare';

export function PetsTab({ pets, activePetId, careItems, onSelect, onAddPet }: {
    pets: Pet[];
    activePetId: string;
    careItems: CareItem[];
    onSelect: (id: string) => void;
    onAddPet: () => void;
}) {
    const router = useRouter();
    return (
        <div className="space-y-2">
            {pets.map(p => {
                const active = p.id === activePetId;
                const mine = careItems.filter(c => c.petId === p.id && c.daysLeft !== null);
                const overdue = mine.filter(c => (c.daysLeft ?? 0) < 0).length;
                const soon = mine.filter(c => (c.daysLeft ?? 99) >= 0 && (c.daysLeft ?? 99) <= 14).length;
                return (
                    <div key={p.id} className={`card-premium rounded-[20px] flex items-center gap-3 p-2.5 ${active ? 'ring-2 ring-accent/70' : ''}`}>
                        <button type="button" onClick={() => onSelect(p.id)} aria-pressed={active} className="flex-1 min-w-0 flex items-center gap-3 text-left">
                            <Avatar src={p.image || p.avatar} name={p.name} className="w-12 h-12 text-[18px]" />
                            <span className="min-w-0 flex-1">
                                <span className="block text-[15.5px] font-extrabold text-foreground truncate">{p.name}</span>
                                <span className="block text-[12.5px] font-semibold text-secondary truncate">{p.breed || 'Irk belirtilmemiş'}</span>
                                <span className="flex flex-wrap gap-1 mt-1">
                                    {p.is_lost && <Badge color="#D9432F">Kayıp</Badge>}
                                    {overdue > 0 && <Badge color="#D9432F">{overdue} gecikmiş sağlık işi</Badge>}
                                    {overdue === 0 && soon > 0 && <Badge color="#C9771F">{soon} yaklaşan iş</Badge>}
                                    {!p.is_lost && overdue === 0 && soon === 0 && <Badge color="#4E8A23">Her şey yolunda</Badge>}
                                </span>
                            </span>
                            {active && <span className="mr-1 w-7 h-7 rounded-full bg-accent text-white flex items-center justify-center shrink-0"><Check className="w-4 h-4" strokeWidth={3} /></span>}
                        </button>
                        <button
                            type="button"
                            aria-label={`${p.name} pasaportu`}
                            onClick={() => { haptics.tap(); onSelect(p.id); router.push('/pasaport'); }}
                            className="w-10 h-10 rounded-full bg-foreground/[0.06] flex items-center justify-center shrink-0"
                        >
                            <IdCard className="w-[18px] h-[18px] text-secondary" />
                        </button>
                    </div>
                );
            })}
            <button
                type="button"
                onClick={() => { haptics.tap(); onAddPet(); }}
                className="w-full rounded-[20px] border-2 border-dashed border-card-border flex items-center gap-3 p-2.5 text-left active:bg-foreground/[0.03]"
            >
                <span className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center"><Plus className="w-6 h-6 text-accent" /></span>
                <span className="text-[15px] font-extrabold text-accent">Yeni dost ekle</span>
            </button>
        </div>
    );
}

function Badge({ color, children }: { color: string; children: React.ReactNode }) {
    return (
        <span className="inline-flex items-center h-5 px-2 rounded-full text-[10.5px] font-extrabold" style={{ color, background: `color-mix(in srgb, ${color} 12%, transparent)` }}>
            {children}
        </span>
    );
}
