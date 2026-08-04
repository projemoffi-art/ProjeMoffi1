const fs = require('fs');

let content = fs.readFileSync('src/app/home/page.tsx', 'utf8');
const lines = content.split('\n');

const startIdx = lines.findIndex(l => l.includes('8.5 Arcade / Game Center Premium Banner'));
const endIdx = lines.findIndex(l => l.includes('9. Hero Pet Identity Card - Premium 3D Parallax Card'));

if (startIdx !== -1 && endIdx !== -1) {
    const bannerCode = `                {/* 8.5 Arcade / Game Center Premium Banner */}
                <section className="mb-10 px-5 relative z-20">
                    <motion.div 
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => router.push('/game')}
                        className="relative w-full h-32 md:h-36 rounded-[2rem] overflow-hidden cursor-pointer shadow-[0_12px_40px_rgba(139,92,246,0.3)] dark:shadow-[0_12px_40px_rgba(139,92,246,0.2)] border border-indigo-500/20 dark:border-indigo-500/30 group bg-white dark:bg-[#1a1b1e] flex items-center justify-between px-6 md:px-8"
                    >
                        {/* Background Gradients & Effects */}
                        <div className="absolute right-0 top-0 bottom-0 w-2/3 bg-gradient-to-l from-indigo-500/15 to-transparent pointer-events-none z-0" />
                        <div className="absolute -right-10 -top-10 w-48 h-48 bg-purple-500/30 dark:bg-purple-500/40 rounded-full blur-3xl pointer-events-none group-hover:bg-purple-500/40 transition-colors z-0" />
                        <div className="absolute -left-10 -bottom-10 w-40 h-40 bg-cyan-500/20 dark:bg-cyan-500/30 rounded-full blur-2xl pointer-events-none group-hover:bg-cyan-500/35 transition-colors z-0" />
                        
                        {/* Giant Mascot in Background - Right Aligned, Much More Visible */}
                        <div className="absolute right-4 md:right-24 -top-[30%] -bottom-[30%] w-64 md:w-72 pointer-events-none z-0 mix-blend-screen filter brightness-125 contrast-150 saturate-150" style={{ maskImage: 'radial-gradient(ellipse at center, black 60%, transparent 85%)', WebkitMaskImage: 'radial-gradient(ellipse at center, black 60%, transparent 85%)' }}>
                            <img 
                                src="/images/robot_moffi.jpg" 
                                alt="Robot Moffi Background" 
                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" 
                            />
                        </div>
                        
                        <div className="relative z-10 flex flex-col justify-center h-full max-w-[65%]">
                            <div className="flex items-center gap-2 mb-1">
                                <span className="text-[10px] font-black tracking-widest text-indigo-600 dark:text-indigo-400 uppercase drop-shadow-sm bg-white/50 dark:bg-black/40 px-2 py-0.5 rounded-full backdrop-blur-sm">
                                    Oyun Merkezi
                                </span>
                            </div>
                            <h3 className="text-[20px] md:text-[24px] font-black text-foreground tracking-tight leading-tight drop-shadow-md">
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
                            <div className="flex items-center gap-1 text-[10.5px] font-bold text-gray-500 dark:text-gray-400 group-hover:text-indigo-500 transition-colors bg-white/60 dark:bg-black/60 backdrop-blur-md px-3 py-1 rounded-full shadow-sm">
                                Hemen Oyna <ChevronRight className="w-3.5 h-3.5" />
                            </div>
                        </div>
                    </motion.div>
                </section>

`;
    lines.splice(startIdx, endIdx - startIdx, bannerCode);
    fs.writeFileSync('src/app/home/page.tsx', lines.join('\n'), 'utf8');
    console.log('Banner updated to make mascot highly visible.');
}
