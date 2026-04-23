"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    User, Bell, Lock, HelpCircle, 
    LogOut, ChevronRight, MessageCircle, 
    Activity, X, Check, ShieldAlert, MapPin, ShieldCheck, 
    Radar, Palette, Smartphone, Footprints,
    Fingerprint, Heart, Send, Sparkles, Zap, Shield, BrainCircuit,
    Settings, Database, Trash2, Cpu, Globe, Laptop,
    ShieldPlus, Download, Info, ArrowLeft, MoreVertical,
    Users, Eye, MessageSquare, Tag, Plus,
    ArrowRight, Monitor, Layout,
    EyeOff, BellRing, Mail, AlertTriangle,
    Clock, Moon, Sun, Timer, Coffee, Type, Glasses, Layers, Briefcase, Crown
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { exportUserData } from '@/lib/utils/dataExport';

interface SettingsDrawerProps {
    isOpen: boolean;
    onClose: () => void;
}

type DrawerView = 'main' | 'activity' | 'blocked' | 'words' | 'stories' | 'wellbeing' | 'accessibility' | 'password' | 'privacy' | 'notifications' | 'sos_config' | 'appearance_detail';

// --- Shared Interfaces ---
interface SectionProps {
    title: string;
    children: React.ReactNode;
}

interface ToggleRowProps {
    icon: any;
    label: string;
    desc: string;
    category: string;
    id: string;
    color?: string;
    user: any;
    onToggle: (category: any, settingId: string) => void;
}

interface ActionRowProps {
    icon: any;
    label: string;
    desc?: string;
    onClick?: () => void;
    danger?: boolean;
    rightElement?: React.ReactNode;
}

interface ViewProps {
    user: any;
    setView: (view: DrawerView) => void;
    updateSettings: any;
    handleToggle: (category: any, id: string) => void;
    handleExport: () => void;
    isExporting: boolean;
    onClose: () => void;
    logout: () => void;
    handleResetSystem: () => void;
    exportStatus?: string;
    fontSize?: string;
    setFontSize?: (s: any) => void;
    colorBlindMode?: string;
    setColorBlindMode?: (m: any) => void;
    boldText?: boolean;
    setBoldText?: (v: boolean) => void;
    highContrast?: boolean;
    setHighContrast?: (v: boolean) => void;
    reduceMotion?: boolean;
    setReduceMotion?: (v: boolean) => void;
    reduceTransparency?: boolean;
    setReduceTransparency?: (v: boolean) => void;
    newWord?: string;
    setNewWord?: (s: string) => void;
    handleAddWord?: () => void;
    handleRemoveWord?: (s: string) => void;
    handleUnblock?: (id: string) => void;
    terminateSession?: (id: string) => void;
    terminateAllOtherSessions?: () => void;
    changePassword?: (old: string, newP: string) => Promise<{ success: boolean; error?: string }>;
    theme?: any;
    setTheme?: (t: any) => void;
}

// --- Helper Components ---
const Section = React.memo(({ title, children }: SectionProps) => (
    <div className="mb-8 transform-gpu">
        <div className="px-3 mb-2">
            <p className="text-[11px] font-black text-secondary uppercase tracking-[0.3em]">{title}</p>
        </div>
        <div className="space-y-0 relative">
            {children}
        </div>
    </div>
));
Section.displayName = 'Section';

const ToggleRow = React.memo(({ icon: Icon, label, desc, category, id, color, user, onToggle }: ToggleRowProps) => {
    const isActive = (user?.settings as any)?.[category]?.[id];
    return (
        <button 
            onClick={() => onToggle(category, id)}
            className="w-full flex items-center justify-between py-2.5 px-2 hover:bg-foreground/[0.03] transition-all group border-b border-card-border last:border-0 rounded-2xl transform-gpu will-change-transform text-left"
        >
            <div className="flex items-center gap-3">
                <div className={cn("flex items-center justify-center transition-transform group-hover:scale-110", color ? `text-accent` : "text-foreground/40")}>
                    <Icon className="w-4 h-4" />
                </div>
                <div>
                    <p className="text-[12px] font-black text-foreground uppercase tracking-tight leading-none">{label}</p>
                    <p className="text-[9px] text-secondary mt-1 leading-none font-bold max-w-[200px] uppercase tracking-tighter">{desc}</p>
                </div>
            </div>
            <div 
                className={cn(
                    "w-8 h-4.5 rounded-full transition-all relative border border-card-border shrink-0",
                    isActive ? "bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.3)] border-transparent" : "bg-foreground/5"
                )}
            >
                <div className={cn("absolute top-0.5 w-3.5 h-3.5 rounded-full bg-white transition-all shadow-sm", isActive ? "left-4" : "left-0.5")} />
            </div>
        </button>
    );
});
ToggleRow.displayName = 'ToggleRow';

const ActionRow = React.memo(({ icon: Icon, label, desc, onClick, danger, rightElement }: ActionRowProps) => (
    <button
        onClick={onClick}
        className={cn(
            "w-full flex items-center justify-between py-3 px-2 hover:bg-foreground/[0.03] transition-all active:scale-[0.98] group text-left border-b border-card-border last:border-0 rounded-2xl transform-gpu will-change-transform",
            danger && "hover:bg-red-500/5"
        )}
    >
        <div className="flex items-center gap-3">
            <div className={cn(
                "flex items-center justify-center transition-transform group-hover:scale-110",
                danger ? "text-red-500" : "text-foreground/40"
            )}>
                <Icon className="w-4 h-4" />
            </div>
            <div>
                <span className={cn("font-bold text-[12px] uppercase tracking-tight leading-none", danger ? "text-red-500/80" : "text-foreground/90")}>{label}</span>
                {desc && <p className="text-[8.5px] text-foreground/30 mt-0.5 leading-none font-medium">{desc}</p>}
            </div>
        </div>
        {rightElement ? rightElement : <ChevronRight className={cn("w-3 h-3 opacity-20 group-hover:opacity-60 transition-all group-hover:translate-x-0.5", danger ? "text-red-500" : "text-foreground/60")} />}
    </button>
));
ActionRow.displayName = 'ActionRow';

const ChoiceRow = React.memo(({ label, options, current, onSelect, category, field }: { label: string, options: any[], current: string, onSelect: any, category: string, field: string }) => (
    <div className="py-3 px-2 border-b border-foreground/[0.03] last:border-0 transform-gpu">
        <p className="text-[10px] font-black text-foreground/20 uppercase tracking-[0.2em] mb-3 px-1">{label}</p>
        <div className="flex gap-1.5 overflow-x-auto no-scrollbar scroll-smooth">
            {options.map((opt) => (
                <button
                    key={opt.id}
                    onClick={() => onSelect(category, { [field]: opt.id })}
                    className={cn(
                        "px-4 py-2 rounded-lg text-[10px] font-black uppercase transition-all whitespace-nowrap",
                        current === opt.id ? "bg-foreground text-background shadow-lg shadow-foreground/10" : "bg-foreground/[0.03] text-foreground/40 hover:bg-foreground/5 text-shadow-none"
                    )}
                >
                    {opt.label}
                </button>
            ))}
        </div>
    </div>
));
ChoiceRow.displayName = 'ChoiceRow';

const SliderRow = React.memo(({ label, value, min, max, unit, onChange, category, field }: { label: string, value: number, min: number, max: number, unit?: string, onChange: any, category: string, field: string }) => (
    <div className="py-4 px-2 border-b border-card-border last:border-0 hover:bg-foreground/[0.01] transition-all rounded-2xl transform-gpu will-change-transform">
        <div className="flex justify-between items-center mb-3 px-1 text-shadow-none">
            <p className="text-[10px] font-black text-secondary uppercase tracking-[0.2em]">{label}</p>
            <p className="text-[14px] font-black text-foreground italic tracking-tighter">{value}<span className="text-[9px] not-italic text-secondary ml-1 uppercase">{unit}</span></p>
        </div>
        <div className="px-1">
            <input 
                type="range" 
                min={min} 
                max={max} 
                step="1" 
                value={value} 
                onChange={(e) => onChange(category, { [field]: parseInt(e.target.value) })}
                className="w-full h-[3px] bg-foreground/10 rounded-full appearance-none accent-accent transition-all cursor-pointer" 
            />
        </div>
    </div>
));
SliderRow.displayName = 'SliderRow';

// --- View Components ---
const MainView = ({ user, setView, handleToggle, handleExport, isExporting, exportStatus, onClose, logout, handleResetSystem, updateSettings }: ViewProps) => (
    <motion.div 
        initial={{ x: -20, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        exit={{ x: -20, opacity: 0 }}
        className="flex-1 overflow-y-auto pr-2 scroll-smooth space-y-4 custom-scrollbar"
        style={{ maxHeight: 'calc(94vh - 180px)' }}
    >
        {/* PREMIUM BANNER */}
        <div className="mx-2 mb-6 mt-2 relative group overflow-hidden rounded-[2rem] border border-accent/30 bg-card p-5 shadow-lg cursor-pointer" onClick={() => window.dispatchEvent(new CustomEvent('open-premium-modal'))}>
            <div className="absolute top-0 right-0 w-32 h-32 bg-accent/10 blur-3xl group-hover:bg-accent/20 transition-all rounded-full" />
            <div className="relative flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-[1.2rem] bg-accent p-0.5 shadow-lg flex items-center justify-center">
                        <div className="w-full h-full bg-card rounded-xl flex items-center justify-center">
                            <Crown className="w-6 h-6 text-accent" />
                        </div>
                    </div>
                    <div>
                        <h4 className="text-[13px] font-black text-foreground uppercase tracking-widest flex items-center gap-2">Moffi Prime <Sparkles className="w-3 h-3 text-accent" /></h4>
                        <p className="text-[9px] text-accent font-medium uppercase tracking-widest mt-1">Ayrıcalıkların Kilidini Aç</p>
                    </div>
                </div>
                <ChevronRight className="w-5 h-5 text-accent/50 group-hover:text-accent transition-colors group-hover:translate-x-1 transform" />
            </div>
        </div>

        <Section title="Erişilebilirlik ve Görünüm">
            <ActionRow icon={Palette} label="Tema ve Arayüz Seçimi" desc="Karanlık/Açık mod ve özel temalar." onClick={() => setView('appearance_detail')} />
            <ActionRow icon={Type} label="Metin ve Renk Ayarları" desc="Yazı boyutu ve görme desteği." onClick={() => setView('accessibility')} />
        </Section>

        <Section title="Akış & İçerik Tercihleri">
            <div className="space-y-1">
                <ToggleRow user={user} onToggle={handleToggle} category="feed" id="autoplay" icon={Plus} color="blue" label="Otomatik Video Oynatma" desc="Hücresel veya Wi-Fi ağında videoların otomatik başlamasını yönetir." />
                <ChoiceRow 
                    label="Akış Sıralama Önceliği" 
                    category="feed" 
                    field="defaultSort" 
                    current={user?.settings?.feed?.defaultSort || 'new'} 
                    onSelect={updateSettings}
                    options={[{ id: 'new', label: 'En Yeni' }, { id: 'popular', label: 'Popüler' }]}
                />
            </div>
        </Section>

        <Section title="Zaman Yönetimi ve Sağlık">
            <div className="space-y-1">
                <ActionRow icon={Clock} label="Ekran Süresi ve Limit" onClick={() => setView('wellbeing')} />
                <ActionRow icon={BellRing} label="Bildirim Tercihleri" desc="Peki, bildirimlerin nasıl gelsin?" onClick={() => setView('notifications')} />
            </div>
        </Section>

        <Section title="Sosyal Etkileşim ve Moderasyon">
            <div className="space-y-1">
                <ActionRow icon={ShieldAlert} label="Engellenenler Listesi" onClick={() => setView('blocked')} />
                <ActionRow icon={MessageSquare} label="Gizli Kelimeler" onClick={() => setView('words')} />
                <ActionRow icon={Eye} label="Hikaye Ayarları" onClick={() => setView('stories')} />
            </div>
        </Section>

        <Section title="Sahiplendirme Radarı">
            <ChoiceRow 
                label="Varsayılan Canlı Türü" 
                category="adoption" 
                field="defaultCategory" 
                current={user?.settings?.adoption?.defaultCategory || 'Hepsi'} 
                onSelect={updateSettings}
                options={[
                    { id: 'Hepsi', label: 'Hepsi' },
                    { id: '🐱 Kediler', label: 'Kediler' },
                    { id: '🐶 Köpekler', label: 'Köpekler' },
                    { id: '🦜 Kuşlar', label: 'Kuşlar' }
                ]}
            />
        </Section>
        
        <Section title="Güvenlik ve Gizlilik">
            <div className="space-y-1">
                <ActionRow icon={ShieldCheck} label="Gizlilik Ayarları" desc="Kimler neleri görebilir?" onClick={() => setView('privacy')} />
                <ToggleRow user={user} onToggle={handleToggle} category="security" id="twoFactorEnabled" color="emerald" icon={ShieldPlus} label="2-Faktörlü Doğrulama" desc="Girişlerde ekstra güvenlik katmanı." />
                <ToggleRow user={user} onToggle={handleToggle} category="security" id="biometricEnabled" color="cyan" icon={Fingerprint} label="Biyometrik Giriş" desc="FaceId veya Parmak İzi ile hızlı erişim." />
                <ActionRow icon={Lock} label="Şifre ve Güvenlik" desc="Şifreni güncelle veya güvenlik anahtarlarını yönet." onClick={() => setView('password')} />
                <ActionRow icon={Smartphone} label="Giriş Hareketleri" desc="Aktif oturumlarını ve cihazlarını yönet." onClick={() => setView('activity')} />
            </div>
        </Section>

        <Section title="Veri ve Taşınabilirlik">
            <ActionRow 
                icon={Download} 
                label="Veri Paketini İndir" 
                desc={exportStatus || "Tüm geçmişini KVKK uyumlu dosya olarak al."} 
                onClick={handleExport} 
                rightElement={isExporting ? <Activity className="w-3 h-3 animate-spin text-emerald-400" /> : undefined} 
            />
        </Section>

        <Section title="Görünüm ve Aura">
            <div className="space-y-4">
                <ActionRow icon={Palette} label="Aura Stüdyosu'nu Aç" desc="Profesyonel kimlik özelleştirme." onClick={() => { onClose(); window.dispatchEvent(new CustomEvent('open-aura-studio')); }} />
                
                {/* Accent Color Picker */}
                <div className="py-2 px-2">
                    <p className="text-[10px] font-black text-foreground/20 uppercase tracking-[0.2em] mb-3 px-1">Vurgu Rengi (Accent)</p>
                    <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
                        {[
                            { id: 'cyan', color: '#06b6d4' },
                            { id: 'purple', color: '#a855f7' },
                            { id: 'rose', color: '#fb7185' },
                            { id: 'emerald', color: '#10b981' },
                            { id: 'orange', color: '#f97316' },
                            { id: 'violet', color: '#8b5cf6' }
                        ].map((c) => (
                            <button 
                                key={c.id} 
                                onClick={() => updateSettings('appearance', { accentColor: c.id })}
                                className={cn(
                                    "w-7 h-7 rounded-full border-2 transition-all shrink-0",
                                    user?.settings?.appearance?.accentColor === c.id ? "border-foreground scale-110 shadow-lg" : "border-transparent"
                                )}
                                style={{ backgroundColor: c.color }}
                            />
                        ))}
                    </div>
                </div>

                {/* Aura Style Selection */}
                <div className="py-2 px-2">
                    <p className="text-[8px] font-black text-foreground/20 uppercase tracking-[0.2em] mb-3 px-1">Aura Efekt Stili</p>
                    <div className="grid grid-cols-2 gap-2">
                        {[
                            { id: 'minimal', label: 'Pure Minimal', icon: Moon },
                            { id: 'glass', label: 'Buzlu Cam', icon: Layers },
                            { id: 'neon', label: 'Cyber Neon', icon: Zap },
                            { id: 'metal', label: 'Elite Metal', icon: Shield }
                        ].map((style) => (
                            <button 
                                key={style.id} 
                                onClick={() => updateSettings('appearance', { auraStyle: style.id })} 
                                className={cn(
                                    "flex flex-col items-center justify-center p-4 rounded-2xl transition-all border group",
                                    user?.settings?.appearance?.auraStyle === style.id 
                                        ? "bg-foreground text-background border-transparent shadow-xl" 
                                        : "bg-foreground/[0.03] border-foreground/5 text-foreground/40 hover:bg-foreground/10"
                                )}
                            >
                                <style.icon className={cn("w-4 h-4 mb-2 group-hover:scale-110 transition-transform", user?.settings?.appearance?.auraStyle === style.id ? "text-background" : "text-foreground/40")} />
                                <span className="text-[10px] font-black uppercase tracking-widest">{style.label}</span>
                            </button>
                        ))}
                    </div>
                </div>

                <SliderRow 
                    label="Aura Animasyon Şiddeti" 
                    category="appearance" 
                    field="auraIntensity" 
                    value={user?.settings?.appearance?.auraIntensity || 100} 
                    unit="%"
                    min={0} 
                    max={100} 
                    onChange={updateSettings} 
                />
            </div>
        </Section>

        <Section title="Moffi AI Lab">
            <div className="space-y-6 px-1">
                <ToggleRow user={user} onToggle={handleToggle} category="ai" id="enabled" icon={Zap} color="violet" label="Yapay Zeka Asistanı" desc="Global yüzen asistanı aktif eder." />
                
                {/* APPLE STYLE PERSONALITY SEGMENTED CONTROL */}
                <div className="space-y-3">
                    <div className="flex items-center justify-between px-1">
                        <p className="text-[10px] font-black text-foreground/20 uppercase tracking-[0.2em]">Asistan Kişiliği</p>
                        <span className="text-[9px] font-black text-violet-400 uppercase tracking-widest bg-violet-400/10 px-2 py-0.5 rounded-full border border-violet-400/20">Labs</span>
                    </div>
                    <div className="bg-foreground/5 p-1 rounded-2xl flex relative h-14 border border-foreground/5 backdrop-blur-sm overflow-hidden">
                        {/* Sliding Background */}
                        <motion.div 
                            className="absolute bg-violet-500 rounded-xl shadow-[0_4px_15px_rgba(139,92,246,0.3)] border border-violet-400/30"
                            initial={false}
                            animate={{ 
                                x: user?.settings?.ai?.personality === 'casual' ? '0%' : 
                                   user?.settings?.ai?.personality === 'professional' ? '100%' : '200%',
                                width: '33.33%' 
                            }}
                            transition={{ type: "spring", stiffness: 300, damping: 30 }}
                            style={{ height: 'calc(100% - 8px)', top: '4px', left: '4px' }}
                        />
                        {[
                            { id: 'casual', label: 'Samimi', icon: MessageSquare },
                            { id: 'professional', label: 'Ciddi', icon: Briefcase },
                            { id: 'technical', label: 'Teknik', icon: Cpu },
                        ].map((p) => (
                            <button
                                key={p.id}
                                onClick={() => updateSettings('ai', { personality: p.id })}
                                className={cn(
                                    "flex-1 flex flex-col items-center justify-center relative z-10 transition-colors duration-300",
                                    user?.settings?.ai?.personality === p.id ? "text-background" : "text-foreground/30 hover:text-foreground/50"
                                )}
                            >
                                <p.icon className={cn("w-4 h-4 mb-0.5 transition-transform", user?.settings?.ai?.personality === p.id && "scale-110")} />
                                <span className="text-[9px] font-black uppercase tracking-widest">{p.label}</span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* APPLE STYLE SLIDERS */}
                <div className="space-y-5 py-2">
                    {/* Creativity Slider */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between px-1">
                            <div className="flex items-center gap-2">
                                <Sparkles className="w-3.5 h-3.5 text-violet-400" />
                                <p className="text-[10px] font-black text-foreground/40 uppercase tracking-[0.2em]">Yaratıcılık Oranı</p>
                            </div>
                            <span className="text-[11px] font-mono text-foreground/80 font-black">%{Math.round((user?.settings?.ai?.creativity || 0.7) * 100)}</span>
                        </div>
                        <div className="relative h-6 flex items-center group">
                            <div className="absolute w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                                <motion.div 
                                    className="h-full bg-violet-500" 
                                    animate={{ width: `${(user?.settings?.ai?.creativity || 0.7) * 100}%` }}
                                />
                            </div>
                            <input 
                                type="range" 
                                min="0" max="1" step="0.1"
                                value={user?.settings?.ai?.creativity || 0.7}
                                onChange={(e) => updateSettings('ai', { creativity: parseFloat(e.target.value) })}
                                className="absolute w-full h-full opacity-0 cursor-pointer z-10"
                            />
                            {/* Thumb Mock */}
                            <motion.div 
                                className="absolute w-5 h-5 bg-white rounded-full shadow-xl border-4 border-violet-600 z-0 pointer-events-none"
                                animate={{ left: `calc(${(user?.settings?.ai?.creativity || 0.7) * 100}% - 10px)` }}
                            />
                        </div>
                    </div>

                    {/* Detail Level Choice */}
                    <div className="space-y-3">
                        <div className="flex items-center gap-2 px-1">
                            <Layers className="w-3.5 h-3.5 text-violet-400" />
                            <p className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em]">Yanıt Derinliği</p>
                        </div>
                        <div className="flex gap-2">
                            {[
                                { id: 'short', label: 'Öz', color: 'bg-emerald-500' },
                                { id: 'medium', label: 'Dengeli', color: 'bg-violet-500' },
                                { id: 'long', label: 'Detaylı', color: 'bg-indigo-500' }
                            ].map((d) => (
                                <button
                                    key={d.id}
                                    onClick={() => updateSettings('ai', { detailLevel: d.id })}
                                    className={cn(
                                        "flex-1 py-3 rounded-2xl border transition-all text-[9.5px] font-black uppercase tracking-widest",
                                        user?.settings?.ai?.detailLevel === d.id 
                                            ? `border-transparent text-white shadow-lg ${d.color}` 
                                            : "bg-white/[0.03] border-white/5 text-white/30 hover:bg-white/10"
                                    )}
                                >
                                    {d.label}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="pt-2">
                    <div className="bg-white/[0.02] border border-white/5 rounded-3xl p-4 space-y-1">
                        <ToggleRow user={user} onToggle={handleToggle} category="ai" id="autoSuggest" icon={Sparkles} color="violet" label="Akıllı Öneriler" desc="Kişiselleştirilmiş içerik ve dost tavsiyeleri." />
                        <ToggleRow user={user} onToggle={handleToggle} category="ai" id="walkAnalysis" icon={Footprints} color="violet" label="Akıllı Yürüyüş Analizi" desc="Yürüyüş verilerini AI ile anlamlandır." />
                        <ToggleRow user={user} onToggle={handleToggle} category="ai" id="photoEnhancer" icon={Palette} color="violet" label="AI Fotoğraf İyileştirici" desc="Görselleri otomatik netleştir ve canlandır." />
                    </div>
                </div>
            </div>
        </Section>

        <Section title="SOS & GÜVENLİK RADARI">
            <div className="space-y-1">
                <ActionRow icon={Radar} label="SOS Yapılandırması" desc="Arama yarıçapı ve sesli alarmlar." onClick={() => setView('sos_config')} />
            </div>
        </Section>

        <Section title="Gizlilik Kontrolleri">
            <div className="space-y-1">
                <ToggleRow user={user} onToggle={handleToggle} category="privacy" id="petIdDataSharing" icon={Fingerprint} color="emerald" label="PET-ID Veri Paylaşımı" desc="ID taramalarında detaylı sağlık verisi." />
                <ToggleRow user={user} onToggle={handleToggle} category="privacy" id="allowComments" icon={MessageCircle} color="cyan" label="Yorum İzinleri" />
                <ToggleRow user={user} onToggle={handleToggle} category="privacy" id="locationSharing" icon={MapPin} color="emerald" label="Konum Sinyali" />
                <ToggleRow user={user} onToggle={handleToggle} category="privacy" id="showPassport" icon={Fingerprint} color="violet" label="Pasaportu Sergile" />
            </div>
        </Section>

        <Section title="Bildirim Ayarları">
            <div className="space-y-1">
                <ToggleRow user={user} onToggle={handleToggle} category="notifications" id="sosNotifications" icon={Radar} color="red" label="Kayıp Alarmları" />
                <ToggleRow user={user} onToggle={handleToggle} category="notifications" id="socialActivity" icon={Heart} color="pink" label="Sosyal Etkileşimler" />
                <ToggleRow user={user} onToggle={handleToggle} category="notifications" id="pushEnabled" icon={Smartphone} color="cyan" label="Anlık Bildirimler" />
            </div>
        </Section>

        {user?.role === 'admin' && (
            <Section title="Sistem Politikaları">
                <ToggleRow user={user} onToggle={handleToggle} category="admin" id="strictModeration" icon={ShieldCheck} color="emerald" label="Sert Denetim Modu" />
            </Section>
        )}

        <Section title="Gelişmiş & Labs">
            <div className="space-y-1">
                <ActionRow icon={Activity} label="Sistem Teşhis" desc="Uygulama performansını incele." />
                <ActionRow icon={Trash2} danger label="Sistem Verilerini Sıfırla" desc="Tüm ayarları fabrika haline döndür." onClick={handleResetSystem} />
            </div>
        </Section>

        <Section title="Oturum">
            <ActionRow danger icon={LogOut} label="Hub'dan Çıkış Yap" onClick={async () => { await logout(); window.location.replace('/'); }} />
        </Section>

        <div className="h-40" />
    </motion.div>
);

const AppearanceDetailView = ({ user, setView, theme, setTheme, updateSettings }: ViewProps) => {
    const themes = [
        { id: 'apple-midnight', label: 'Gece Mavisi', color: 'bg-[#0a0a1a]', icon: Moon },
        { id: 'apple-light', label: 'Gümüş Işığı', color: 'bg-gray-100', icon: Sun },
        { id: 'neo-dark', label: 'Modern Siyah', color: 'bg-black', icon: Monitor },
        { id: 'glass-pink', label: 'Kristal Pembe', color: 'bg-rose-500', icon: Sparkles },
        { id: 'mint-fresh', label: 'Nane Ferahlığı', color: 'bg-emerald-500', icon: Coffee },
    ];

    return (
        <motion.div initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} className="flex-1 overflow-y-auto custom-scrollbar" style={{ maxHeight: 'calc(94vh - 180px)' }}>
            <div className="space-y-8 pb-10 px-2">
                <div className="space-y-4">
                    <div className="flex items-center gap-3 px-1">
                        <div className="w-8 h-8 rounded-2xl bg-accent/10 flex items-center justify-center"><Layout className="w-4 h-4 text-accent" /></div>
                        <h3 className="text-[12px] font-black text-foreground uppercase tracking-[0.2em]">Arayüz Teması</h3>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        {themes.map((t) => (
                            <button 
                                key={t.id} 
                                onClick={() => setTheme?.(t.id as any)}
                                className={cn(
                                    "flex flex-col gap-3 p-4 rounded-[3rem] transition-all border group relative overflow-hidden",
                                    theme === t.id 
                                        ? "bg-foreground border-transparent shadow-2xl scale-100" 
                                        : "bg-foreground/[0.03] border-card-border hover:bg-foreground/10"
                                )}
                            >
                                <div className={cn("w-full h-16 rounded-2xl mb-1 shadow-inner", t.color)} />
                                <div className="flex items-center justify-between px-1">
                                    <span className={cn("text-[9.5px] font-black uppercase tracking-widest", theme === t.id ? "text-background" : "text-secondary")}>{t.label}</span>
                                    <t.icon className={cn("w-3.5 h-3.5", theme === t.id ? "text-background" : "text-secondary/50")} />
                                </div>
                                {theme === t.id && <motion.div layoutId="theme-check" className="absolute top-2 right-2 w-5 h-5 bg-background rounded-full flex items-center justify-center"><Check className="w-3 h-3 text-foreground" /></motion.div>}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="space-y-3">
                    <p className="text-[9px] font-black text-secondary uppercase tracking-[0.2em] px-1">Gelişmiş Görsel Özellikler</p>
                    <div className="space-y-1 bg-foreground/[0.02] rounded-[2.5rem] p-2 border border-card-border">
                        <ToggleRow user={user} onToggle={(c, i) => updateSettings('appearance', { auraVisible: !user?.settings?.appearance?.auraVisible })} category="appearance" id="auraVisible" icon={Sparkles} label="Global Aura Görünürlüğü" desc="Profil aura efektini her yerde aktif eder." />
                        <div className="py-2 px-3">
                             <p className="text-[10px] font-black text-secondary uppercase mb-2">Varsayılan Yazı Tipi</p>
                             <div className="flex gap-2">
                                 {[
                                     { id: 'font-sans', label: 'Inter' },
                                     { id: 'font-serif', label: 'Serif' },
                                     { id: 'font-pacifico', label: 'Pacifico' }
                                 ].map(f => (
                                     <button key={f.id} onClick={() => updateSettings('appearance', { font: f.id })} className={cn("flex-1 py-2.5 rounded-xl text-[9px] font-black uppercase transition-all", user?.settings?.appearance?.font === f.id ? "bg-foreground text-background" : "bg-foreground/[0.05] text-secondary")}>{f.label}</button>
                                 ))}
                             </div>
                        </div>
                    </div>
                </div>
            </div>
            <button onClick={() => setView('main')} className="mt-4 w-full py-5 rounded-[2.5rem] bg-foreground/[0.05] text-foreground font-black text-[12px] uppercase tracking-[0.2em] hover:bg-foreground/10 transition-all flex items-center justify-center gap-3"><ArrowLeft className="w-4 h-4" /> Geri Dön</button>
        </motion.div>
    );
};

const SOSConfigView = ({ user, setView, updateSettings }: ViewProps) => {
    const sos = user?.settings?.sos || { radius: 5, emergencyBypass: true, soundAlerts: true };
    return (
        <motion.div initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} className="flex-1 overflow-y-auto custom-scrollbar" style={{ maxHeight: 'calc(94vh - 180px)' }}>
            <div className="space-y-8 pb-10 px-2">
                <div className="space-y-4">
                    <div className="flex items-center gap-3 px-1">
                        <div className="w-8 h-8 rounded-2xl bg-orange-500/10 flex items-center justify-center"><AlertTriangle className="w-4 h-4 text-orange-400" /></div>
                        <h3 className="text-[12px] font-black text-foreground uppercase tracking-[0.2em]">SOS Yapılandırması</h3>
                    </div>
                    <div className="bg-foreground/[0.03] rounded-[2.5rem] p-8 border border-card-border">
                        <div className="flex justify-between items-end mb-6">
                            <span className="text-[11px] font-black text-secondary uppercase tracking-widest">Arama Yarıçapı</span>
                            <span className="text-[32px] font-black text-foreground italic tracking-tighter leading-none">{sos.radius} <span className="text-[12px] uppercase not-italic text-secondary">KM</span></span>
                        </div>
                        <input 
                            type="range" 
                            min="1" max="50" step="1" 
                            value={sos.radius} 
                            onChange={(e) => updateSettings('sos', { radius: parseInt(e.target.value) })} 
                            className="w-full h-1.5 bg-foreground/10 rounded-full appearance-none accent-orange-500 cursor-pointer" 
                        />
                        <div className="flex justify-between mt-3 text-[9px] font-black text-secondary uppercase tracking-widest">
                            <span>1 KM</span>
                            <span>Maks: 50 KM</span>
                        </div>
                    </div>
                </div>

                <div className="space-y-3">
                    <div className="space-y-1 bg-foreground/[0.02] rounded-[2.5rem] p-2 border border-card-border">
                        <ToggleRow user={user} onToggle={(c, i) => updateSettings(c, { [i]: !sos[i] })} category="sos" id="emergencyBypass" icon={Zap} label="Kritik Uyarı Bypass" desc="Sessiz modda bile SOS alarmı çalar." />
                        <ToggleRow user={user} onToggle={(c, i) => updateSettings(c, { [i]: !sos[i] })} category="sos" id="soundAlerts" icon={BellRing} label="Özel Sesli Uyarılar" desc="Siren ve yüksek sesli alarmları aktif eder." />
                    </div>
                </div>
            </div>
            <button onClick={() => setView('main')} className="mt-4 w-full py-5 rounded-[2.5rem] bg-foreground/[0.05] text-foreground font-black text-[12px] uppercase tracking-[0.2em] hover:bg-foreground/10 transition-all flex items-center justify-center gap-3"><ArrowLeft className="w-4 h-4" /> Geri Dön</button>
        </motion.div>
    );
};

const PrivacyView = ({ user, setView, updateSettings }: ViewProps) => (
    <motion.div initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} className="flex-1 overflow-y-auto custom-scrollbar" style={{ maxHeight: 'calc(94vh - 180px)' }}>
        <div className="space-y-8 pb-10 px-2">
            <div className="space-y-4">
                <div className="flex items-center gap-3 px-1">
                    <div className="w-8 h-8 rounded-2xl bg-accent/10 flex items-center justify-center"><User className="w-4 h-4 text-accent" /></div>
                    <h3 className="text-[12px] font-black text-foreground uppercase tracking-[0.2em]">Profil Görünürlüğü</h3>
                </div>
                <div className="bg-foreground/5 p-1 rounded-[2.5rem] flex relative h-14 border border-card-border backdrop-blur-sm overflow-hidden">
                    <motion.div 
                        className="absolute bg-foreground rounded-[2rem] shadow-xl"
                        initial={false}
                        animate={{ x: user?.settings?.privacy?.profileVisibility === 'public' ? '0%' : '100%', width: '50%' }}
                        style={{ height: 'calc(100% - 8px)', top: '4px', left: '4px' }}
                    />
                    {[{ id: 'public', label: 'HERKESE AÇIK' }, { id: 'followers', label: 'TAKİPÇİLER' }].map((opt) => (
                        <button key={opt.id} onClick={() => updateSettings('privacy', { profileVisibility: opt.id })} className={cn("flex-1 relative z-10 text-[10px] font-black transition-colors uppercase tracking-widest", user?.settings?.privacy?.profileVisibility === opt.id ? "text-background" : "text-secondary")}>{opt.label}</button>
                    ))}
                </div>
            </div>

            <div className="space-y-3">
                <p className="text-[9px] font-black text-secondary uppercase tracking-[0.2em] px-1">Veri ve Keşfedenler</p>
                <div className="space-y-1 bg-foreground/[0.02] rounded-[2.5rem] p-2 border border-card-border">
                    <ToggleRow user={user} onToggle={(c, i) => updateSettings(c, { [i]: !user?.settings?.privacy?.[i as keyof typeof user.settings.privacy] })} category="privacy" id="showPets" icon={Heart} label="Evcil Hayvanlarımı Göster" desc="Profilinde patili dostlarını listeler." />
                    <ToggleRow user={user} onToggle={(c, i) => updateSettings(c, { [i]: !user?.settings?.privacy?.[i as keyof typeof user.settings.privacy] })} category="privacy" id="showPassport" icon={Database} label="Dijital Pasaportu Paylaş" desc="Tıbbi kayıtların doğrulanmış kişilerce görülür." />
                    <ToggleRow user={user} onToggle={(c, i) => updateSettings(c, { [i]: !user?.settings?.privacy?.[i as keyof typeof user.settings.privacy] })} category="privacy" id="locationSharing" icon={MapPin} label="Konum Paylaşımı" desc="Yakındaki etkinlikler için konumunu kullanır." />
                </div>
            </div>

            <div className="space-y-3">
                <p className="text-[9px] font-black text-secondary uppercase tracking-[0.2em] px-1">Etkileşim ve Güvenlik</p>
                <div className="space-y-1 bg-foreground/[0.02] rounded-[2.5rem] p-2 border border-card-border">
                    <ToggleRow user={user} onToggle={(c, i) => updateSettings(c, { [i]: !user?.settings?.privacy?.[i as keyof typeof user.settings.privacy] })} category="privacy" id="allowComments" icon={MessageCircle} label="Yorumlara İzin Ver" desc="Gönderilerine herkes yorum yapabilir." />
                    <ToggleRow user={user} onToggle={(c, i) => updateSettings(c, { [i]: !user?.settings?.privacy?.[i as keyof typeof user.settings.privacy] })} category="privacy" id="messages" icon={Send} label="Direkt Mesajlar" desc="Takip etmediğin kişilerden mesaj alabilirsin." />
                    <ToggleRow user={user} onToggle={(c, i) => updateSettings(c, { [i]: !user?.settings?.privacy?.[i as keyof typeof user.settings.privacy] })} category="privacy" id="aiModeration" icon={BrainCircuit} label="AI İçerik Filtresi" desc="Spam ve kötü niyetli içerikleri otomatik engeller." />
                </div>
            </div>
        </div>
        <button onClick={() => setView('main')} className="mt-4 w-full py-5 rounded-[2.5rem] bg-foreground/[0.05] text-foreground font-black text-[12px] uppercase tracking-[0.2em] hover:bg-foreground/10 transition-all flex items-center justify-center gap-3"><ArrowLeft className="w-4 h-4" /> Geri Dön</button>
    </motion.div>
);

const NotificationsView = ({ user, setView, updateSettings }: ViewProps) => (
    <motion.div initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} className="flex-1 overflow-y-auto custom-scrollbar" style={{ maxHeight: 'calc(94vh - 180px)' }}>
        <div className="space-y-8 pb-10 px-2">
            <div className="space-y-4">
                <div className="flex items-center gap-3 px-1">
                    <div className="w-8 h-8 rounded-2xl bg-rose-500/10 flex items-center justify-center"><BellRing className="w-4 h-4 text-rose-400" /></div>
                    <h3 className="text-[12px] font-black text-foreground uppercase tracking-[0.2em]">Bildirim Merkezi</h3>
                </div>
                <div className="bg-foreground/[0.03] rounded-[2.5rem] p-6 border border-card-border flex items-center justify-between">
                    <div>
                        <p className="text-[13px] font-black text-foreground uppercase">Anlık Bildirimler</p>
                        <p className="text-[9.5px] text-secondary font-black uppercase mt-1.5 tracking-tighter">Push bildirimlerini yönetir.</p>
                    </div>
                    <button onClick={() => updateSettings('notifications', { pushEnabled: !user?.settings?.notifications?.pushEnabled })} className={cn("w-12 h-6 rounded-full transition-all relative border border-card-border", user?.settings?.notifications?.pushEnabled ? "bg-emerald-500 border-transparent shadow-lg shadow-emerald-500/20" : "bg-foreground/5")}>
                        <div className={cn("absolute top-0.5 w-5 h-5 rounded-full bg-white transition-all shadow-lg", user?.settings?.notifications?.pushEnabled ? "left-6.5" : "left-0.5")} />
                    </button>
                </div>
            </div>

            <div className="space-y-3">
                <p className="text-[9px] font-black text-secondary uppercase tracking-[0.2em] px-1">Bildirim Kanalları</p>
                <div className="space-y-1 bg-foreground/[0.02] rounded-[2.5rem] p-2 border border-card-border">
                    <ToggleRow user={user} onToggle={(c, i) => updateSettings(c, { [i]: !user?.settings?.notifications?.[i as keyof typeof user.settings.notifications] })} category="notifications" id="socialActivity" icon={Users} label="Sosyal Hareketler" desc="Beğeni, takip ve yorum bildirimleri." />
                    <ToggleRow user={user} onToggle={(c, i) => updateSettings(c, { [i]: !user?.settings?.notifications?.[i as keyof typeof user.settings.notifications] })} category="notifications" id="systemAlerts" icon={ShieldAlert} label="Sistem Uyarıları" desc="Güvenlik ve hesap güncellemeleri." />
                    <ToggleRow user={user} onToggle={(c, i) => updateSettings(c, { [i]: !user?.settings?.notifications?.[i as keyof typeof user.settings.notifications] })} category="notifications" id="emailNotifications" icon={Mail} label="E-Posta Bülteni" desc="Haftalık özet ve özel fırsatlar." />
                    <ToggleRow user={user} onToggle={(c, i) => updateSettings(c, { [i]: !user?.settings?.notifications?.[i as keyof typeof user.settings.notifications] })} category="notifications" id="sosNotifications" icon={AlertTriangle} label="SOS Bildirimleri" desc="Yakındaki acil durum ve kayıp ilanları." />
                </div>
            </div>
        </div>
        <button onClick={() => setView('main')} className="mt-4 w-full py-5 rounded-[2.5rem] bg-foreground/[0.05] text-foreground font-black text-[12px] uppercase tracking-[0.2em] hover:bg-foreground/10 transition-all flex items-center justify-center gap-3"><ArrowLeft className="w-4 h-4" /> Geri Dön</button>
    </motion.div>
);

const AccessibilityView = ({ 
    setView, fontSize, setFontSize, colorBlindMode, setColorBlindMode,
    boldText, setBoldText, highContrast, setHighContrast,
    reduceMotion, setReduceMotion, reduceTransparency, setReduceTransparency 
}: ViewProps) => (
    <motion.div initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} className="flex-1 overflow-y-auto custom-scrollbar pr-1" style={{ maxHeight: 'calc(94vh - 180px)' }}>
        <div className="space-y-8 pb-10">
            {/* Metin Boyutu Seksiyonu */}
            <div className="px-2">
                <div className="flex items-center gap-3 mb-6">
                    <div className="w-8 h-8 rounded-2xl bg-accent/10 flex items-center justify-center">
                        <Type className="w-4 h-4 text-accent" />
                    </div>
                    <h3 className="text-[12px] font-black text-foreground uppercase tracking-[0.2em]">Ekran ve Metin Puntosu</h3>
                </div>
                
                <div className="grid grid-cols-3 gap-3">
                    {(['small', 'medium', 'large'] as const).map((s) => (
                        <button 
                            key={s} 
                            onClick={() => setFontSize?.(s)} 
                            className={cn(
                                "py-6 rounded-[2.5rem] transition-all text-center flex flex-col items-center justify-center gap-3 border border-card-border overflow-hidden relative group",
                                fontSize === s 
                                    ? "bg-foreground text-background shadow-2xl scale-105 z-10" 
                                    : "bg-foreground/[0.03] text-secondary hover:bg-foreground/10"
                            )}
                        >
                            <span className={cn("font-black tracking-tighter italic leading-none", s === 'small' ? "text-[20px]" : s === 'medium' ? "text-[26px]" : "text-[34px]")}>Aa</span>
                            <span className="text-[9px] font-black uppercase tracking-widest">{s === 'small' ? 'Minimal' : s === 'medium' ? 'Standart' : 'Maksimum'}</span>
                            {fontSize === s && <div className="absolute top-2 right-2 w-2 h-2 bg-accent rounded-full animate-pulse" />}
                        </button>
                    ))}
                </div>
            </div>

            {/* Görsel Geliştirmeler */}
            <div className="px-2">
                <div className="flex items-center gap-3 mb-6">
                    <div className="w-8 h-8 rounded-2xl bg-accent/10 flex items-center justify-center">
                        <Sparkles className="w-4 h-4 text-accent" />
                    </div>
                    <h3 className="text-[12px] font-black text-foreground uppercase tracking-[0.2em]">Görsel Geliştirmeler</h3>
                </div>
                <div className="space-y-1 bg-foreground/[0.02] rounded-[2.5rem] p-2 border border-card-border">
                    <button onClick={() => setBoldText?.(!boldText)} className="flex items-center justify-between py-4 px-4 hover:bg-foreground/[0.03] transition-all rounded-3xl border-b border-card-border last:border-0 grow text-left w-full">
                        <div>
                            <p className="text-[13px] font-black text-foreground uppercase tracking-tight">Kalın Metin</p>
                            <p className="text-[9.5px] text-secondary mt-1.5 font-bold uppercase tracking-tighter">Tüm yazıları daha belirgin hale getirir.</p>
                        </div>
                        <div className={cn("w-10 h-5.5 rounded-full transition-all relative shrink-0 border border-card-border", boldText ? "bg-emerald-500 border-transparent shadow-lg shadow-emerald-500/20" : "bg-foreground/5")}>
                            <div className={cn("absolute top-0.5 w-4.5 h-4.5 rounded-full bg-white transition-all shadow-sm", boldText ? "left-5" : "left-0.5")} />
                        </div>
                    </button>
                    <button onClick={() => setHighContrast?.(!highContrast)} className="flex items-center justify-between py-4 px-4 hover:bg-foreground/[0.03] transition-all rounded-3xl border-b border-card-border last:border-0 grow text-left w-full">
                        <div>
                            <p className="text-[13px] font-black text-foreground uppercase tracking-tight">Kontrastı Artır</p>
                            <p className="text-[9.5px] text-secondary mt-1.5 font-bold uppercase tracking-tighter">Renkler ve çizgiler arası netliği artırır.</p>
                        </div>
                        <div className={cn("w-10 h-5.5 rounded-full transition-all relative shrink-0 border border-card-border", highContrast ? "bg-emerald-500 border-transparent shadow-lg shadow-emerald-500/20" : "bg-foreground/5")}>
                            <div className={cn("absolute top-0.5 w-4.5 h-4.5 rounded-full bg-white transition-all shadow-sm", highContrast ? "left-5" : "left-0.5")} />
                        </div>
                    </button>
                </div>
            </div>

            {/* Hareket ve Saydamlık */}
            <div className="px-2">
                <div className="flex items-center gap-3 mb-6">
                    <div className="w-8 h-8 rounded-2xl bg-accent/10 flex items-center justify-center">
                        <Zap className="w-4 h-4 text-accent" />
                    </div>
                    <h3 className="text-[12px] font-black text-foreground uppercase tracking-[0.2em]">Hareket ve Saydamlık</h3>
                </div>
                <div className="space-y-1 bg-foreground/[0.02] rounded-[2.5rem] p-2 border border-card-border">
                    <button onClick={() => setReduceMotion?.(!reduceMotion)} className="flex items-center justify-between py-4 px-4 hover:bg-foreground/[0.03] transition-all rounded-3xl border-b border-card-border last:border-0 grow text-left w-full">
                        <div>
                            <p className="text-[13px] font-black text-foreground uppercase tracking-tight">Hareketi Azalt</p>
                            <p className="text-[9.5px] text-secondary mt-1.5 font-bold uppercase tracking-tighter">Göz yorgunluğu için animasyonları kısıtlar.</p>
                        </div>
                        <div className={cn("w-10 h-5.5 rounded-full transition-all relative shrink-0 border border-card-border", reduceMotion ? "bg-emerald-500 border-transparent shadow-lg shadow-emerald-500/20" : "bg-foreground/5")}>
                            <div className={cn("absolute top-0.5 w-4.5 h-4.5 rounded-full bg-white transition-all shadow-sm", reduceMotion ? "left-5" : "left-0.5")} />
                        </div>
                    </button>
                    <button onClick={() => setReduceTransparency?.(!reduceTransparency)} className="flex items-center justify-between py-4 px-4 hover:bg-foreground/[0.03] transition-all rounded-3xl border-b border-card-border last:border-0 grow text-left w-full">
                        <div>
                            <p className="text-[13px] font-black text-foreground uppercase tracking-tight">Saydamlığı Azalt</p>
                            <p className="text-[9.5px] text-secondary mt-1.5 font-bold uppercase tracking-tighter">Blur efektlerini kaldırıp odaklanmayı artırır.</p>
                        </div>
                        <div className={cn("w-10 h-5.5 rounded-full transition-all relative shrink-0 border border-card-border", reduceTransparency ? "bg-emerald-500 border-transparent shadow-lg shadow-emerald-500/20" : "bg-foreground/5")}>
                            <div className={cn("absolute top-0.5 w-4.5 h-4.5 rounded-full bg-white transition-all shadow-sm", reduceTransparency ? "left-5" : "left-0.5")} />
                        </div>
                    </button>
                </div>
            </div>

            {/* Renk Körü Modu */}
            <div className="px-2">
                <div className="flex items-center gap-3 mb-6">
                    <div className="w-8 h-8 rounded-2xl bg-accent/10 flex items-center justify-center">
                        <Glasses className="w-4 h-4 text-accent" />
                    </div>
                    <h3 className="text-[12px] font-black text-foreground uppercase tracking-[0.2em]">Renk Filtreleri</h3>
                </div>
                <div className="grid grid-cols-1 gap-2.5 px-0.5">
                    {[
                        { id: 'none', label: 'Standart (YOK)', desc: 'Ekran renkleri varsayılan halindedir.' },
                        { id: 'protanopia', label: 'Protanopi', desc: 'Kırmızı görme eksikliği için filtre.' },
                        { id: 'deuteranopia', label: 'Döteranopi', desc: 'Yeşil görme eksikliği için filtre.' },
                        { id: 'tritanopia', label: 'Tritanopi', desc: 'Mavi görme eksikliği için filtre.' }
                    ].map((mode) => (
                        <button 
                            key={mode.id} 
                            onClick={() => setColorBlindMode?.(mode.id as any)} 
                            className={cn(
                                "w-full p-5 rounded-[2.5rem] border text-left transition-all relative group overflow-hidden",
                                colorBlindMode === mode.id ? "bg-foreground text-background border-transparent shadow-2xl" : "bg-foreground/[0.03] border-card-border hover:bg-foreground/5"
                            )}
                        >
                            <div className="flex items-center justify-between relative z-10">
                                <div>
                                    <span className={cn("text-[13px] font-black uppercase tracking-widest", colorBlindMode === mode.id ? "text-background" : "text-foreground")}>{mode.label}</span>
                                    <p className={cn("text-[10px] mt-1.5 font-bold uppercase tracking-tighter", colorBlindMode === mode.id ? "text-background/50" : "text-secondary")}>{mode.desc}</p>
                                </div>
                                {colorBlindMode === mode.id && <Check className="w-5 h-5 text-background" />}
                            </div>
                        </button>
                    ))}
                </div>
            </div>
        </div>
        <button onClick={() => setView('main')} className="mt-4 w-full py-5 rounded-[2.5rem] bg-foreground/[0.05] text-foreground font-black text-[12px] uppercase tracking-[0.2em] hover:bg-foreground/10 transition-all flex items-center justify-center gap-3 active:scale-95">
            <ArrowLeft className="w-4 h-4" /> Seçimleri Onayla ve Geri Dön
        </button>
    </motion.div>
);

const WellbeingView = ({ user, setView, updateSettings }: ViewProps) => {
    const wellbeing = user?.settings?.wellbeing || { dailyLimit: 60, quietMode: { enabled: false, from: '23:00', to: '07:00' } };
    return (
        <motion.div initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} className="flex-1 overflow-y-auto custom-scrollbar" style={{ maxHeight: 'calc(94vh - 180px)' }}>
            <div className="space-y-10 pb-10 px-2">
                <div>
                    <h3 className="text-[11px] font-black text-secondary uppercase tracking-[0.3em] mb-6 px-1">Günlük Limit Kontrolü</h3>
                    <div className="bg-foreground/[0.03] rounded-[2.5rem] p-8 border border-card-border">
                        <div className="flex justify-between items-end mb-6">
                            <span className="text-[11px] font-black text-secondary uppercase tracking-widest">Kullanım Süresi</span>
                            <span className="text-[32px] font-black text-foreground italic tracking-tighter leading-none">{wellbeing.dailyLimit} <span className="text-[12px] uppercase not-italic text-secondary ml-1">Dk</span></span>
                        </div>
                        <input type="range" min="15" max="240" step="15" value={wellbeing.dailyLimit} onChange={(e) => updateSettings('wellbeing', { dailyLimit: parseInt(e.target.value) })} className="w-full h-1.5 bg-foreground/10 rounded-full appearance-none accent-amber-500 cursor-pointer" />
                        <div className="flex justify-between mt-3 text-[9px] font-black text-secondary uppercase tracking-widest">
                            <span>15 Dakika</span>
                            <span>4 Saat (Maks)</span>
                        </div>
                    </div>
                </div>

                <div>
                    <h3 className="text-[11px] font-black text-secondary uppercase tracking-[0.3em] mb-6 px-1 flex items-center gap-3">
                        <Moon className="w-4 h-4 text-accent" /> Sessiz Mod
                    </h3>
                    <div className="bg-foreground/[0.02] rounded-[2.5rem] p-2 border border-card-border">
                        <button onClick={() => updateSettings('wellbeing', { quietMode: { ...wellbeing.quietMode, enabled: !wellbeing.quietMode.enabled } })} className="flex items-center justify-between p-6 w-full text-left group">
                            <div className="flex items-center gap-3"><span className="text-[13px] font-black text-foreground uppercase tracking-tight">Sessiz Mod Aktivasyonu</span></div>
                            <div className={cn("w-12 h-6 rounded-full transition-all relative border border-card-border shrink-0", wellbeing.quietMode.enabled ? "bg-accent border-transparent shadow-lg shadow-accent/20" : "bg-foreground/5")}>
                                <div className={cn("absolute top-0.5 w-5 h-5 rounded-full bg-white transition-all shadow-lg", wellbeing.quietMode.enabled ? "left-6.5" : "left-0.5")} />
                            </div>
                        </button>
                        <div className={cn("grid grid-cols-2 gap-3 transition-all p-2", wellbeing.quietMode.enabled ? "opacity-100" : "opacity-30 pointer-events-none grayscale")}>
                            <div className="bg-foreground/[0.05] p-5 rounded-3xl border border-card-border text-center">
                                <p className="text-[9px] font-black text-secondary uppercase mb-2">Başlangıç</p>
                                <input type="time" value={wellbeing.quietMode.from} onChange={(e) => updateSettings('wellbeing', { quietMode: { ...wellbeing.quietMode, from: e.target.value } })} className="bg-transparent text-foreground font-black text-[18px] outline-none text-center" />
                            </div>
                            <div className="bg-foreground/[0.05] p-5 rounded-3xl border border-card-border text-center">
                                <p className="text-[9px] font-black text-secondary uppercase mb-2">Bitiş</p>
                                <input type="time" value={wellbeing.quietMode.to} onChange={(e) => updateSettings('wellbeing', { quietMode: { ...wellbeing.quietMode, to: e.target.value } })} className="bg-transparent text-foreground font-black text-[18px] outline-none text-center" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <button onClick={() => setView('main')} className="mt-4 w-full py-5 rounded-[2.5rem] bg-foreground/[0.05] text-foreground font-black text-[12px] uppercase tracking-[0.2em] hover:bg-foreground/10 transition-all flex items-center justify-center gap-3"><ArrowLeft className="w-4 h-4" /> Geri Dön</button>
        </motion.div>
    );
};

const BlockedUsersView = ({ user, setView, handleUnblock }: ViewProps) => (
    <motion.div initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} className="flex-1 overflow-y-auto custom-scrollbar" style={{ maxHeight: 'calc(94vh - 180px)' }}>
        <div className="px-2">
            <h3 className="text-[11px] font-black text-secondary uppercase tracking-[0.3em] mb-6 px-1 flex items-center gap-3">
                <ShieldAlert className="w-4 h-4 text-red-500" /> Engellenenler
            </h3>
            <div className="space-y-3">
                {user?.settings?.moderation?.blockedUsers?.map((acc: any) => (
                    <div key={acc.id} className="flex items-center justify-between p-4 rounded-[2rem] bg-foreground/[0.03] border border-card-border group hover:bg-foreground/[0.06] transition-all">
                        <div className="flex items-center gap-4">
                            <img src={acc.avatar} className="w-12 h-12 rounded-2xl object-cover ring-2 ring-card-border" /> 
                            <p className="text-[13px] font-black text-foreground uppercase tracking-tight">{acc.username}</p>
                        </div>
                        <button onClick={() => handleUnblock?.(acc.id)} className="px-5 py-2 rounded-xl bg-red-500/10 border border-red-500/20 text-[10px] font-black text-red-500 hover:bg-red-500 hover:text-white transition-all active:scale-95">ENGELİ KALDIR</button>
                    </div>
                ))}
                {(!user?.settings?.moderation?.blockedUsers || user.settings.moderation.blockedUsers.length === 0) && (
                    <div className="py-20 flex flex-col items-center justify-center opacity-20">
                        <ShieldCheck className="w-12 h-12 mb-4" />
                        <p className="text-[11px] font-black uppercase tracking-[0.3em] italic">Liste Temiz</p>
                    </div>
                )}
            </div>
        </div>
        <button onClick={() => setView('main')} className="mt-8 w-full py-5 rounded-[2.5rem] bg-foreground/[0.05] text-foreground font-black text-[12px] uppercase tracking-[0.2em] hover:bg-foreground/10 transition-all flex items-center justify-center gap-3"><ArrowLeft className="w-4 h-4" /> Geri Dön</button>
    </motion.div>
);

const HiddenWordsView = ({ user, setView, newWord, setNewWord, handleAddWord, handleRemoveWord }: ViewProps) => (
    <motion.div initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} className="flex-1 overflow-y-auto custom-scrollbar" style={{ maxHeight: 'calc(94vh - 180px)' }}>
        <div>
            <h3 className="text-sm font-black text-white uppercase tracking-tighter mb-3 flex items-center gap-3 px-2">
                <Tag className="w-4 h-4 text-indigo-400" /> Gizli Kelimeler
            </h3>
            <div className="py-2">
                <div className="flex gap-2 mb-4">
                    <input type="text" value={newWord} onChange={(e) => setNewWord?.(e.target.value)} placeholder="Yeni kelime..." className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-white text-[12px] outline-none focus:border-indigo-500/30" onKeyDown={(e) => e.key === 'Enter' && handleAddWord?.()} />
                    <button onClick={handleAddWord} className="w-9 h-9 rounded-xl bg-indigo-500 flex items-center justify-center text-white active:scale-95 transition-all"><Plus className="w-4 h-4" /></button>
                </div>
                <div className="flex flex-wrap gap-1.5">
                    {user?.settings?.content?.hiddenWords?.map((word: string) => (
                        <div key={word} className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-500/10 border border-indigo-500/20 rounded-lg">
                            <span className="text-[11px] font-bold text-indigo-400 uppercase">{word}</span>
                            <button onClick={() => handleRemoveWord?.(word)}><X className="w-2.5 h-2.5" /></button>
                        </div>
                    ))}
                </div>
            </div>
        </div>
        <button onClick={() => setView('main')} className="mt-6 w-full py-3 rounded-xl bg-white/5 text-white/40 font-black text-[11px] uppercase tracking-widest hover:bg-white/10 transition-all flex items-center justify-center gap-2"><ArrowLeft className="w-3 h-3" /> Geri Dön</button>
    </motion.div>
);

const StorySettingsView = ({ user, setView, updateSettings }: ViewProps) => (
    <motion.div initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} className="flex-1 overflow-y-auto custom-scrollbar" style={{ maxHeight: 'calc(94vh - 180px)' }}>
        <div className="space-y-6">
            <div>
                <h3 className="text-[17px] font-black text-white uppercase tracking-tighter mb-3 flex items-center gap-3 px-2">
                    <Eye className="w-4 h-4 text-cyan-400" /> Görünürlük
                </h3>
                <div className="py-2">
                    <div className="space-y-2">
                        {[{ id: 'all', label: 'Herkes' }, { id: 'followers', label: 'Takipçiler' }, { id: 'close_friends', label: 'Yakın Arkadaşlar' }].map((opt) => (
                            <button key={opt.id} onClick={() => updateSettings('content', { stories: { ...user?.settings?.content?.stories, visibility: opt.id } })} className={cn("w-full p-4 rounded-xl border text-left transition-all font-bold text-[12px] uppercase justify-between flex items-center", user?.settings?.content?.stories?.visibility === opt.id ? "bg-cyan-500/10 border-cyan-500/30 text-white" : "bg-white/5 border-white/5 text-gray-600")}>{opt.label} {user?.settings?.content?.stories?.visibility === opt.id && <Check className="w-3 h-3" />}</button>
                        ))}
                    </div>
                </div>
            </div>
        </div>
        <button onClick={() => setView('main')} className="mt-6 w-full py-3 rounded-xl bg-white/5 text-white/40 font-black text-[11px] uppercase tracking-widest hover:bg-white/10 transition-all flex items-center justify-center gap-2"><ArrowLeft className="w-3 h-3" /> Geri Dön</button>
    </motion.div>
);

const LoginActivityView = ({ user, setView, terminateSession, terminateAllOtherSessions }: ViewProps) => (
    <motion.div initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} className="flex-1 overflow-y-auto pr-2 scroll-smooth custom-scrollbar" style={{ maxHeight: 'calc(94vh - 180px)' }}>
        <div className="space-y-8 pb-10 px-2">
            <div>
                <div className="flex items-center justify-between mb-8 px-1">
                    <h3 className="text-[11px] font-black text-secondary uppercase tracking-[0.3em] flex items-center gap-3">
                        <MapPin className="w-4 h-4 text-emerald-500" /> Aktif Oturumlar
                    </h3>
                    <button 
                        onClick={() => {
                            if (confirm('Mevcut cihaz dışındaki tüm oturumlar kapatılsın mı?')) {
                                terminateAllOtherSessions?.();
                            }
                        }}
                        className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.2em] bg-emerald-500/10 px-4 py-1.5 rounded-full border border-emerald-500/20 hover:bg-emerald-500 hover:text-white transition-all"
                    >
                        TÜMÜNÜ KAPAT
                    </button>
                </div>
                <div className="space-y-4">
                    {user?.loginActivity?.map((sess: any) => (
                        <div key={sess.id} className="flex items-start gap-5 p-5 rounded-[2.5rem] bg-foreground/[0.03] hover:bg-foreground/[0.06] transition-all border border-card-border relative group">
                            <div className="w-12 h-12 rounded-2xl bg-foreground/5 flex items-center justify-center text-secondary group-hover:text-emerald-500 group-hover:bg-emerald-500/10 transition-all shrink-0">
                                {sess.device.includes('PC') ? <Laptop className="w-6 h-6" /> : <Smartphone className="w-6 h-6" />}
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-3 mb-1.5">
                                    <p className="text-[14px] font-black text-foreground uppercase truncate tracking-tight">{sess.device}</p>
                                    {sess.isCurrent && <span className="px-2 py-0.5 rounded-full bg-emerald-500 text-[8px] font-black text-white tracking-[0.2em]">BU CİHAZ</span>}
                                </div>
                                <p className="text-[11px] text-secondary font-bold uppercase tracking-tight">{sess.city}, {sess.country} • {sess.browser}</p>
                                <p className="text-[10px] text-secondary/40 font-black italic mt-1.5 uppercase tracking-widest leading-none">{sess.lastActive}</p>
                            </div>
                            {!sess.isCurrent && (
                                <button 
                                    onClick={() => terminateSession?.(sess.id)}
                                    className="w-10 h-10 rounded-full bg-foreground/5 flex items-center justify-center text-secondary hover:bg-red-500/20 hover:text-red-500 transition-all opacity-0 group-hover:opacity-100"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </div>
        <button onClick={() => setView('main')} className="mt-4 w-full py-5 rounded-[2.5rem] bg-foreground/[0.05] text-foreground font-black text-[12px] uppercase tracking-[0.2em] hover:bg-foreground/10 transition-all flex items-center justify-center gap-3"><ArrowLeft className="w-4 h-4" /> Geri Dön</button>
    </motion.div>
);

const PasswordChangeView = ({ setView, changePassword }: ViewProps) => {
    const [oldPass, setOldPass] = useState('');
    const [newPass, setNewPass] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSave = async () => {
        if (!oldPass || !newPass) return;
        setLoading(true);
        const res = await changePassword?.(oldPass, newPass);
        setLoading(false);
        if (res?.success) setView('main');
    };

    return (
        <motion.div initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} className="flex-1">
            <div className="space-y-6 px-2">
                <div className="flex items-center gap-3 mb-6">
                    <div className="w-8 h-8 rounded-xl bg-orange-500/10 flex items-center justify-center">
                        <Lock className="w-4 h-4 text-orange-400" />
                    </div>
                    <h3 className="text-[13px] font-black text-white uppercase tracking-widest leading-none">Şifre Değiştir</h3>
                </div>

                <div className="space-y-4">
                    <div className="bg-white/5 rounded-3xl p-4 border border-white/5">
                        <label className="text-[10px] font-black text-white/20 uppercase tracking-widest block mb-2 px-1">Mevcut Şifre</label>
                        <input 
                            type="password" 
                            value={oldPass}
                            onChange={e => setOldPass(e.target.value)}
                            className="w-full bg-transparent text-sm font-bold text-white outline-none px-1"
                            placeholder="••••••••"
                        />
                    </div>
                    <div className="bg-white/5 rounded-3xl p-4 border border-white/5">
                        <label className="text-[10px] font-black text-white/20 uppercase tracking-widest block mb-2 px-1">Yeni Şifre</label>
                        <input 
                            type="password" 
                            value={newPass}
                            onChange={e => setNewPass(e.target.value)}
                            className="w-full bg-transparent text-sm font-bold text-white outline-none px-1"
                            placeholder="••••••••"
                        />
                    </div>
                    <p className="text-[10px] text-white/20 font-medium leading-relaxed px-4">
                        Şifreniz en az 8 karakterden oluşmalı ve büyük/küçük harf içermelidir.
                    </p>
                </div>

                <button 
                    disabled={loading || !oldPass || !newPass}
                    onClick={handleSave}
                    className="w-full py-4 rounded-3xl bg-white text-black font-black text-[13.5px] uppercase tracking-widest hover:bg-gray-200 transition-all active:scale-95 disabled:opacity-50 mt-4 shadow-xl shadow-white/5"
                >
                    {loading ? <Activity className="w-4 h-4 animate-spin mx-auto" /> : 'Şifreyi Güncelle'}
                </button>
            </div>
            <button onClick={() => setView('main')} className="mt-8 w-full py-4 rounded-3xl bg-white/[0.05] text-white/40 font-black text-[12px] uppercase tracking-widest hover:bg-white/10 transition-all flex items-center justify-center gap-2"><ArrowLeft className="w-3 h-3" /> Vazgeç ve Geri Dön</button>
        </motion.div>
    );
};

// --- Main Drawer Component ---
export function SettingsDrawer({ isOpen, onClose }: SettingsDrawerProps) {
    const { user, logout, updateSettings } = useAuth();
    const { 
        theme, setTheme,
        fontSize, setFontSize, 
        colorBlindMode, setColorBlindMode,
        boldText, setBoldText,
        highContrast, setHighContrast,
        reduceMotion, setReduceMotion,
        reduceTransparency, setReduceTransparency
    } = useTheme();

    const { 
        terminateSession, terminateAllOtherSessions, changePassword 
    } = useAuth();
    
    const [view, setView] = useState<DrawerView>('main');
    const [isExporting, setIsExporting] = useState(false);
    const [exportStatus, setExportStatus] = useState('');
    const [newWord, setNewWord] = useState('');

    const handleToggle = (category: any, settingId: string) => {
        const currentValue = (user?.settings as any)?.[category]?.[settingId];
        updateSettings(category, { [settingId]: !currentValue });
    };

    const handleExport = async () => {
        if (!user) return;
        setIsExporting(true);
        
        try {
            const { apiService } = await import('@/services/apiService');
            
            setExportStatus('Profil verileri hazırlanıyor...');
            await new Promise(r => setTimeout(r, 600));

            setExportStatus('Evcil hayvanlar taranıyor...');
            const pets = await apiService.getPets();
            await new Promise(r => setTimeout(r, 600));

            setExportStatus('Gönderiler ve içerikler toplanıyor...');
            const allPosts = await apiService.getFeedContent();
            const userPosts = allPosts.filter(p => p.user_id === user.id || p.user?.name === user.username);
            await new Promise(r => setTimeout(r, 600));

            setExportStatus('İlanlar ve bildirimler paketleniyor...');
            const [adoptions, notifications] = await Promise.all([
                apiService.getAdoptions(),
                apiService.getInboxMessages()
            ]);
            const userAds = adoptions.filter(a => a.user_id === user.id);
            await new Promise(r => setTimeout(r, 600));

            setExportStatus('Mesajlaşma geçmişi şifreleniyor...');
            const chats = await apiService.getChatConversations();
            await new Promise(r => setTimeout(r, 600));

            setExportStatus('Ticaret ve sağlık kayıtları ekleniyor...');
            const orders = await apiService.getOrders();
            const walkStats = await apiService.getWalkStats(user.id);
            await new Promise(r => setTimeout(r, 600));

            setExportStatus('Paket mühürleniyor...');
            exportUserData({
                user,
                pets,
                posts: userPosts,
                adoptions: userAds,
                notifications,
                orders,
                chats,
                walkStats
            });
        } catch (error) {
            console.error("Dışa aktarma başarısız:", error);
        } finally {
            setIsExporting(false);
            setExportStatus('');
        }
    };

    const handleAddWord = () => {
        if (!newWord.trim() || !user?.settings?.content) return;
        const currentWords = user.settings.content.hiddenWords || [];
        if (currentWords.includes(newWord.trim())) return;
        updateSettings('content', { hiddenWords: [...currentWords, newWord.trim()] });
        setNewWord('');
    };

    const handleRemoveWord = (word: string) => {
        if (!user?.settings?.content) return;
        const currentWords = user.settings.content.hiddenWords || [];
        updateSettings('content', { hiddenWords: currentWords.filter(w => w !== word) });
    };

    const handleUnblock = (id: string) => {
        if (!user?.settings?.moderation) return;
        const currentBlocked = user.settings.moderation.blockedUsers || [];
        updateSettings('moderation', { blockedUsers: currentBlocked.filter(u => u.id !== id) });
    };

    const handleResetSystem = () => {
        if (confirm("Tüm sistem verileri ve ayarların sıfırlanacak. Bu işlem geri alınamaz. Emin misin?")) {
            localStorage.clear();
            window.location.reload();
        }
    };

    const viewProps: ViewProps = {
        user, setView, updateSettings, handleToggle, handleExport, 
        isExporting, onClose, logout, handleResetSystem,
        fontSize, setFontSize, colorBlindMode, setColorBlindMode,
        boldText, setBoldText, highContrast, setHighContrast,
        reduceMotion, setReduceMotion, reduceTransparency, setReduceTransparency,
        newWord, setNewWord, handleAddWord, handleRemoveWord, handleUnblock,
        terminateSession, terminateAllOtherSessions, changePassword,
        exportStatus,
        theme, setTheme
    };

    return (
        <AnimatePresence mode="wait">
            {isOpen && (
                <>
                    <motion.div 
                        initial={{ opacity: 0 }} 
                        animate={{ opacity: 1 }} 
                        exit={{ opacity: 0 }} 
                        onClick={onClose} 
                        className="fixed inset-0 bg-black/80 backdrop-blur-md z-[9998]" 
                    />
                    <motion.div 
                        initial={{ y: "100%", opacity: 0 }} 
                        animate={{ y: 0, opacity: 1 }} 
                        exit={{ y: "100%", opacity: 0 }} 
                        transition={{ type: "spring", damping: 28, stiffness: 180 }} 
                        className="fixed inset-x-0 bottom-0 h-[94%] bg-background/85 backdrop-blur-2xl z-[9999] rounded-t-[3.5rem] p-3 flex flex-col shadow-2xl border-t border-card-border overflow-hidden transform-gpu will-change-transform"
                    >
                        <div className="w-12 h-1.5 bg-white/10 rounded-full mx-auto mb-8 cursor-pointer" onClick={onClose} />
                        
                        <div className="flex items-center justify-between mb-8 px-4">
                            <div className="flex items-center gap-3">
                                {view !== 'main' && (
                                    <button 
                                        onClick={() => setView('main')} 
                                        className="w-8 h-8 rounded-xl bg-foreground/5 flex items-center justify-center hover:bg-foreground/10 transition-colors"
                                    >
                                        <ArrowLeft className="w-4 h-4 text-foreground" />
                                    </button>
                                )}
                                <div className="text-left">
                                    <h1 className="text-[29px] font-black text-foreground italic tracking-tighter uppercase leading-none">Ayarlar</h1>
                                    <p className="text-[10px] text-secondary font-black uppercase tracking-[0.3em] mt-1.5">Moffi Core Dynamics</p>
                                </div>
                            </div>
                            <button 
                                onClick={onClose} 
                                className="w-10 h-10 rounded-full bg-foreground/5 flex items-center justify-center hover:bg-foreground/10 transition-colors border border-card-border"
                            >
                                <X className="w-5 h-5 text-foreground" />
                            </button>
                        </div>

                        <div className="flex-1 relative">
                            <AnimatePresence mode="wait">
                                {view === 'main' ? (
                                    <MainView key="main" {...viewProps} />
                                ) : view === 'activity' ? (
                                    <LoginActivityView key="activity" {...viewProps} />
                                ) : view === 'blocked' ? (
                                    <BlockedUsersView key="blocked" {...viewProps} />
                                ) : view === 'words' ? (
                                    <HiddenWordsView key="words" {...viewProps} />
                                ) : view === 'stories' ? (
                                    <StorySettingsView key="stories" {...viewProps} />
                                ) : view === 'wellbeing' ? (
                                    <WellbeingView key="wellbeing" {...viewProps} />
                                ) : view === 'password' ? (
                                    <PasswordChangeView key="password" {...viewProps} />
                                ) : view === 'privacy' ? (
                                    <PrivacyView key="privacy" {...viewProps} />
                                ) : view === 'notifications' ? (
                                    <NotificationsView key="notifications" {...viewProps} />
                                ) : view === 'sos_config' ? (
                                    <SOSConfigView key="sos" {...viewProps} />
                                ) : view === 'appearance_detail' ? (
                                    <AppearanceDetailView key="appearance" {...viewProps} />
                                ) : (
                                    <AccessibilityView key="accessibility" {...viewProps} />
                                )}
                            </AnimatePresence>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
