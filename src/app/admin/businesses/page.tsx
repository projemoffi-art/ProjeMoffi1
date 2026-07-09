"use client";

import { motion } from "framer-motion";
import { Building2, Search, CheckCircle2, Shield, MoreHorizontal, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";
import { useState, useEffect } from "react";

const GlassCard = ({ children, className }: any) => (
    <div className={cn(
        "relative overflow-hidden bg-[#0A0A0E]/80 backdrop-blur-3xl border border-card-border rounded-[2.5rem] shadow-2xl",
        className
    )}>
        {children}
    </div>
);

export default function BusinessesPage() {
    const { getAllUsers } = useAuth();
    const [businesses, setBusinesses] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [search, setSearch] = useState("");

    useEffect(() => {
        const fetchBusinesses = async () => {
            try {
                setIsLoading(true);
                const allUsers = await getAllUsers();
                const businessUsers = allUsers.filter(u => u.role === 'business');
                setBusinesses(businessUsers);
            } catch (error) {
                console.error("Error fetching businesses:", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchBusinesses();
    }, []);

    const filteredBusinesses = businesses.filter(b => 
        (b.businessName || b.name || b.username || '').toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="space-y-12 pb-32 max-w-7xl mx-auto px-4 lg:px-0">
            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8">
                <div className="relative flex flex-col gap-4">
                    <div className="w-16 h-16 rounded-[1.5rem] bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
                        <Building2 className="w-8 h-8 text-blue-400" />
                    </div>
                    <motion.h1 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-5xl lg:text-7xl font-black text-white tracking-tighter uppercase leading-none"
                    >
                        İşletmeler
                    </motion.h1>
                </div>
            </div>

            <GlassCard className="p-8">
                <div className="flex items-center justify-between mb-8">
                    <h3 className="text-white font-black uppercase tracking-widest">Kayıtlı İşletmeler</h3>
                    <div className="relative">
                        <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-white/40" />
                        <input 
                            type="text" 
                            placeholder="İşletme adı ara..." 
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="bg-black/50 border border-white/10 rounded-xl pl-12 pr-4 py-3 text-sm text-white focus:outline-none focus:border-blue-500 w-64" 
                        />
                    </div>
                </div>

                <div className="w-full text-left border-collapse">
                    <div className="grid grid-cols-5 text-[10px] font-black text-white/40 uppercase tracking-widest pb-4 border-b border-white/10">
                        <div className="col-span-2">İşletme Adı</div>
                        <div>Kategori</div>
                        <div>Abonelik</div>
                        <div className="text-right">İşlem</div>
                    </div>
                    </div>
                    {isLoading ? (
                        <div className="flex justify-center items-center py-10">
                            <Loader2 className="w-6 h-6 animate-spin text-white/40" />
                        </div>
                    ) : filteredBusinesses.length === 0 ? (
                        <div className="text-center py-10 text-white/40 text-sm">
                            Kayıtlı işletme bulunamadı.
                        </div>
                    ) : (
                        filteredBusinesses.map(biz => {
                            const name = biz.businessName || biz.name || biz.username;
                            const type = biz.businessType || 'Bilinmiyor';
                            const tier = biz.subscription_status === 'pro' ? 'Platinum' : biz.is_prime ? 'Gold' : 'Free';
                            const status = biz.kybStatus === 'approved' ? 'active' : biz.kybStatus === 'pending' ? 'pending' : 'suspended';
                            
                            return (
                                <div key={biz.id} className="grid grid-cols-5 items-center py-4 border-b border-white/5 hover:bg-white/5 transition-colors cursor-pointer group">
                                    <div className="col-span-2 flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center">
                                            <Shield className="w-4 h-4 text-white/40" />
                                        </div>
                                        <div>
                                            <div className="font-bold text-white text-sm flex items-center gap-2">
                                                {name}
                                                {status === 'active' && <CheckCircle2 className="w-3 h-3 text-blue-400" />}
                                            </div>
                                            <div className="text-white/40 text-xs">ID: #{biz.id.slice(0, 8)}</div>
                                        </div>
                                    </div>
                                    <div className="text-white/60 text-sm capitalize">{type}</div>
                                    <div>
                                        <span className={cn(
                                            "px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest",
                                            tier === 'Gold' ? "bg-amber-500/20 text-amber-500" :
                                            tier === 'Platinum' ? "bg-indigo-500/20 text-indigo-400" :
                                            "bg-white/10 text-white/60"
                                        )}>
                                            {tier}
                                        </span>
                                    </div>
                                    <div className="flex justify-end">
                                        <button className="p-2 text-white/40 hover:text-white transition-colors">
                                            <MoreHorizontal className="w-5 h-5" />
                                        </button>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </GlassCard>
        </div>
    );
}
