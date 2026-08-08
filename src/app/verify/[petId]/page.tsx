import { createClient } from '@supabase/supabase-js';
import { ShieldCheck, ShieldAlert, PawPrint } from 'lucide-react';

export const dynamic = 'force-dynamic';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default async function VerifyPetPage({ params }: { params: Promise<{ petId: string }> }) {
    const { petId } = await params;

    const { data, error } = await supabase
        .rpc('get_pet_verification_info', { p_pet_id: petId })
        .single();

    if (error || !data) {
        return (
            <div style={{padding: 20, fontFamily: 'monospace', fontSize: 12, wordBreak: 'break-all'}}>
                <h1>DEBUG MODU</h1>
                <p>petId: {petId}</p>
                <p>error: {JSON.stringify(error, null, 2)}</p>
                <p>data: {JSON.stringify(data, null, 2)}</p>
            </div>
        );
    }

    const d = data as any;

    return (
        <div className="min-h-screen flex flex-col items-center justify-center gap-6 p-6 bg-gray-50">
            <div className="w-full max-w-sm bg-white rounded-3xl shadow-lg border border-gray-100 p-6 text-center">
                {d.avatar_url && (
                    <img src={d.avatar_url} className="w-20 h-20 rounded-2xl object-cover mx-auto mb-4" />
                )}
                <h1 className="text-xl font-black">{d.pet_name}</h1>
                <p className="text-xs text-gray-500 mb-4">{d.species} • {d.breed}</p>

                <div className={`flex items-center justify-center gap-2 py-3 rounded-xl font-black text-sm ${
                    d.is_vaccination_current ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                }`}>
                    {d.is_vaccination_current ? <ShieldCheck className="w-5 h-5" /> : <ShieldAlert className="w-5 h-5" />}
                    {d.is_vaccination_current ? 'Aşıları Güncel' : 'Gecikmiş Aşı Var'}
                </div>

                {d.latest_vaccines?.length > 0 && (
                    <div className="mt-4 text-left space-y-1">
                        <p className="text-[10px] font-black text-gray-400 uppercase">Son Aşılar</p>
                        {d.latest_vaccines.map((v: any, i: number) => (
                            <div key={i} className="flex justify-between text-xs">
                                <span className="font-bold text-gray-700">{v.name}</span>
                                <span className="text-gray-400 font-mono">{v.date}</span>
                            </div>
                        ))}
                    </div>
                )}

                <p className="text-[9px] text-gray-400 mt-6">Moffi tarafından doğrulanmış dijital kayıt</p>
            </div>
        </div>
    );
}
