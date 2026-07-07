import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Play, Pause } from 'lucide-react';

// Chapter definitions
const chapters = [
    { title: 'Başlangıç', range: [0, 3], subtitle: 'Her şey bir mesajla başladı...' },
    { title: 'Kalpler Hızla Attı', range: [3, 12], subtitle: 'İlk buluşmamız ve unutulmaz anlar' },
    { title: 'Doğum Günün', range: [12, 17], subtitle: 'Seninle kutladığım ilk özel gün - 19 Ocak' }
];

interface CinemaModeProps {
    photos: any[];
    onClose: () => void;
}

export const CinemaMode = ({ photos, onClose }: CinemaModeProps) => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [showIntro, setShowIntro] = useState(true);
    const [showOutro, setShowOutro] = useState(false);
    const [isPaused, setIsPaused] = useState(false);
    const [currentChapter, setCurrentChapter] = useState(0);

    // Auto-progress photos
    useEffect(() => {
        if (showIntro || showOutro || isPaused) return;

        const timer = setTimeout(() => {
            if (currentIndex < photos.length - 1) {
                setCurrentIndex(prev => prev + 1);
            } else {
                setShowOutro(true);
            }
        }, 8000); // 8 seconds per photo

        return () => clearTimeout(timer);
    }, [currentIndex, photos.length, showIntro, showOutro, isPaused]);

    // Hide intro after 5 seconds
    useEffect(() => {
        if (showIntro) {
            const timer = setTimeout(() => setShowIntro(false), 5000);
            return () => clearTimeout(timer);
        }
    }, [showIntro]);

    // Update current chapter
    useEffect(() => {
        const chapter = chapters.findIndex(
            ch => currentIndex >= ch.range[0] && currentIndex < ch.range[1]
        );
        if (chapter !== -1 && chapter !== currentChapter) {
            setCurrentChapter(chapter);
        }
    }, [currentIndex, currentChapter]);

    // Keyboard controls
    useEffect(() => {
        const handleKeyPress = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
            if (e.key === ' ') {
                e.preventDefault();
                setIsPaused(!isPaused);
            }
            if (e.key === 'ArrowRight' && currentIndex < photos.length - 1) {
                setCurrentIndex(prev => prev + 1);
            }
            if (e.key === 'ArrowLeft' && currentIndex > 0) {
                setCurrentIndex(prev => prev - 1);
            }
            if (e.key === 'F11' || e.key === 'f') {
                e.preventDefault();
                toggleFullscreen();
            }
        };

        window.addEventListener('keydown', handleKeyPress);
        return () => window.removeEventListener('keydown', handleKeyPress);
    }, [isPaused, currentIndex, photos.length, onClose]);

    // Fullscreen toggle
    const toggleFullscreen = () => {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen();
        } else {
            document.exitFullscreen();
        }
    };

    return (
        <div className="cinema-mode">
            {/* Letterbox bars */}
            <div className="letterbox-top" />
            <div className="letterbox-bottom" />

            {/* Close button */}
            <motion.button
                className="cinema-close"
                onClick={onClose}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
            >
                <X size={28} />
            </motion.button>

            {/* Pause/Play button */}
            {!showIntro && !showOutro && (
                <motion.button
                    className="cinema-play-pause"
                    onClick={() => setIsPaused(!isPaused)}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                >
                    {isPaused ? <Play size={24} /> : <Pause size={24} />}
                </motion.button>
            )}

            {/* Intro Credits */}
            <AnimatePresence>
                {showIntro && (
                    <motion.div
                        className="cinema-intro"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 1 }}
                    >
                        <motion.h1
                            initial={{ y: 50, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 0.5, duration: 1 }}
                        >
                            Bir Aşk Hikayesi
                        </motion.h1>
                        <motion.p
                            initial={{ y: 30, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 1.5, duration: 1 }}
                        >
                            44 Gün, Sonsuz Anı
                        </motion.p>
                        <motion.div
                            className="cinema-hearts"
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ delay: 2.5, duration: 0.8 }}
                        >
                            ❤️
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Photo Display */}
            {!showIntro && !showOutro && (
                <>
                    {/* Chapter Title */}
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={currentChapter}
                            className="cinema-chapter"
                            initial={{ opacity: 0, y: -20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            transition={{ duration: 0.5 }}
                        >
                            <div className="cinema-chapter-number">Bölüm {currentChapter + 1}</div>
                            <div className="cinema-chapter-title">{chapters[currentChapter]?.title}</div>
                            <div className="cinema-chapter-subtitle">{chapters[currentChapter]?.subtitle}</div>
                        </motion.div>
                    </AnimatePresence>

                    {/* Photo */}
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={currentIndex}
                            className="cinema-photo-container"
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 1.05 }}
                            transition={{ duration: 1 }}
                        >
                            <img
                                src={photos[currentIndex].url}
                                alt={photos[currentIndex].title}
                                className="cinema-photo"
                            />
                            <motion.div
                                className="cinema-caption"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.5 }}
                            >
                                <h2>{photos[currentIndex].title}</h2>
                                <p>{photos[currentIndex].desc}</p>
                            </motion.div>
                        </motion.div>
                    </AnimatePresence>

                    {/* Progress indicator */}
                    <div className="cinema-progress">
                        <div
                            className="cinema-progress-bar"
                            style={{ width: `${((currentIndex + 1) / photos.length) * 100}%` }}
                        />
                    </div>
                </>
            )}

            {/* Outro Credits */}
            <AnimatePresence>
                {showOutro && (
                    <motion.div
                        className="cinema-outro"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 1.5 }}
                    >
                        <motion.h1
                            initial={{ y: 50, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 0.5, duration: 1 }}
                        >
                            Seninle Her Gün Bir Film... 🎬
                        </motion.h1>
                        <motion.p
                            initial={{ y: 30, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 1.5, duration: 1 }}
                        >
                            Hikayemiz daha yeni başladı
                        </motion.p>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 2.5, duration: 1 }}
                            className="cinema-credits"
                        >
                            <p>Başrol: Rabia & Baran</p>
                            <p>Yönetmen: Aşk</p>
                            <p>Senaryo: Kader</p>
                            <p>Müzik: Kalbimizin Ritmi</p>
                            <p style={{ marginTop: '2rem', fontSize: '1.5rem' }}>❤️ Sonsuz Sevgiyle ❤️</p>
                        </motion.div>
                        <motion.button
                            className="cinema-restart"
                            onClick={() => {
                                setCurrentIndex(0);
                                setShowOutro(false);
                                setShowIntro(true);
                            }}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 4 }}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                        >
                            Tekrar İzle
                        </motion.button>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};
