"use client";

import { useAuth } from "@/context/AuthContext";
import { useEffect, useState } from "react";
import { Star, MessageSquare, Clock, Search, Trash2, CheckCircle, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

export default function AdminFeedbacksPage() {
    const { user } = useAuth();
    const [feedbacks, setFeedbacks] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [filterCategory, setFilterCategory] = useState<string>("all");

    useEffect(() => {
        // MOCK: Initial mock data
        const mockFeedbacks = [
            {
                id: "fb-1",
                rating: 5,
                category: "positive",
                comment: "Harika bir uygulama, tasarımı çok kaliteli!",
                created_at: new Date().toISOString(),
                profiles: { username: "Bella", avatar_url: "https://images.unsplash.com/photo-1543466835-00a7907e9de1?q=80&w=200" }
            },
            {
                id: "fb-2",
                rating: 2,
                category: "bug",
                comment: "Giriş yaparken hata alıyorum.",
                created_at: new Date().toISOString(),
                profiles: { username: "Milo_Admin", avatar_url: "https://images.unsplash.com/photo-1543852786-1cf6624b9987?q=80&w=200" }
            }
        ];
        setFeedbacks(mockFeedbacks);
        setLoading(false);
    }, []);

    const deleteFeedback = (id: string) => {
        if (!confirm("Bu geri bildirimi silmek istediğinize emin misiniz?")) return;
        setFeedbacks(feedbacks.filter(f => f.id !== id));
    };

    const filteredFeedbacks = feedbacks.filter(f => {
        const matchesSearch = (f.profiles?.username || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
            (f.comment || "").toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCategory = filterCategory === "all" || f.category === filterCategory;
        return matchesSearch && matchesCategory;
    });

    const averageRating = feedbacks.length > 0
        ? (feedbacks.reduce((acc, curr) => acc + curr.rating, 0) / feedbacks.length).toFixed(1)
        : "0.0";

    return (
        <div className="space-y-8 animate-in fade-in duration-700">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-4xl font-black text-gray-900 tracking-tight">Geri Bildirim Merkezi</h1>
                    <p className="text-gray-500 font-medium mt-1">Kullanıcı deneyimini buradan analiz edin ve yönetin.</p>
                </div>

                <div className="flex items-center gap-3">
                    <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm text-center min-w-[120px]">
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Ort. Puan</p>
                        <div className="flex items-center justify-center gap-1">
                            <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                            <span className="text-2xl font-black text-gray-900">{averageRating}</span>
                        </div>
                    </div>
                    <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm text-center min-w-[120px]">
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Toplam Yorum</p>
                        <span className="text-2xl font-black text-gray-900">{feedbacks.length}</span>
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Kullanıcı adı veya yorum içeriğinde ara..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-12 pr-4 py-4 bg-white border border-gray-100 rounded-2xl outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all font-medium text-gray-900"
                    />
                </div>
                <div className="flex items-center gap-2">
                    {['all', 'positive', 'negative', 'bug', 'suggestion'].map((cat) => (
                        <button
                            key={cat}
                            onClick={() => setFilterCategory(cat)}
                            className={cn(
                                "px-6 py-4 rounded-2xl font-bold text-sm transition-all capitalize",
                                filterCategory === cat
                                    ? "bg-indigo-600 text-white shadow-lg shadow-indigo-200"
                                    : "bg-white text-gray-500 border border-gray-100 hover:bg-gray-50"
                            )}
                        >
                            {cat === 'all' ? 'Hepsi' : cat}
                        </button>
                    ))}
                </div>
            </div>

            {/* Grid */}
            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {[1, 2, 3, 4].map(i => (
                        <div key={i} className="h-64 bg-gray-100 animate-pulse rounded-[2.5rem]" />
                    ))}
                </div>
            ) : filteredFeedbacks.length === 0 ? (
                <div className="text-center py-32 bg-white rounded-[3rem] border border-dashed border-gray-200">
                    <MessageSquare className="w-16 h-16 text-gray-200 mx-auto mb-4" />
                    <h3 className="text-xl font-bold text-gray-400">Henüz geri bildirim bulunamadı.</h3>
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {filteredFeedbacks.map((fb) => (
                        <div key={fb.id} className="group bg-white rounded-[2.5rem] border border-gray-100 p-8 shadow-sm hover:shadow-xl transition-all duration-500 relative overflow-hidden">
                            {/* Category Indicator */}
                            <div className={cn(
                                "absolute top-0 right-0 px-6 py-2 rounded-bl-3xl text-[10px] font-black uppercase tracking-tighter",
                                fb.category === 'positive' ? "bg-green-100 text-green-600" :
                                    fb.category === 'negative' ? "bg-red-100 text-red-600" :
                                        "bg-indigo-100 text-indigo-600"
                            )}>
                                {fb.category || 'GENEL'}
                            </div>

                            <div className="flex items-start justify-between mb-6">
                                <div className="flex items-center gap-4">
                                    <div className="relative">
                                        <img
                                            src={fb.profiles?.avatar_url || "https://images.unsplash.com/photo-1543466835-00a7907e9de1?q=80&w=200"}
                                            className="w-14 h-14 rounded-2xl object-cover border-2 border-white shadow-md"
                                        />
                                        <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-white rounded-lg flex items-center justify-center shadow-sm">
                                            {fb.rating >= 4 ? <CheckCircle className="w-4 h-4 text-green-500" /> : <AlertTriangle className="w-4 h-4 text-amber-500" />}
                                        </div>
                                    </div>
                                    <div>
                                        <h4 className="font-black text-gray-900">@{fb.profiles?.username || 'Anonim'}</h4>
                                        <p className="text-xs text-gray-400 font-medium flex items-center gap-1">
                                            <Clock className="w-3 h-3" />
                                            {new Date(fb.created_at).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex gap-0.5">
                                    {[1, 2, 3, 4, 5].map((s) => (
                                        <Star key={s} className={cn("w-4 h-4", fb.rating >= s ? "text-yellow-400 fill-yellow-400" : "text-gray-200")} />
                                    ))}
                                </div>
                            </div>

                            <div className="bg-gray-50/50 rounded-3xl p-6 border border-gray-100 group-hover:bg-indigo-50/30 transition-colors h-32 overflow-y-auto no-scrollbar">
                                <p className="text-gray-700 leading-relaxed font-medium">
                                    {fb.comment || <span className="italic text-gray-400">Yorum yapılmadı.</span>}
                                </p>
                            </div>

                            <div className="mt-6 flex items-center justify-between">
                                <div className="text-[10px] font-bold text-gray-300 uppercase tracking-widest">
                                    ID: {fb.id.slice(0, 8)}
                                </div>
                                <button
                                    onClick={() => deleteFeedback(fb.id)}
                                    className="p-3 bg-red-50 text-red-500 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500 hover:text-white"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
