const fs = require('fs');

let content = fs.readFileSync('src/app/home/page.tsx', 'utf8');
const lines = content.split('\n');

// Find the index of the banner
const startIdx = lines.findIndex(l => l.includes('8.5 Arcade / Game Center Premium Banner'));
const endIdx = lines.findIndex(l => l.includes('9. Hero Pet Identity Card - Premium 3D Parallax Card'));

if (startIdx !== -1 && endIdx !== -1) {
    const bannerCode = `                {/* 8.5 Arcade / Game Center Premium Banner */}
                <section className="mb-10 px-5 relative z-20">
                    <motion.div 
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => router.push('/game')}
                        className="relative w-full h-32 md:h-36 rounded-[2rem] overflow-hidden cursor-pointer shadow-[0_8px_30px_rgb(0,0,0,0.06)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.4)] border border-gray-100 dark:border-white/5 group bg-white dark:bg-[#1a1b1e] flex items-center justify-between px-6 md:px-8"
                    >
                        {/* Subtle Glowing Background Elements */}
                        <div className="absolute right-0 top-0 bottom-0 w-1/2 bg-gradient-to-l from-indigo-500/5 to-transparent pointer-events-none" />
                        <div className="absolute -right-10 -top-10 w-40 h-40 bg-purple-500/15 rounded-full blur-3xl pointer-events-none group-hover:bg-purple-500/25 transition-colors" />
                        <div className="absolute -left-10 -bottom-10 w-32 h-32 bg-cyan-500/10 rounded-full blur-2xl pointer-events-none group-hover:bg-cyan-500/20 transition-colors" />
                        
                        <div className="relative z-10 flex flex-col justify-center h-full max-w-[65%]">
                            <div className="flex items-center gap-2 mb-2">
                                <div className="w-7 h-7 rounded-[10px] bg-indigo-500/10 flex items-center justify-center">
                                    <Gamepad2 className="w-4 h-4 text-indigo-500" />
                                </div>
                                <span className="text-[10px] font-black tracking-widest text-indigo-500 dark:text-indigo-400 uppercase">
                                    Oyun Merkezi
                                </span>
                            </div>
                            <h3 className="text-[20px] md:text-[24px] font-black text-foreground tracking-tight leading-tight">
                                Eğlenirken<br/>Ödülleri Topla
                            </h3>
                        </div>
                        
                        {/* Moffi Puan Display / CTA */}
                        <div className="relative z-10 flex flex-col items-end justify-center shrink-0">
                            <div className="bg-gradient-to-br from-amber-400 to-orange-500 rounded-[16px] p-[1.5px] shadow-sm mb-2 group-hover:shadow-md transition-shadow group-hover:scale-105">
                                <div className="bg-white dark:bg-[#1a1b1e] rounded-[14px] px-3.5 py-1.5 flex items-center gap-2">
                                    <Coins className="w-4 h-4 text-amber-500 drop-shadow-sm" />
                                    <span className="text-[14px] font-black text-foreground">
                                        {totalPatiPuan.toLocaleString('tr-TR')} <span className="text-amber-500 text-[10px]">PT</span>
                                    </span>
                                </div>
                            </div>
                            <div className="flex items-center gap-1 text-[10.5px] font-bold text-gray-400 dark:text-gray-500 group-hover:text-indigo-500 transition-colors">
                                Hemen Oyna <ChevronRight className="w-3.5 h-3.5" />
                            </div>
                        </div>
                    </motion.div>
                </section>

`;
    // splice the old code out
    lines.splice(startIdx, endIdx - startIdx, bannerCode);
    fs.writeFileSync('src/app/home/page.tsx', lines.join('\n'), 'utf8');
    console.log('Banner updated successfully.');
} else {
    console.log('Could not find start or end bounds for replacement.');
}
