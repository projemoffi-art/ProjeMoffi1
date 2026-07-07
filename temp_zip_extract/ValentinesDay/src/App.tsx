import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, Sparkles, Music, Calendar, MapPin, Volume2, VolumeX, ChevronLeft, ChevronRight, X, Play, Pause, Film, Sparkle } from 'lucide-react';
import { CinemaMode } from './CinemaMode';
import { GalaxyMode } from './GalaxyMode';
import './index.css';
import './galaxy.css';

// Floating Heart Component with 3D effect
const FloatingHeart = ({ delay = 0, x = 0 }) => {
  const randomSize = 20 + Math.random() * 30;
  const randomX = x + (Math.random() - 0.5) * 40;

  return (
    <motion.div
      initial={{ y: '110vh', opacity: 0, scale: 0, rotate: 0 }}
      animate={{
        y: '-10vh',
        opacity: [0, 1, 1, 1, 0],
        scale: [0, 1.2, 1, 1, 0.5],
        rotate: [0, 180, 360],
        x: [randomX, randomX + 20, randomX - 20, randomX]
      }}
      transition={{
        duration: 12 + Math.random() * 8,
        delay,
        repeat: Infinity,
        ease: "easeInOut"
      }}
      style={{
        position: 'absolute',
        left: `${x}%`,
        filter: 'drop-shadow(0 0 10px rgba(255, 23, 68, 0.6))'
      }}
    >
      <Heart
        fill="#ff1744"
        color="#ff4081"
        size={randomSize}
        style={{ filter: 'brightness(1.2)' }}
      />
    </motion.div>
  );
};

// Particle component
const Particle = ({ delay = 0 }) => {
  const size = 2 + Math.random() * 4;
  const x = Math.random() * 100;
  const y = Math.random() * 100;

  return (
    <motion.div
      className="particle"
      initial={{ opacity: 0 }}
      animate={{ opacity: [0, 1, 0] }}
      transition={{
        duration: 3 + Math.random() * 2,
        delay,
        repeat: Infinity,
        repeatDelay: Math.random() * 3
      }}
      style={{
        left: `${x}%`,
        top: `${y}%`,
        width: `${size}px`,
        height: `${size}px`,
      }}
    />
  );
};

// Slideshow Modal Component with Premium Transitions
const SlideshowModal = ({ photos, initialIndex, onClose }: { photos: any[]; initialIndex: number; onClose: () => void }) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [isAutoPlay, setIsAutoPlay] = useState(false);
  const [direction, setDirection] = useState(0); // -1 for previous, 1 for next

  // Varied transition animations for premium feel
  const slideVariants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 1000 : -1000,
      opacity: 0,
      scale: 0.8,
      rotateY: direction > 0 ? 45 : -45
    }),
    center: {
      zIndex: 1,
      x: 0,
      opacity: 1,
      scale: 1,
      rotateY: 0
    },
    exit: (direction: number) => ({
      zIndex: 0,
      x: direction < 0 ? 1000 : -1000,
      opacity: 0,
      scale: 0.8,
      rotateY: direction < 0 ? 45 : -45
    })
  };

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') goToPrevious();
      if (e.key === 'ArrowRight') goToNext();
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [currentIndex]);

  useEffect(() => {
    if (!isAutoPlay) return;

    const timer = setInterval(() => {
      setDirection(1);
      setCurrentIndex((prev) => (prev + 1) % photos.length);
    }, 5000); // 5 saniye

    return () => clearInterval(timer);
  }, [isAutoPlay, photos.length]);

  const goToNext = () => {
    setDirection(1);
    setCurrentIndex((prev) => (prev + 1) % photos.length);
  };

  const goToPrevious = () => {
    setDirection(-1);
    setCurrentIndex((prev) => (prev - 1 + photos.length) % photos.length);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="slideshow-modal"
      onClick={onClose}
    >
      <div className="slideshow-content" onClick={(e) => e.stopPropagation()}>
        {/* Close button */}
        <motion.button
          className="slideshow-close"
          onClick={onClose}
          whileHover={{ scale: 1.1, rotate: 90 }}
          whileTap={{ scale: 0.9 }}
        >
          <X size={32} />
        </motion.button>

        {/* Navigation buttons */}
        <motion.button
          className="slideshow-nav slideshow-prev"
          onClick={goToPrevious}
          whileHover={{ scale: 1.15, x: -5 }}
          whileTap={{ scale: 0.95 }}
        >
          <ChevronLeft size={48} />
        </motion.button>
        <motion.button
          className="slideshow-nav slideshow-next"
          onClick={goToNext}
          whileHover={{ scale: 1.15, x: 5 }}
          whileTap={{ scale: 0.95 }}
        >
          <ChevronRight size={48} />
        </motion.button>

        {/* Autoplay toggle */}
        <motion.button
          className="slideshow-autoplay"
          onClick={() => setIsAutoPlay(!isAutoPlay)}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          animate={{
            boxShadow: isAutoPlay
              ? '0 0 20px rgba(255, 215, 0, 0.5)'
              : '0 0 0px rgba(255, 215, 0, 0)'
          }}
        >
          {isAutoPlay ? <Pause size={24} /> : <Play size={24} />}
          <span>{isAutoPlay ? 'Durdur' : 'Otomatik Oynat'}</span>
        </motion.button>

        {/* Image with premium transitions */}
        <AnimatePresence initial={false} custom={direction} mode="wait">
          <motion.div
            key={currentIndex}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{
              x: { type: "spring", stiffness: 300, damping: 30 },
              opacity: { duration: 0.4 },
              scale: { duration: 0.4 },
              rotateY: { duration: 0.5 }
            }}
            className="slideshow-image-wrapper"
            style={{ perspective: 1000 }}
          >
            <motion.img
              src={photos[currentIndex].url}
              alt={photos[currentIndex].title}
              className="slideshow-image"
              initial={{ filter: 'blur(10px)' }}
              animate={{ filter: 'blur(0px)' }}
              transition={{ duration: 0.3 }}
            />
            <motion.div
              className="slideshow-info"
              initial={{ y: 30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.4 }}
            >
              <h2>{photos[currentIndex].title}</h2>
              <p>{photos[currentIndex].desc}</p>
              <motion.span
                className="slideshow-counter"
                key={currentIndex}
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.3 }}
              >
                {currentIndex + 1} / {photos.length}
              </motion.span>
            </motion.div>
          </motion.div>
        </AnimatePresence>
      </div>
    </motion.div>
  );
};

// Surprise message popup
const SurpriseMessage = ({ show, onClose, message }: { show: boolean; onClose: () => void; message: string }) => (
  <AnimatePresence>
    {show && (
      <motion.div
        initial={{ opacity: 0, scale: 0.5, rotate: -10 }}
        animate={{ opacity: 1, scale: 1, rotate: 0 }}
        exit={{ opacity: 0, scale: 0.5, rotate: 10 }}
        transition={{ type: "spring", duration: 0.6 }}
        style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          zIndex: 9999,
          maxWidth: '500px',
          width: '90%'
        }}
      >
        <div className="glass-card" style={{ textAlign: 'center', padding: '3rem' }}>
          <Heart fill="#ffd700" size={60} style={{ marginBottom: '1rem' }} />
          <h2 style={{ fontSize: '2rem', marginBottom: '1rem', color: '#ffd700' }}>
            Sürpriz! 💝
          </h2>
          <p style={{ fontSize: '1.3rem', lineHeight: '1.8', marginBottom: '2rem' }}>
            {message}
          </p>
          <button
            onClick={onClose}
            className="heart-button"
            style={{ fontSize: '1rem', padding: '0.8rem 2rem' }}
          >
            Teşekkür Ederim ❤️
          </button>
        </div>
      </motion.div>
    )}
  </AnimatePresence>
);

function App() {
  const [hearts, setHearts] = useState<number[]>([]);
  const [particles, setParticles] = useState<number[]>([]);
  const [musicPlaying, setMusicPlaying] = useState(false);
  const [showSurprise, setShowSurprise] = useState(false);
  const [slideshowIndex, setSlideshowIndex] = useState<number | null>(null);
  const [cinemaMode, setCinemaMode] = useState(false);
  const [galaxyMode, setGalaxyMode] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    setHearts(Array.from({ length: 25 }, (_, i) => i));
    setParticles(Array.from({ length: 50 }, (_, i) => i));

    // Preload audio
    if (audioRef.current) {
      audioRef.current.load();
      console.log('🎵 Müzik yüklendi. Sağ alttaki butona tıkla!');
    }

    // Show surprise message after 10 seconds
    const timer = setTimeout(() => {
      setShowSurprise(true);
    }, 10000);

    return () => clearTimeout(timer);
  }, []);

  const toggleMusic = () => {
    if (audioRef.current) {
      if (musicPlaying) {
        audioRef.current.pause();
        setMusicPlaying(false);
      } else {
        // Reset source if needed
        if (audioRef.current.readyState === 0) {
          audioRef.current.load();
        }

        // Attempt to play with comprehensive error handling
        const playPromise = audioRef.current.play();

        if (playPromise !== undefined) {
          playPromise
            .then(() => {
              setMusicPlaying(true);
              console.log('🎵 Müzik çalmaya başladı!');
            })
            .catch(error => {
              console.error('Müzik çalma hatası:', error);

              // Try again with volume
              if (audioRef.current) {
                audioRef.current.volume = 0.7;
                audioRef.current.play()
                  .then(() => {
                    setMusicPlaying(true);
                    alert('✅ Müzik başladı! Eğer duyamıyorsan ses seviyeni kontrol et.');
                  })
                  .catch(() => {
                    alert('⚠️ Müzik çalmadı. Lütfen:\n\n1. Sayfayı yenile (F5)\n2. Tekrar müzik butonuna tıkla\n3. Tarayıcı izni ver\n\nYa da:\n- ValentinesDay\\public\\music\\ klasörüne\n- "ey-ask.mp3" adıyla kendi müziğini ekle!');
                  });
              }
            });
        }
      }
    }
  };

  const startCinemaMode = () => {
    setCinemaMode(true);

    // Force music to play in cinema mode
    if (audioRef.current) {
      audioRef.current.volume = 0.8;
      audioRef.current.load(); // Reload audio

      // Try to play immediately
      const playPromise = audioRef.current.play();

      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            setMusicPlaying(true);
            console.log('🎬 Film Modu: Müzik başladı!');
          })
          .catch((error) => {
            console.error('Film Modu müzik hatası:', error);
            // Try one more time after a short delay
            setTimeout(() => {
              if (audioRef.current) {
                audioRef.current.play()
                  .then(() => setMusicPlaying(true))
                  .catch(() => console.log('Müzik başlatılamadı, manuel olarak başlat'));
              }
            }, 500);
          });
      }
    }
  };

  // Your beautiful memories! ❤️ - Her an bir hikaye anlatıyor
  const photos = [
    {
      id: 1,
      url: '/photos/a9ea40e9-4c7f-4e44-8515-4d84c8fa2651.jpg',
      title: '💝 Bu Başlangıçtı...',
      desc: 'Her şey bir an\'da değişti. Seni görmeden önce ve sonrası... İki farklı hayat.'
    },
    {
      id: 2,
      url: '/photos/df3bcb1a-112a-48e1-ac39-1461cb093ab7.jpg',
      title: '📱 "Merhaba" Demek Bu Kadar Zor muydu?',
      desc: 'Instagram\'da saat 2\'de başlayan bir sohbet... Kim bilirdi böyle bir maceraya dönüşeceğini?'
    },
    {
      id: 3,
      url: '/photos/b47d1d3e-20f7-4378-8bed-846e6327165f.jpg',
      title: '💬 Numaralar Alındı, Kalplerden Yer Ayrıldı',
      desc: 'WhatsApp\'a geçiş = "Artık ciddiyim" demekti. Sen de biliyordun, ben de...'
    },
    {
      id: 4,
      url: '/photos/0023c6db-6d93-4e28-8d01-c171d39f891e.jpg',
      title: '✨ Kalbim Bir Maraton Koştu O Gece',
      desc: 'İlk kez seninle göz göze geldik. Dünya döndü ama biz durmadık sanki...'
    },
    {
      id: 5,
      url: '/photos/514da516-befa-49c8-a19c-8c45c956707e.jpg',
      title: '🌙 Sen Güldüğünde Yıldızlar Kıskanıyor',
      desc: 'O gülüşüne her baktığımda dünya biraz daha güzel oluyor. Hala öyle.'
    },
    {
      id: 6,
      url: '/photos/73bd7336-8591-4622-bf03-a1382d561b46.jpg',
      title: '💫 Yanyana Yürümek = Sonsuzluk Hissiyatı',
      desc: 'Adımlarımız uyumlu, kalplerimiz senkron... Sanki hep böyle olacakmış gibi.'
    },
    {
      id: 7,
      url: '/photos/7504890f-11bb-43b0-9553-87e31cebd12c.jpg',
      title: '🌟 Gözlerinde Kaybolmak İstiyorum',
      desc: 'O bakışlarında bir milyon yıldız var. Ve hepsi bana gülümsüyor.'
    },
    {
      id: 8,
      url: '/photos/e4fc9d90-096e-4c86-843e-e2b03fca4d82.jpg',
      title: '❤️ "Keşke Bu Gece Bitmesin" Diye Dua Ettim',
      desc: 'İlk gece, ama son olmasın diye içimden geçirdim. Şükür ki öyle olmadı.'
    },
    {
      id: 9,
      url: '/photos/63cc25e2-5e41-4947-9b79-093c4992e5e0.jpg',
      title: '🤗 Seninle Gülmek Hayatımın En İyi Terapisi',
      desc: 'Kahkahaların benim için bir ilaç. Sen güldüğünde ben iyileşiyorum.'
    },
    {
      id: 10,
      url: '/photos/fdfa823a-039b-4594-b4bd-4b83cbd09411.jpg',
      title: '💕 Her Selfie Bir "Seni Seviyorum" Notu',
      desc: 'Bu karelerin her biri benim için küçük bir aşk mektubu. Hatıralarımızın tanığı.'
    },
    {
      id: 11,
      url: '/photos/330fea83-b2fe-4fe0-b136-f3860669ddbf.jpg',
      title: '🥰 Sevgim Sevimli Değil, Sonsuz!',
      desc: 'Sana duyduğum bu his kelimelerle anlatılamayacak kadar derin, samimi ve gerçek.'
    },
    {
      id: 12,
      url: '/photos/9beeacdc-4903-4654-a587-04330495685f (1).jpg',
      title: '🌹 O Gece Aşık Oldum, Hala Öyleyim',
      desc: 'İlk kez "bu kız farklı" dedim. Şimdi "bu kız benim hayatım" diyorum.'
    },
    {
      id: 13,
      url: '/photos/14281774-6648-44a0-a329-64c96b758e0e.jpg',
      title: '🎂 Doğum Günün Benim İçin Bayramdı',
      desc: 'Seninle kutladığım ilk özel gün... Ve nice yıllara daha birlikte!'
    },
    {
      id: 14,
      url: '/photos/e1e6fafa-2a56-4cee-9374-c5533b1ef019.jpg',
      title: '🎉 Mutluluğun Yüzünde Dans Ediyor',
      desc: 'Seni mutlu görmek benim en büyük mutluluğum. Hep böyle gülümse.'
    },
    {
      id: 15,
      url: '/photos/64c27a6a-20bc-4775-8217-0c9dd268b330.jpg',
      title: '🎈 Hayatıma Renk Katan Tek İnsan Sensin',
      desc: 'Sen gelene kadar her şey siyah-beyazdı. Şimdi gökkuşağı renkleri var.'
    },
    {
      id: 16,
      url: '/photos/dc8c0154-61d3-4673-a316-66e846b85688.jpg',
      title: '💖 Kalbimdesin. Ömür Boyu Oradasın.',
      desc: 'Her anımda, her düşüncemde varsın. Kalbimin sahibi sensin.'
    },
    {
      id: 17,
      url: '/photos/227577bc-83ae-4568-80b9-ddb1f6c3f580.jpg',
      title: '♾️ Sonsuza Dek Böyle Devam...',
      desc: 'Bu hikaye daha yeni başladı. En güzel sayfalar henüz yazılmadı bile.'
    }
  ];

  return (
    <div className="app-container">
      {/* Background particles */}
      <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 0 }}>
        {particles.map((p) => (
          <Particle key={p} delay={p * 0.1} />
        ))}
      </div>

      {/* Floating hearts */}
      <div className="floating-hearts">
        {hearts.map((h) => (
          <FloatingHeart key={h} delay={h * 0.8} x={Math.random() * 100} />
        ))}
      </div>

      {/* Audio element - Sezen Aksu - Ey Aşk 🎵 */}
      <audio
        ref={audioRef}
        loop
        preload="auto"
      >
        {/* İlk öncelik: Sezen Aksu - Ey Aşk */}
        <source src="/music/ey-ask.mp3" type="audio/mpeg" />
        {/* Yedek iddialı, duygusal romantik müzikler */}
        <source src="https://cdn.pixabay.com/audio/2024/03/11/audio_13ab348eae.mp3" type="audio/mpeg" />
        <source src="https://cdn.pixabay.com/audio/2023/11/06/audio_dd86e37c50.mp3" type="audio/mpeg" />
      </audio>

      {/* Music control - Geliştirilmiş versiyon */}
      <motion.div
        className="music-control"
        onClick={toggleMusic}
        whileHover={{ scale: 1.1, rotate: 15 }}
        whileTap={{ scale: 0.9 }}
        title={musicPlaying ? "Müziği Durdur" : "Müziği Başlat"}
        style={{
          background: musicPlaying
            ? 'linear-gradient(135deg, #ffd700 0%, #ff4081 100%)'
            : 'rgba(255, 255, 255, 0.08)'
        }}
      >
        {musicPlaying ? <Volume2 size={24} color="#fff" /> : <VolumeX size={24} color="#ff4081" />}
      </motion.div>

      {/* Slideshow Modal */}
      <AnimatePresence>
        {slideshowIndex !== null && (
          <SlideshowModal
            photos={photos}
            initialIndex={slideshowIndex}
            onClose={() => setSlideshowIndex(null)}
          />
        )}
      </AnimatePresence>

      {/* Cinema Mode */}
      {cinemaMode && (
        <CinemaMode
          photos={photos}
          onClose={() => setCinemaMode(false)}
        />
      )}

      {/* Galaxy Mode - Cosmic Visual Feast */}
      {galaxyMode && (
        <GalaxyMode
          photos={photos}
          onClose={() => setGalaxyMode(false)}
        />
      )}

      {/* Surprise message */}
      <SurpriseMessage
        show={showSurprise}
        onClose={() => setShowSurprise(false)}
        message="Seni düşündüğüm her an, hayat daha güzel oluyor. İyi ki varsın birtanem! 💖"
      />

      {/* Hero Section */}
      <section className="hero">
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 1.2, delay: 0.3, type: "spring" }}
        >
          <Heart
            fill="#ffd700"
            size={100}
            style={{
              marginBottom: '2rem',
              filter: 'drop-shadow(0 0 20px rgba(255, 215, 0, 0.8))',
              animation: 'float 3s ease-in-out infinite'
            }}
          />
        </motion.div>
        <motion.h1
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.6, duration: 1 }}
        >
          Seni Çok Seviyorum ❤️
        </motion.h1>
        <motion.p
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.9, duration: 1 }}
        >
          Sevgililer Günün Kutlu Olsun Rabia'm.<br />
          Hayatımın en güzel hikayesi seninle yazılıyor.
        </motion.p>

        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', justifyContent: 'center', marginTop: '2rem' }}>
          <motion.button
            className="heart-button"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.2, duration: 0.8 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setSlideshowIndex(0)}
          >
            <Sparkles size={24} />
            Slayt Gösterisi
          </motion.button>

          <motion.button
            className="heart-button"
            style={{
              background: 'linear-gradient(135deg, #ffd700 0%, #ff4081 100%)'
            }}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.4, duration: 0.8 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={startCinemaMode}
          >
            <Film size={24} />
            🎬 Film Modu
          </motion.button>

          <motion.button
            className="heart-button"
            style={{
              background: 'linear-gradient(135deg, #FF1493 0%, #00D4FF 50%, #FFD700 100%)',
              boxShadow: '0 20px 60px rgba(255, 20, 147, 0.6), 0 0 40px rgba(0, 212, 255, 0.4)',
              border: '2px solid rgba(255, 215, 0, 0.8)',
              animation: 'cosmicPulse 2s ease-in-out infinite'
            }}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.6, duration: 0.8 }}
            whileHover={{
              scale: 1.1,
              boxShadow: '0 30px 80px rgba(255, 20, 147, 0.8), 0 0 60px rgba(0, 212, 255, 0.6), 0 0 80px rgba(255, 215, 0, 0.4)'
            }}
            whileTap={{ scale: 0.95 }}
            onClick={() => {
              setGalaxyMode(true);
              // Auto-start music
              if (audioRef.current && !musicPlaying) {
                audioRef.current.volume = 0.9;
                audioRef.current.play().then(() => setMusicPlaying(true)).catch(() => { });
              }
            }}
          >
            <Sparkle size={24} />
            🌌 GALAXY MODE
          </motion.button>
        </div>
      </section>

      {/* Message Section */}
      <section className="message-section">
        <motion.div
          className="glass-card"
          initial={{ opacity: 0, y: 80 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 1, type: "spring" }}
        >
          <p className="message-text">
            "Seninle geçen her saniye, kalbimde yeni bir çiçek açtırıyor.
            İyi ki varsın, iyi ki yanımdasın... Seni sonsuz seviyorum Rabia."
          </p>
        </motion.div>
      </section>

      {/* Photo Gallery */}
      <section className="gallery-section">
        <motion.div
          style={{ textAlign: 'center', padding: '2rem', marginBottom: '2rem' }}
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
        >
          <h2 style={{ fontSize: 'clamp(2.5rem, 6vw, 4rem)', color: '#ffd700', marginBottom: '1rem' }}>
            Bizim Hikayemiz ✨
          </h2>
          <p style={{ fontSize: '1.2rem', opacity: 0.8 }}>Her karede bir parça sevda... (Tıkla ve slayt modunda gör)</p>
        </motion.div>

        <div className="gallery-grid">
          {photos.map((photo, index) => (
            <motion.div
              key={photo.id}
              className="photo-card glass-card"
              initial={{ opacity: 0, y: 60, rotateX: -20 }}
              whileInView={{ opacity: 1, y: 0, rotateX: 0 }}
              transition={{
                delay: index * 0.15,
                duration: 0.8,
                type: "spring",
                stiffness: 100
              }}
              viewport={{ once: true }}
              whileHover={{
                scale: 1.03,
                zIndex: 10,
                boxShadow: '0 30px 80px rgba(255, 23, 68, 0.4)'
              }}
              onClick={() => setSlideshowIndex(index)}
              style={{ cursor: 'pointer' }}
            >
              <img src={photo.url} alt={photo.title} loading="lazy" />
              <div className="photo-overlay">
                <h3>{photo.title}</h3>
                <p>{photo.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Stats Section */}
      <section className="stats-section">
        <div className="stats-grid">
          <motion.div
            className="glass-card stat-card"
            initial={{ opacity: 0, scale: 0.8 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <Calendar size={50} color="#ffd700" />
            <h3>44 Gün</h3>
            <p>Birlikte geçen muhteşem zaman</p>
          </motion.div>
          <motion.div
            className="glass-card stat-card"
            initial={{ opacity: 0, scale: 0.8 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <MapPin size={50} color="#ff4081" />
            <h3>Sonsuz Anı</h3>
            <p>Birlikte geçtiğimiz unutulmaz yerler</p>
          </motion.div>
          <motion.div
            className="glass-card stat-card"
            initial={{ opacity: 0, scale: 0.8 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            <Music size={50} color="#ff1744" />
            <h3>Bizim Şarkımız</h3>
            <p>Sezen Aksu - Ey Aşk 🎵</p>
          </motion.div>
        </div>
      </section>

      <footer className="footer">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 0.7 }}
          viewport={{ once: true }}
        >
          <p>Sonsuza Dek Seninle... ❤️</p>
          <p style={{ marginTop: '1rem', fontSize: '1.2rem' }}>Seni Seviyorum Rabia 💖</p>
        </motion.div>
      </footer>
    </div>
  );
}

export default App;