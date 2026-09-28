// Veteriner rehberi (referans Ekran 14). Statik, genel bilgilendirme içeriği — tanı/tedavi önerisi değildir.
// Her makalenin sonunda sayfa ayrıca "veterinerin yerini tutmaz" uyarısı gösterir.

export interface GuideArticle {
    slug: string;
    title: string;
    summary: string;
    emoji: string;
    category: 'Acil durum' | 'Koruyucu bakım' | 'Ziyaret';
    readMinutes: number;
    sections: { heading: string; paragraphs?: string[]; bullets?: string[] }[];
}

export const VET_GUIDE: GuideArticle[] = [
    {
        slug: 'acil-belirtiler',
        title: 'Hemen veterinere gitmen gereken belirtiler',
        summary: 'Beklemeden bir kliniği araman gereken durumlar.',
        emoji: '🚨',
        category: 'Acil durum',
        readMinutes: 3,
        sections: [
            {
                heading: 'Beklemeden klinik ara',
                paragraphs: ['Aşağıdaki durumlardan biri varsa evde izlemek yerine hemen bir veteriner kliniğini ara ve yola çık:'],
                bullets: [
                    'Nefes almakta zorlanma, ağız açık nefes (kedilerde), morarmış dil veya diş eti',
                    'Durmayan kanama',
                    'Bayılma, nöbet ya da ayakta duramama',
                    'Şişmiş, gergin karın ve sonuçsuz kusma çabası (özellikle iri köpeklerde)',
                    'Zehirli bir madde yediğinden şüphelenme',
                    'Trafik kazası, yüksekten düşme veya başka bir hayvanın ısırması — dışarıdan iyi görünse bile',
                    'Erkek kedide idrar yapamama ya da sürekli kum kabına gidip gelme',
                    'Tekrarlayan kusma veya kanlı ishal',
                ],
            },
            {
                heading: 'Yola çıkmadan önce',
                bullets: [
                    'Kliniği arayıp geldiğini haber ver; ekip hazırlık yapabilir.',
                    'Hayvanını hareket ettirirken sabit tut; yaralıysa bir battaniye veya sert bir yüzey kullan.',
                    'Yediği şeyin ambalajını, ilacın kutusunu ya da kusmuğun fotoğrafını yanına al.',
                ],
            },
        ],
    },
    {
        slug: 'zehirlenme',
        title: 'Zehirlenme şüphesinde ilk adımlar',
        summary: 'Çikolata, ilaç, üzüm, zirai ilaç… ne yapmalı, ne yapmamalı.',
        emoji: '⚠️',
        category: 'Acil durum',
        readMinutes: 3,
        sections: [
            {
                heading: 'Hemen yapılacaklar',
                bullets: [
                    'Hayvanını maddeden uzaklaştır, kalanını topla.',
                    'Ne yediğini, yaklaşık ne kadar ve ne zaman yediğini not et.',
                    'Bir veteriner kliniğini ara ve talimat iste.',
                ],
            },
            {
                heading: 'Yapma',
                bullets: [
                    'Veteriner söylemeden kusturmaya çalışma. Bazı maddeler (çamaşır suyu, deterjan, yağ ürünleri, keskin cisimler) geri gelirken daha fazla zarar verir.',
                    'Süt, yağ ya da "evde panzehir" tariflerini deneme.',
                    'Belirti yok diye beklemeye geçme; bazı zehirlenmeler saatler sonra belirti verir.',
                ],
            },
            {
                heading: 'Evde sık rastlanan tehlikeler',
                bullets: [
                    'Çikolata, üzüm ve kuru üzüm, soğan ve sarımsak, ksilitollü sakız',
                    'İnsan ilaçları (özellikle ağrı kesiciler)',
                    'Zambak (kediler için çok tehlikelidir)',
                    'Fare ve böcek zehirleri, antifriz',
                ],
            },
        ],
    },
    {
        slug: 'sicak-carpmasi',
        title: 'Sıcak çarpması',
        summary: 'Yaz aylarında belirtileri tanı, doğru serinlet.',
        emoji: '☀️',
        category: 'Acil durum',
        readMinutes: 2,
        sections: [
            {
                heading: 'Belirtiler',
                bullets: ['Aşırı hızlı soluma ve salya', 'Halsizlik, sendeleme', 'Parlak kırmızı diş eti', 'Kusma veya ishal'],
            },
            {
                heading: 'Ne yapmalı',
                bullets: [
                    'Hemen gölgeye ya da serin bir ortama al.',
                    'Vücudunu serin (buz gibi değil) suyla ıslat, hava akımı sağla.',
                    'İçebiliyorsa az miktarda su ver; zorla içirme.',
                    'Toparlanmış görünse bile veterinere götür — iç organ etkilenmesi sonradan ortaya çıkabilir.',
                ],
            },
            {
                heading: 'Önlem',
                paragraphs: ['Sıcak günlerde yürüyüşleri sabah erken ya da akşam saatlerine al; hayvanını asla park etmiş bir araçta bırakma, kısa süreliğine bile.'],
            },
        ],
    },
    {
        slug: 'asi-takvimi',
        title: 'Aşılar neden zamanında yapılmalı?',
        summary: 'Temel aşılar, tekrar dozları ve takip.',
        emoji: '💉',
        category: 'Koruyucu bakım',
        readMinutes: 2,
        sections: [
            {
                heading: 'Genel bilgi',
                paragraphs: [
                    'Yavrularda bağışıklık birkaç haftada bir tekrarlanan dozlarla oluşur; yetişkinlerde ise belirli aralıklarla tekrar gerekir. Hangi aşının ne zaman yapılacağı yaşa, türe, yaşam koşullarına ve bölgeye göre değişir.',
                    'Kuduz aşısı Türkiye\'de kedi ve köpekler için zorunludur.',
                ],
            },
            {
                heading: 'Takibi kolaylaştır',
                bullets: [
                    'Aşı karnesini Moffi\'de tut; bir sonraki doz yaklaşınca hatırlatma alırsın.',
                    'Aşıdan sonraki bir iki gün hafif halsizlik görülebilir; yüzde şişme, kusma veya nefes darlığı olursa hemen kliniği ara.',
                    'Takvimi mutlaka kendi veterinerinle birlikte belirle.',
                ],
            },
        ],
    },
    {
        slug: 'dis-sagligi',
        title: 'Evde diş bakımı',
        summary: 'Ağız kokusu normal değildir — küçük alışkanlıklar büyük fark yaratır.',
        emoji: '🦷',
        category: 'Koruyucu bakım',
        readMinutes: 2,
        sections: [
            {
                heading: 'Neden önemli',
                paragraphs: ['Diş taşı ve diş eti iltihabı yetişkin kedi ve köpeklerde çok yaygındır; ağrıya ve iştahsızlığa yol açabilir.'],
            },
            {
                heading: 'Nasıl başlanır',
                bullets: [
                    'Hayvanlara özel diş macunu kullan; insan diş macunu uygun değildir.',
                    'Önce parmakla diş etine dokunmaya alıştır, sonra kısa sürelerle fırçaya geç.',
                    'Kötü koku, kanama, tek taraflı çiğneme ya da yemek düşürme fark edersen muayene randevusu al.',
                ],
            },
        ],
    },
    {
        slug: 'ziyarete-hazirlik',
        title: 'Veteriner ziyaretine hazırlık',
        summary: 'Randevudan en iyi şekilde yararlanmak için kısa bir kontrol listesi.',
        emoji: '📋',
        category: 'Ziyaret',
        readMinutes: 2,
        sections: [
            {
                heading: 'Yanına al',
                bullets: ['Aşı karnesi ve varsa önceki tahlil sonuçları', 'Kullandığı ilaçlar ve mama markası', 'Kedi için kapalı taşıma çantası, köpek için tasma'],
            },
            {
                heading: 'Not al',
                bullets: [
                    'Şikâyet ne zaman başladı, nasıl değişti?',
                    'İştah, su tüketimi, dışkı ve idrarda değişiklik var mı?',
                    'Sormak istediğin soruları önceden yaz.',
                ],
            },
            {
                heading: 'Stresi azalt',
                paragraphs: ['Kedini taşıma çantasına günler öncesinden alıştır; çantanın içine tanıdık kokulu bir örtü koy. Randevuya birkaç dakika erken git.'],
            },
        ],
    },
];

export function getGuideArticle(slug: string) {
    return VET_GUIDE.find(a => a.slug === slug) || null;
}
