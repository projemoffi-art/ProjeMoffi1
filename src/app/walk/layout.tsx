"use client";

import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";

// KÖK NEDEN DÜZELTMESİ ("panel komple kapanıyor, sonra tıklanan sekme açılıyor"):
// Önceden burada bir `template.tsx` vardı — sadece GİRİŞ animasyonu verebiliyordu,
// ÇIKIŞ animasyonu VEREMEZDİ, çünkü Next.js App Router her navigasyonda
// `template.tsx`'in örneğini komple yok edip yeniden yaratıyor (bu onun
// tanımlayıcı, `layout.tsx`'ten farkı olan davranışı). AnimatePresence'ın "önce
// çıkanı ekranda tutup çıkış animasyonunu oynat, sonra kaldır" yapabilmesi için
// KENDİSİNİN navigasyonlar arasında YOK OLMAYAN, kalıcı bir bileşen içinde
// olması gerekiyor — `template.tsx` bunu yapısal olarak sağlayamaz.
// `layout.tsx` ise (bu dosya) navigasyonlar arasında YOK OLMUYOR, bu yüzden
// içindeki AnimatePresence eskiyen sayfayı (çıkış animasyonu bitene kadar)
// ekranda tutabiliyor, yeni sayfa da aynı anda girişini oynatıyor — sert
// "kapan/aç" yerine gerçek, tek parça bir geçiş.
export default function WalkLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();

    return (
        <AnimatePresence mode="popLayout" initial={false}>
            <motion.div
                key={pathname}
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.26, ease: [0.22, 1, 0.36, 1] }}
            >
                {children}
            </motion.div>
        </AnimatePresence>
    );
}
