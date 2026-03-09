import React, { useState } from 'react';
import { Sticker, Type, Shapes, Image as ImageIcon, Sparkles, Search, MonitorPlay } from 'lucide-react';
import { useStudio } from './StudioEngine';
import { STUDIO_ASSETS, STUDIO_FONTS, AI_STYLES } from './StudioAssets';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

const TABS = [
    { id: 'stickers', icon: Sticker, label: 'Sticker' },
    { id: 'text', icon: Type, label: 'Metin' },
    { id: 'shapes', icon: Shapes, label: 'Şekil' },
    { id: 'ai', icon: Sparkles, label: 'AI Magic', special: true },
    { id: 'upload', icon: ImageIcon, label: 'Yükle' },
];

export function LeftPanel() {
    const { actions, dispatch } = useStudio();
    const [activeTab, setActiveTab] = useState('stickers');
    const [searchQuery, setSearchQuery] = useState('');

    // Filter Assets
    const stickers = STUDIO_ASSETS.filter(a => a.category === 'stickers');
    const shapes = STUDIO_ASSETS.filter(a => a.category === 'shapes');

    // --- RENDERERS ---

    const renderAssetGrid = (items: any[], type: 'sticker' | 'shape') => (
        <div className="grid grid-cols-3 gap-3 p-4 pb-24 overflow-y-auto h-full scrollbar-none">
            {items.map((item, i) => (
                <button
                    key={i}
                    onClick={() => {
                        if (type === 'sticker') actions.addLayer('sticker', item.url);
                        if (type === 'shape') actions.addLayer('shape', 'circle', { extraIcon: item.icon }); // Using dummy content for shape now
                    }}
                    className="aspect-square bg-gray-50 dark:bg-white/5 rounded-2xl flex items-center justify-center p-3 hover:bg-white hover:shadow-lg dark:hover:bg-white/10 transition-all border border-transparent hover:border-gray-100 group"
                >
                    {type === 'sticker' ? (
                        <img src={item.url} className="w-full h-full object-contain pointer-events-none group-hover:scale-110 transition-transform" />
                    ) : (
                        <item.icon className="w-8 h-8 text-gray-700 dark:text-gray-300" />
                    )}
                </button>
            ))}
        </div>
    );

    const renderTextPresets = () => (
        <div className="p-4 space-y-3 pb-24 overflow-y-auto h-full">
            {['Eklemek için tıkla', 'Başlık', 'Alt Başlık'].map((label, i) => (
                <button
                    key={i}
                    onClick={() => actions.addLayer('text', label, {
                        fontFamily: i === 0 ? 'Inter' : i === 1 ? 'Bangers' : 'Playfair Display',
                        fontSize: i === 0 ? 32 : i === 1 ? 48 : 24
                    })}
                    className="w-full h-16 bg-gray-50 dark:bg-white/5 border-2 border-dashed border-gray-200 dark:border-white/10 rounded-xl flex items-center justify-center text-gray-600 dark:text-gray-300 font-bold hover:bg-blue-50 hover:border-blue-200 dark:hover:bg-blue-900/10 transition-colors"
                >
                    {label}
                </button>
            ))}

            <div className="pt-4 pb-2 text-xs font-bold text-gray-400 uppercase tracking-wider">Fontlar</div>
            <div className="grid grid-cols-1 gap-2">
                {STUDIO_FONTS.map(font => (
                    <div key={font.name} className="flex justify-between items-center group cursor-pointer p-2 hover:bg-gray-100 dark:hover:bg-white/5 rounded-lg" onClick={() => actions.addLayer('text', 'Örnek Metin', { fontFamily: font.family })}>
                        <span style={{ fontFamily: font.family }} className="text-lg text-gray-800 dark:text-white">{font.name}</span>
                        <span className="text-[10px] bg-gray-200 dark:bg-white/10 px-2 py-1 rounded text-gray-500">{font.category}</span>
                    </div>
                ))}
            </div>
        </div>
    );

    const renderAiTools = () => (
        <div className="p-4 space-y-6 pb-24 overflow-y-auto h-full">
            <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-3xl p-6 text-white shadow-xl relative overflow-hidden">
                <Sparkles className="w-32 h-32 absolute -right-6 -bottom-6 text-white/10 rotate-12" />
                <h3 className="text-xl font-bold mb-2 relative z-10">AI Sticker ✨</h3>
                <p className="text-white/80 text-sm mb-4 relative z-10">Hayal ettiğin her şeyi buraya yaz, saniyeler içinde sticker olsun.</p>
                <div className="bg-white/20 backdrop-blur-md rounded-xl p-1 flex">
                    <input
                        className="flex-1 bg-transparent border-none outline-none text-white placeholder-white/50 px-3 text-sm"
                        placeholder="Örn: Uzaylı kedi..."
                    />
                    <button className="bg-white text-purple-600 px-4 py-2 rounded-lg text-xs font-bold hover:bg-gray-100 transition">
                        Üret
                    </button>
                </div>
            </div>

            <div className="space-y-3">
                <div className="text-xs font-bold text-gray-400 uppercase tracking-wider">Stiller</div>
                <div className="grid grid-cols-2 gap-3">
                    {AI_STYLES.map(style => (
                        <div key={style.id} className="relative aspect-video rounded-xl overflow-hidden group cursor-pointer hover:ring-2 ring-purple-500 transition-all" onClick={() => alert('Demo: Stil seçildi')}>
                            <img src={style.image} className="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-opacity" />
                            <span className="absolute bottom-2 left-2 text-white text-xs font-bold shadow-black drop-shadow-md">{style.label}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );

    return (
        <aside className="w-[360px] bg-white dark:bg-[#111] border-r border-gray-100 dark:border-white/5 flex flex-col pt-16 h-full z-40 fixed left-0 top-0 shadow-2xl z-[40]">
            {/* SEARCH */}
            <div className="px-4 pb-4 pt-2">
                <div className="bg-gray-100 dark:bg-white/5 h-10 rounded-xl flex items-center px-3 border border-transparent focus-within:border-gray-300 dark:focus-within:border-white/20 transition-all">
                    <Search className="w-4 h-4 text-gray-400 mr-2" />
                    <input
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Materyal ara..."
                        className="bg-transparent border-none outline-none flex-1 text-sm text-gray-900 dark:text-white placeholder-gray-400"
                    />
                </div>
            </div>

            {/* TABS */}
            <div className="flex px-4 gap-4 overflow-x-auto pb-2 scrollbar-hide border-b border-gray-100 dark:border-white/5">
                {TABS.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={cn(
                            "flex flex-col items-center gap-1 min-w-[60px] pb-2 border-b-2 transition-all",
                            activeTab === tab.id
                                ? "border-black dark:border-white text-black dark:text-white"
                                : "border-transparent text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                        )}
                    >
                        <tab.icon className={cn("w-6 h-6 p-1 rounded-lg", tab.special && "text-purple-500 bg-purple-50 dark:bg-purple-900/20")} />
                        <span className="text-[10px] font-bold">{tab.label}</span>
                    </button>
                ))}
            </div>

            {/* CONTENT */}
            <div className="flex-1 bg-white dark:bg-[#111] relative">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={activeTab}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.2 }}
                        className="h-full"
                    >
                        {activeTab === 'stickers' && renderAssetGrid(stickers, 'sticker')}
                        {activeTab === 'shapes' && renderAssetGrid(shapes, 'shape')}
                        {activeTab === 'text' && renderTextPresets()}
                        {activeTab === 'ai' && renderAiTools()}
                        {activeTab === 'upload' && (
                            <div className="h-full flex flex-col items-center justify-center text-gray-400 p-8 text-center border-2 border-dashed border-gray-100 dark:border-white/5 m-4 rounded-xl">
                                <ImageIcon className="w-12 h-12 mb-2 opacity-50" />
                                <p className="text-sm font-bold">Görsel Yükle</p>
                                <p className="text-xs">veya buraya sürükle</p>
                            </div>
                        )}
                    </motion.div>
                </AnimatePresence>
            </div>
        </aside>
    );
}
