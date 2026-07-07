"use client";

import { useAuth, User } from "@/context/AuthContext";
import { Search, Trash2, KeyRound, Shield, MoreVertical } from "lucide-react";
import Image from "next/image";
import { useState, useEffect } from "react";

export default function AdminUsersPage() {
    const { getAllUsers, deleteUser, forgotPassword } = useAuth();
    const [users, setUsers] = useState<User[]>([]);
    const [search, setSearch] = useState("");
    const [loading, setLoading] = useState(false);

    const refreshUsers = () => {
        setUsers(getAllUsers());
    };

    useEffect(() => {
        refreshUsers();
    }, [getAllUsers]);

    const handleDelete = (id: string, email: string) => {
        if (email === 'admin@moffipet.com') {
            alert('Ana admin hesabı silinemez!');
            return;
        }
        if (confirm('Bu kullanıcıyı silmek istediğinize emin misiniz? Bu işlem geri alınamaz.')) {
            deleteUser(id);
            refreshUsers();
        }
    };

    const handleReset = async (email: string) => {
        setLoading(true);
        await forgotPassword(email);
        setLoading(false);
        alert('Sıfırlama bağlantısı (simülasyon) gönderildi.');
    };

    const filteredUsers = users.filter(u =>
        u.username.toLowerCase().includes(search.toLowerCase()) ||
        u.email.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="bg-card rounded-3xl border border-card-border shadow-moffi-card overflow-hidden">
            {/* Toolbar */}
            <div className="p-6 border-b border-card-border flex flex-col md:flex-row md:items-center justify-between gap-4">
                <h2 className="text-xl font-bold text-foreground">Kullanıcı Listesi ({filteredUsers.length})</h2>
                <div className="relative">
                    <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                        type="text"
                        placeholder="İsim veya e-posta ara..."
                        className="pl-10 pr-4 py-2 bg-gray-50 rounded-xl border-none focus:ring-2 focus:ring-slate-900 w-full md:w-64"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
                <table className="w-full text-left">
                    <thead className="bg-gray-50 text-gray-500 text-xs font-bold uppercase tracking-wider">
                        <tr>
                            <th className="px-6 py-4">Kullanıcı</th>
                            <th className="px-6 py-4">Rol</th>
                            <th className="px-6 py-4">Kayıt Tarihi</th>
                            <th className="px-6 py-4 text-right">İşlemler</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {filteredUsers.map((u) => (
                            <tr key={u.id} className="hover:bg-gray-50/50 transition-colors group">
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-gray-100 overflow-hidden relative border border-card-border">
                                            {u.avatar ? (
                                                <Image src={u.avatar} fill alt="" className="object-cover" />
                                            ) : (
                                                <span className="absolute inset-0 flex items-center justify-center font-bold text-gray-400 text-sm">
                                                    {u.username.charAt(0).toUpperCase()}
                                                </span>
                                            )}
                                        </div>
                                        <div>
                                            <div className="font-bold text-foreground">{u.username}</div>
                                            <div className="text-xs text-gray-500">{u.email}</div>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    {u.role === 'admin' ? (
                                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-purple-50 text-purple-600 text-xs font-bold">
                                            <Shield className="w-3 h-3" /> Admin
                                        </span>
                                    ) : (
                                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-gray-100 text-gray-600 text-xs font-bold">
                                            User
                                        </span>
                                    )}
                                </td>
                                <td className="px-6 py-4 text-sm text-gray-500">
                                    {new Date(u.joinedAt).toLocaleDateString()}
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button
                                            onClick={() => handleReset(u.email)}
                                            className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                            title="Şifre Sıfırla"
                                        >
                                            <KeyRound className="w-4 h-4" />
                                        </button>
                                        {u.email !== 'admin@moffipet.com' && (
                                            <button
                                                onClick={() => handleDelete(u.id, u.email)}
                                                className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                title="Kullanıcıyı Sil"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {filteredUsers.length === 0 && (
                <div className="p-10 text-center text-gray-400">
                    Kullanıcı bulunamadı.
                </div>
            )}
        </div>
    );
}
