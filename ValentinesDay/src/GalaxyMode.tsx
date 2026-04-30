import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Play, Pause, Maximize } from 'lucide-react';

interface GalaxyModeProps {
    photos: any[];
    onClose: () => void;
}

// Cosmic chapters - Uzay temalı bölümler
const cosmicChapters = [
    {
        title: 'NEBULA OF BEGINNINGS',
        subtitle: 'İki yıldızın ilk buluşması...',
        color: '#FF1493',
        range: [0, 3]
    },
    {
        title: 'CONSTELLATION OF LOVE',
        subtitle: 'Kalpler aynı galakside döner',
        color: '#00D4FF',
        range: [3, 12]
    },
    {
        title: 'SUPERNOVA OF JOY',
        subtitle: 'Mutluluk patlaması - 19 Ocak',
        color: '#FFD700',
        range: [12, 17]
    }
];

export const GalaxyMode = ({ photos, onClose }: GalaxyModeProps) => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [showIntro, setShowIntro] = useState(true);
    const [isPaused, setIsPaused] = useState(false);
    const [stars, setStars] = useState<any[]>([]);
    const [meteors, setMeteors] = useState<any[]>([]);
    const [particles, setParticles] = useState<any[]>([]);

    // Current chapter
    const currentChapter = cosmicChapters.find(
        ch => currentIndex >= ch.range[0] && currentIndex < ch.range[1]
    ) || cosmicChapters[0];

    // Generate stars (5 layers for parallax)
    useEffect(() => {
        const newStars = Array.from({ length: 300 }, (_, i) => ({
            id: i,
            x: Math.random() * 100,
            y: Math.random() * 100,
            size: Math.random() * 3 + 1,
            layer: Math.floor(Math.random() * 5) + 1,
            twinkleDelay: Math.random() * 3
        }));
        setStars(newStars);
    }, []);

    // Generate meteors periodically
    useEffect(() => {
        const meteorInterval = setInterval(() => {
            const newMeteor = {
                id: Date.now(),
                startX: Math.random() * 100,
                startY: -10,
                angle: 45 + Math.random() * 90
            };
            setMeteors(prev => [...prev, newMeteor]);

            // Remove after animation
            setTimeout(() => {
                setMeteors(prev => prev.filter(m => m.id !== newMeteor.id));
            }, 2000);
        }, 3000);

        return () => clearInterval(meteorInterval);
    }, []);

    // Hide intro
    useEffect(() => {
        if (showIntro) {
            const timer = setTimeout(() => setShowIntro(false), 6000);
            return () => clearTimeout(timer);
        }
    }, [showIntro]);

    // Auto-progress
    useEffect(() => {
        if (showIntro || isPaused) return;

        const timer = setTimeout(() => {
            if (currentIndex < photos.length - 1) {
                // Particle explosion on transition
                const burst = Array.from({ length: 30 }, (_, i) => ({
                    id: Date.now() + i,
                    angle: (360 / 30) * i,
                    speed: Math.random() * 3 + 2
                }));
                setParticles(burst);
                setTimeout(() => setParticles([]), 1000);

                setCurrentIndex(prev => prev + 1);
            } else {
                setCurrentIndex(0); // Loop
            }
        }, 6000);

        return () => clearTimeout(timer);
    }, [currentIndex, showIntro, isPaused, photos.length]);

    // Keyboard controls
    useEffect(() => {
        const handleKeyPress = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
            if (e.key === ' ') {
                e.preventDefault();
                setIsPaused(!isPaused);
            }
            if (e.key === 'F11' || e.key === 'f') {
                e.preventDefault();
                toggleFullscreen();
            }
        };

        window.addEventListener('keydown', handleKeyPress);
        return () => window.removeEventListener('keydown', handleKeyPress);
    }, [isPaused, onClose]);

    // Fullscreen toggle
    const toggleFullscreen = () => {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen();
        } else {
            document.exitFullscreen();
        }
    };

    return (
        <div className="galaxy-mode">
            {/* Animated starfield background with 5 parallax layers */}
            <div className="starfield">
                {stars.map(star => (
                    <motion.div
                        key={star.id}
                        className="star"
                        style={{
                            left: `${star.x}%`,
                            top: `${star.y}%`,
                            width: `${star.size}px`,
                            height: `${star.size}px`,
                            '--layer': star.layer
                        } as any}
                        animate={{
                            opacity: [0.3, 1, 0.3],
                            scale: [1, 1.5, 1]
                        }}
                        transition={{
                            duration: 2 + Math.random() * 2,
                            repeat: Infinity,
                            delay: star.twinkleDelay
                        }}
                    />
                ))}
            </div>

            {/* Nebula background */}
            <motion.div
                className="nebula"
                animate={{
                    background: [
                        `radial-gradient(ellipse at 20% 30%, ${currentChapter.color}40 0%, transparent 50%)`,
                        `radial-gradient(ellipse at 80% 70%, ${currentChapter.color}40 0%, transparent 50%)`,
                        `radial-gradient(ellipse at 50% 50%, ${currentChapter.color}40 0%, transparent 50%)`
                    ]
                }}
                transition={{
                    duration: 10,
                    repeat: Infinity,
                    repeatType: "reverse"
                }}
            />

            {/* Meteors */}
            {meteors.map(meteor => (
                <motion.div
                    key={meteor.id}
                    className="meteor"
                    initial={{
                        x: `${meteor.startX}vw`,
                        y: `${meteor.startY}vh`,
                        opacity: 0
                    }}
                    animate={{
                        x: `${meteor.startX + 50}vw`,
                        y: `${meteor.startY + 100}vh`,
                        opacity: [0, 1, 0.5, 0]
                    }}
                    transition={{
                        duration: 2,
                        ease: "linear"
                    }}
                />
            ))}

            {/* Particle burst */}
            {particles.map(particle => (
                <motion.div
                    key={particle.id}
                    className="particle"
                    initial={{
                        x: '50vw',
                        y: '50vh',
                        opacity: 1
                    }}
                    animate={{
                        x: `calc(50vw + ${Math.cos(particle.angle * Math.PI / 180) * 300}px)`,
                        y: `calc(50vh + ${Math.sin(particle.angle * Math.PI / 180) * 300}px)`,
                        opacity: 0,
                        scale: [0, 1.5, 0]
                    }}
                    transition={{
                        duration: 1,
                        ease: "easeOut"
                    }}
                />
            ))}

            {/* Aurora overlay */}
            <div className="aurora" />

            {/* Close button */}
            <motion.button
                className="galaxy-close"
                onClick={onClose}
                whileHover={{ scale: 1.2, rotate: 90 }}
                whileTap={{ scale: 0.9 }}
            >
                <X size={28} />
            </motion.button>

            {/* Play/Pause */}
            {!showIntro && (
                <>
                    <motion.button
                        className="galaxy-play-pause"
                        onClick={() => setIsPaused(!isPaused)}
                        whileHover={{ scale: 1.2 }}
                        whileTap={{ scale: 0.9 }}
                        title={isPaused ? "Devam Et (SPACE)" : "Duraklat (SPACE)"}
                    >
                        {isPaused ? <Play size={24} /> : <Pause size={24} />}
                    </motion.button>

                    {/* Fullscreen button */}
                    <motion.button
                        className="galaxy-fullscreen"
                        onClick={toggleFullscreen}
                        whileHover={{ scale: 1.2 }}
                        whileTap={{ scale: 0.9 }}
                        title="Tam Ekran (F11 veya F)"
                    >
                        <Maximize size={24} />
                    </motion.button>
                </>
            )}

            {/* Intro - Galaxy spiral */}
            <AnimatePresence>
                {showIntro && (
                    <motion.div
                        className="galaxy-intro"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                    >
                        <motion.div
                            className="spiral-galaxy"
                            animate={{
                                rotate: 360
                            }}
                            transition={{
                                duration: 20,
                                repeat: Infinity,
                                ease: "linear"
                            }}
                        />
                        <motion.h1
                            initial={{ scale: 0, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ delay: 1, duration: 2, type: "spring" }}
                        >
                            ✨ COSMIC LOVE STORY ✨
                        </motion.h1>
                        <motion.p
                            initial={{ y: 50, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 2.5, duration: 1.5 }}
                        >
                            İki yıldız, sonsuz evrende buluştu...
                        </motion.p>
                        <motion.div
                            className="cosmic-subtitle"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: [0, 1, 1, 0] }}
                            transition={{ delay: 4, duration: 2 }}
                        >
                            RABIA & BARAN
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Main content */}
            {!showIntro && (
                <>
                    {/* Holographic chapter title */}
                    <motion.div
                        key={currentChapter.title}
                        className="holographic-title"
                        initial={{ opacity: 0, y: -50 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        style={{
                            '--glow-color': currentChapter.color
                        } as any}
                    >
                        <div className="hologram-text">{currentChapter.title}</div>
                        <div className="hologram-subtitle">{currentChapter.subtitle}</div>
                    </motion.div>

                    {/* Photo as planet */}
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={currentIndex}
                            className="planet-container"
                            initial={{ scale: 0, rotateY: -180, opacity: 0 }}
                            animate={{ scale: 1, rotateY: 0, opacity: 1 }}
                            exit={{ scale: 0, rotateY: 180, opacity: 0 }}
                            transition={{
                                duration: 1.5,
                                type: "spring",
                                stiffness: 50
                            }}
                        >
                            <div className="planet-ring" />
                            <motion.div
                                className="planet-sphere"
                                animate={{
                                    rotateY: [0, 360]
                                }}
                                transition={{
                                    duration: 20,
                                    repeat: Infinity,
                                    ease: "linear"
                                }}
                            >
                                <img
                                    src={photos[currentIndex].url}
                                    alt={photos[currentIndex].title}
                                    className="planet-image"
                                />
                                <div className="planet-glow" style={{ boxShadow: `0 0 100px 50px ${currentChapter.color}80` }} />
                            </motion.div>

                            {/* Caption with holographic effect */}
                            <motion.div
                                className="cosmic-caption"
                                initial={{ opacity: 0, y: 30 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.8 }}
                            >
                                <h2>{photos[currentIndex].title}</h2>
                                <p>{photos[currentIndex].desc}</p>
                            </motion.div>
                        </motion.div>
                    </AnimatePresence>

                    {/* Progress constellation */}
                    <div className="constellation-progress">
                        {photos.map((_, idx) => (
                            <motion.div
                                key={idx}
                                className={`constellation-dot ${idx === currentIndex ? 'active' : ''} ${idx < currentIndex ? 'passed' : ''}`}
                                animate={idx === currentIndex ? {
                                    scale: [1, 1.5, 1],
                                    boxShadow: [
                                        `0 0 10px ${currentChapter.color}`,
                                        `0 0 30px ${currentChapter.color}`,
                                        `0 0 10px ${currentChapter.color}`
                                    ]
                                } : {}}
                                transition={{
                                    duration: 2,
                                    repeat: Infinity
                                }}
                            />
                        ))}
                    </div>
                </>
            )}
        </div>
    );
};
