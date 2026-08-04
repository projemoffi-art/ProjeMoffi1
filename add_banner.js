const fs = require('fs');

let content = fs.readFileSync('src/app/home/page.tsx', 'utf8');

// 1. Import Gamepad2
if (!content.includes('Gamepad2,')) {
    content = content.replace('Clock,', 'Clock,\n    Gamepad2,');
}

// 2. Insert Game Center Banner after the Quick Access grid section
const insertPoint = `</section>\n                {/* 9. Hero Pet Identity Card - Premium 3D Parallax Card */}`;
const bannerCode = `</section>\n
                {/* 8.5 Arcade / Game Center Premium Banner */}
                <section className="mb-10 px-5 relative z-20">
                    <motion.div 
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => router.push('/game')}
                        className="relative w-full h-32 md:h-36 rounded-[2rem] overflow-hidden cursor-pointer shadow-[0_12px_40px_rgba(139,92,246,0.25)] dark:shadow-[0_12px_40px_rgba(139,92,246,0.15)] group border border-purple-500/20"
                    >
                        {/* Dynamic Animated Background Gradient */}
                        <div className="absolute inset-0 bg-gradient-to-br from-indigo-600 via-purple-600 to-fuchsia-600">
                            <motion.div 
                                animate={{ x: [0, 50, 0], y: [0, -30, 0] }}
                                transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
                                className="absolute top-0 left-10 w-32 h-32 bg-cyan-400/40 rounded-full blur-2xl pointer-events-none" 
                            />
                            <motion.div 
                                animate={{ x: [0, -40, 0], y: [0, 40, 0] }}
                                transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
                                className="absolute bottom-0 right-10 w-40 h-40 bg-pink-500/40 rounded-full blur-3xl pointer-events-none" 
                            />
                        </div>
                        
                        {/* Abstract Tech Patterns / Noise */}
                        <div className="absolute inset-0 opacity-10 bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />
                        
                        <div className="relative z-10 w-full h-full flex items-center justify-between px-6 py-4">
                            <div className="flex flex-col h-full justify-center">
                                <div className="flex items-center gap-2 mb-1">
                                    <span className="px-2.5 py-1 bg-white/20 backdrop-blur-md rounded-lg text-[9px] font-black tracking-widest text-white uppercase shadow-sm border border-white/20">
                                        OYUN
                                    </span>
                                    <span className="flex items-center gap-1 text-[10px] font-bold text-white/80">
                                        <Coins className="w-3.5 h-3.5 text-yellow-300" />
                                        Kazan
                                    </span>
                                </div>
                                <h3 className="text-2xl md:text-3xl font-black text-white tracking-tight drop-shadow-md">
                                    Oyun Merkezi
                                </h3>
                                <p className="text-[12px] text-white/90 font-medium max-w-[170px] leading-tight mt-1">
                                    Görevleri tamamla, oyna ve ödülleri topla!
                                </p>
                            </div>
                            
                            {/* 3D Floating Gamepad Icon */}
                            <div className="relative">
                                <motion.div
                                    animate={{ y: [-5, 5, -5], rotate: [-2, 2, -2] }}
                                    transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                                    className="relative z-10 w-16 h-16 md:w-20 md:h-20 bg-white/10 backdrop-blur-lg rounded-[1.5rem] flex items-center justify-center border border-white/30 shadow-[0_8px_32px_rgba(0,0,0,0.2)]"
                                >
                                    <Gamepad2 className="w-8 h-8 md:w-10 md:h-10 text-white drop-shadow-[0_2px_10px_rgba(255,255,255,0.5)]" />
                                </motion.div>
                                {/* Glow behind gamepad */}
                                <div className="absolute inset-0 bg-white/30 blur-2xl rounded-full scale-150 animate-pulse" />
                            </div>
                        </div>
                    </motion.div>
                </section>

                {/* 9. Hero Pet Identity Card - Premium 3D Parallax Card */}`;

content = content.replace(insertPoint, bannerCode);

fs.writeFileSync('src/app/home/page.tsx', content, 'utf8');
console.log('Game center banner added.');
