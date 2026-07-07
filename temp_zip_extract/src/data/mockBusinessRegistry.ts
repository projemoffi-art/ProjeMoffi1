import { BusinessApplication, BusinessProduct, BusinessOrder, BusinessAppointment, BusinessCampaign, FinanceTransaction, ModerationReport } from "@/types/business";

// ============================
// SAMPLE BUSINESSES
// ============================
export const MOCK_APPLICATIONS: BusinessApplication[] = [
    {
        id: 'biz_paws1', userId: 'bu_paws1', businessName: 'Paws & Claws Pet Shop',
        businessType: 'petshop', ownerName: 'Elif Yıldız', email: 'elif@pawsclaws.com',
        phone: '0532 111 2233', address: 'Kadıköy, Moda Cad. No:45, İstanbul',
        taxId: '1234567890', iban: 'TR12 0001 0012 3456 7890 1234 56',
        status: 'approved', appliedAt: '2025-11-10T08:00:00Z', reviewedAt: '2025-11-12T14:00:00Z', reviewNote: 'Belgeler doğrulandı.'
    },
    {
        id: 'biz_vet1', userId: 'bu_vet1', businessName: 'Dr. Ayşe Veteriner Kliniği',
        businessType: 'vet', ownerName: 'Dr. Ayşe Kaya', email: 'ayse@vetklinik.com',
        phone: '0533 222 3344', address: 'Beşiktaş, Barbaros Blv. No:12, İstanbul',
        taxId: '9876543210', iban: 'TR98 0002 0034 5678 9012 3456 78',
        status: 'approved', appliedAt: '2025-10-20T10:00:00Z', reviewedAt: '2025-10-22T09:00:00Z', reviewNote: 'Klinik ruhsatı onaylandı.'
    },
    {
        id: 'biz_pet2', userId: 'bu_pet2', businessName: 'Happy Tails Evcil Hayvan',
        businessType: 'petshop', ownerName: 'Mehmet Acar', email: 'mehmet@happytails.com',
        phone: '0534 333 4455', address: 'Üsküdar, Çamlıca Cad. No:78, İstanbul',
        taxId: '5678901234', iban: 'TR56 0003 0056 7890 1234 5678 90',
        status: 'approved', appliedAt: '2025-12-01T12:00:00Z', reviewedAt: '2025-12-03T16:00:00Z', reviewNote: null
    },
    {
        id: 'biz_groom1', userId: 'bu_groom1', businessName: 'Fluffy Kuaför',
        businessType: 'grooming', ownerName: 'Selin Doğan', email: 'selin@fluffy.com',
        phone: '0535 444 5566', address: 'Nişantaşı, Abdi İpekçi Cad. No:33, İstanbul',
        taxId: '3456789012', iban: 'TR34 0004 0078 9012 3456 7890 12',
        status: 'pending', appliedAt: '2026-02-20T09:00:00Z', reviewedAt: null, reviewNote: null
    },
    {
        id: 'biz_vet2', userId: 'bu_vet2', businessName: 'PetCare 7/24 Acil Vet',
        businessType: 'vet', ownerName: 'Dr. Can Özdemir', email: 'can@petcare724.com',
        phone: '0536 555 6677', address: 'Ataşehir, Atatürk Mah. No:56, İstanbul',
        taxId: '7890123456', iban: 'TR78 0005 0090 1234 5678 9012 34',
        status: 'pending', appliedAt: '2026-02-22T14:30:00Z', reviewedAt: null, reviewNote: null
    },
];

// ============================
// PRODUCTS
// ============================
export const MOCK_PRODUCTS: BusinessProduct[] = [
    // Paws & Claws
    { id: 'p1', businessId: 'biz_paws1', name: 'Royal Canin Adult Kedi Maması', description: 'Yetişkin kediler için tam ve dengeli beslenme. 4kg paket.', category: 'food', price: 389, originalPrice: 449, stock: 45, status: 'active', images: ['https://images.unsplash.com/photo-1589924691995-400dc9ecc119?w=300'], createdAt: '2025-12-01T10:00:00Z', updatedAt: '2026-02-20T08:00:00Z' },
    { id: 'p2', businessId: 'biz_paws1', name: 'Kong Classic Oyuncak (L)', description: 'Dayanıklı kauçuk oyuncak, içine ödül konulabilir.', category: 'toy', price: 199, stock: 23, status: 'active', images: ['https://images.unsplash.com/photo-1535930749574-1399327ce78f?w=300'], createdAt: '2025-12-05T14:00:00Z', updatedAt: '2026-01-15T10:00:00Z' },
    { id: 'p3', businessId: 'biz_paws1', name: 'Ferplast Köpek Tasması (M)', description: 'Ayarlanabilir naylon tasma, reflektif şerit.', category: 'accessory', price: 129, stock: 67, status: 'active', images: ['https://images.unsplash.com/photo-1601758228041-f3b2795255f1?w=300'], createdAt: '2025-12-10T09:00:00Z', updatedAt: '2026-02-01T12:00:00Z' },
    { id: 'p4', businessId: 'biz_paws1', name: 'Frontline Plus Kene İlacı', description: '3 doz, 10-20kg köpekler için. Aylık uygulama.', category: 'health', price: 459, stock: 12, status: 'active', images: ['https://images.unsplash.com/photo-1628009368231-7bb7cfcb0def?w=300'], createdAt: '2026-01-01T08:00:00Z', updatedAt: '2026-02-18T16:00:00Z' },
    { id: 'p5', businessId: 'biz_paws1', name: 'Kedi Yatağı Pelüş (Yuvarlak)', description: 'Yumuşak peluş, 50cm çap, yıkanabilir.', category: 'bed', price: 279, originalPrice: 349, stock: 0, status: 'out_of_stock', images: ['https://images.unsplash.com/photo-1545249390-6bdfa286032f?w=300'], createdAt: '2026-01-10T11:00:00Z', updatedAt: '2026-02-21T09:00:00Z' },
    { id: 'p6', businessId: 'biz_paws1', name: 'Köpek Yağmurluk (XL)', description: 'Su geçirmez, reflektif, kapüşonlu.', category: 'clothing', price: 189, stock: 34, status: 'active', images: ['https://images.unsplash.com/photo-1583337130417-13104dec14a4?w=300'], createdAt: '2026-01-15T13:00:00Z', updatedAt: '2026-02-10T08:00:00Z' },
    { id: 'p7', businessId: 'biz_paws1', name: 'Pro Plan Puppy Yavru Maması', description: 'Yavru köpekler için, tavuklu, 3kg.', category: 'food', price: 329, stock: 56, status: 'active', images: ['https://images.unsplash.com/photo-1568640347023-a616a30bc3bd?w=300'], createdAt: '2026-01-20T10:00:00Z', updatedAt: '2026-02-15T14:00:00Z' },
    { id: 'p8', businessId: 'biz_paws1', name: 'Chuckit Ultra Ball (2\'li)', description: 'Ultra dayanıklı top, yüzer, parlak turuncu.', category: 'toy', price: 149, stock: 89, status: 'active', images: ['https://images.unsplash.com/photo-1601758124510-52d02ddb7cbd?w=300'], createdAt: '2026-02-01T09:00:00Z', updatedAt: '2026-02-20T11:00:00Z' },
    // Happy Tails
    { id: 'p9', businessId: 'biz_pet2', name: 'Whiskas Kedi Maması (Balık)', description: 'Yetişkin kediler için balıklı mama, 3kg.', category: 'food', price: 249, stock: 78, status: 'active', images: ['https://images.unsplash.com/photo-1574158622682-e40e69881006?w=300'], createdAt: '2026-01-05T10:00:00Z', updatedAt: '2026-02-18T12:00:00Z' },
    { id: 'p10', businessId: 'biz_pet2', name: 'Kedi Tırmalama Tahtası', description: 'Karton tırmalama, catnip hediyeli.', category: 'toy', price: 89, stock: 120, status: 'active', images: ['https://images.unsplash.com/photo-1573865526739-10659fec78a5?w=300'], createdAt: '2026-01-12T14:00:00Z', updatedAt: '2026-02-10T09:00:00Z' },
    { id: 'p11', businessId: 'biz_pet2', name: 'Köpek Mama Kabı (Çelik)', description: 'Paslanmaz çelik, kaymaz taban, 1.5L.', category: 'accessory', price: 119, stock: 45, status: 'active', images: ['https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=300'], createdAt: '2026-01-18T08:00:00Z', updatedAt: '2026-02-05T16:00:00Z' },
    { id: 'p12', businessId: 'biz_pet2', name: 'Kuş Yemi Karışık (500g)', description: 'Muhabbet kuşu için vitamin katkılı karışık yem.', category: 'food', price: 49, stock: 200, status: 'active', images: ['https://images.unsplash.com/photo-1522926193341-e9ffd686c60f?w=300'], createdAt: '2026-02-01T10:00:00Z', updatedAt: '2026-02-19T11:00:00Z' },
];

// ============================
// ORDERS
// ============================
export const MOCK_ORDERS: BusinessOrder[] = [
    { id: 'ord_1', businessId: 'biz_paws1', customerId: 'u1', customerName: 'Ahmet Yılmaz', customerEmail: 'ahmet@mail.com', items: [{ productId: 'p1', productName: 'Royal Canin Adult Kedi Maması', quantity: 2, price: 389 }, { productId: 'p3', productName: 'Ferplast Köpek Tasması (M)', quantity: 1, price: 129 }], totalAmount: 907, commission: 90.70, netAmount: 816.30, status: 'delivered', shippingAddress: 'Kadıköy, İstanbul', trackingNumber: 'TR123456789', orderedAt: '2026-02-18T10:30:00Z', updatedAt: '2026-02-20T14:00:00Z' },
    { id: 'ord_2', businessId: 'biz_paws1', customerId: 'u2', customerName: 'Zeynep Kara', customerEmail: 'zeynep@mail.com', items: [{ productId: 'p4', productName: 'Frontline Plus Kene İlacı', quantity: 1, price: 459 }], totalAmount: 459, commission: 45.90, netAmount: 413.10, status: 'shipped', shippingAddress: 'Beşiktaş, İstanbul', trackingNumber: 'TR987654321', orderedAt: '2026-02-20T08:15:00Z', updatedAt: '2026-02-21T09:00:00Z' },
    { id: 'ord_3', businessId: 'biz_paws1', customerId: 'u3', customerName: 'Emre Demir', customerEmail: 'emre@mail.com', items: [{ productId: 'p2', productName: 'Kong Classic Oyuncak (L)', quantity: 1, price: 199 }, { productId: 'p8', productName: 'Chuckit Ultra Ball (2\'li)', quantity: 2, price: 149 }], totalAmount: 497, commission: 49.70, netAmount: 447.30, status: 'preparing', shippingAddress: 'Maltepe, İstanbul', orderedAt: '2026-02-22T15:45:00Z', updatedAt: '2026-02-22T15:45:00Z' },
    { id: 'ord_4', businessId: 'biz_paws1', customerId: 'u4', customerName: 'Sude Aksoy', customerEmail: 'sude@mail.com', items: [{ productId: 'p6', productName: 'Köpek Yağmurluk (XL)', quantity: 1, price: 189 }], totalAmount: 189, commission: 18.90, netAmount: 170.10, status: 'pending', shippingAddress: 'Üsküdar, İstanbul', orderedAt: '2026-02-23T00:10:00Z', updatedAt: '2026-02-23T00:10:00Z' },
    { id: 'ord_5', businessId: 'biz_paws1', customerId: 'u5', customerName: 'Büşra Tekin', customerEmail: 'busra@mail.com', items: [{ productId: 'p7', productName: 'Pro Plan Puppy Yavru Maması', quantity: 3, price: 329 }], totalAmount: 987, commission: 98.70, netAmount: 888.30, status: 'cancelled', shippingAddress: 'Ataşehir, İstanbul', notes: 'Müşteri iptal etti', orderedAt: '2026-02-19T12:00:00Z', updatedAt: '2026-02-19T18:00:00Z' },
    { id: 'ord_6', businessId: 'biz_pet2', customerId: 'u6', customerName: 'Ali Güneş', customerEmail: 'ali@mail.com', items: [{ productId: 'p9', productName: 'Whiskas Kedi Maması (Balık)', quantity: 2, price: 249 }, { productId: 'p10', productName: 'Kedi Tırmalama Tahtası', quantity: 1, price: 89 }], totalAmount: 587, commission: 58.70, netAmount: 528.30, status: 'delivered', shippingAddress: 'Bakırköy, İstanbul', trackingNumber: 'TR111222333', orderedAt: '2026-02-15T09:00:00Z', updatedAt: '2026-02-18T16:00:00Z' },
    { id: 'ord_7', businessId: 'biz_pet2', customerId: 'u7', customerName: 'Cansu Yıldırım', customerEmail: 'cansu@mail.com', items: [{ productId: 'p11', productName: 'Köpek Mama Kabı (Çelik)', quantity: 2, price: 119 }], totalAmount: 238, commission: 23.80, netAmount: 214.20, status: 'pending', shippingAddress: 'Şişli, İstanbul', orderedAt: '2026-02-22T20:00:00Z', updatedAt: '2026-02-22T20:00:00Z' },
];

// ============================
// APPOINTMENTS
// ============================
export const MOCK_APPOINTMENTS: BusinessAppointment[] = [
    { id: 'apt_1', businessId: 'biz_vet1', petName: 'Luna', petType: 'Kedi', ownerName: 'Aylin Şahin', ownerPhone: '0532 100 2000', service: 'Genel Kontrol', date: '2026-02-23', time: '09:30', status: 'confirmed', price: 350, image: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=100', createdAt: '2026-02-20T10:00:00Z' },
    { id: 'apt_2', businessId: 'biz_vet1', petName: 'Max', petType: 'Köpek', ownerName: 'Serkan Yılmaz', ownerPhone: '0533 200 3000', service: 'Aşı (Kuduz)', date: '2026-02-23', time: '10:30', status: 'confirmed', price: 250, image: 'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=100', createdAt: '2026-02-19T08:00:00Z' },
    { id: 'apt_3', businessId: 'biz_vet1', petName: 'Boncuk', petType: 'Kedi', ownerName: 'Deniz Aktaş', ownerPhone: '0534 300 4000', service: 'Diş Temizliği', date: '2026-02-23', time: '14:00', status: 'pending', price: 500, image: 'https://images.unsplash.com/photo-1573865526739-10659fec78a5?w=100', createdAt: '2026-02-22T16:00:00Z' },
    { id: 'apt_4', businessId: 'biz_vet1', petName: 'Charlie', petType: 'Köpek', ownerName: 'Elif Aydın', ownerPhone: '0535 400 5000', service: 'Kısırlaştırma', date: '2026-02-24', time: '09:00', status: 'confirmed', price: 1500, image: 'https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?w=100', createdAt: '2026-02-18T13:00:00Z' },
    { id: 'apt_5', businessId: 'biz_vet1', petName: 'Pamuk', petType: 'Tavşan', ownerName: 'Mert Çelik', ownerPhone: '0536 500 6000', service: 'Genel Kontrol', date: '2026-02-24', time: '11:00', status: 'pending', price: 300, createdAt: '2026-02-22T20:00:00Z' },
    { id: 'apt_6', businessId: 'biz_vet1', petName: 'Karamel', petType: 'Köpek', ownerName: 'Seda Koç', ownerPhone: '0537 600 7000', service: 'Röntgen + Muayene', date: '2026-02-22', time: '15:00', status: 'completed', price: 800, notes: 'Sol ön bacakta hafif çatlak. 2 hafta istirahat.', image: 'https://images.unsplash.com/photo-1596492784531-6e6eb5ea9993?w=100', createdAt: '2026-02-21T09:00:00Z' },
];

// ============================
// CAMPAIGNS
// ============================
export const MOCK_CAMPAIGNS: BusinessCampaign[] = [
    { id: 'cmp_1', businessId: 'biz_paws1', title: 'Kış İndirimi', description: 'Tüm mama ürünlerinde %15 indirim', discountPercent: 15, code: 'KIS15', startDate: '2026-02-01', endDate: '2026-02-28', status: 'active', usageCount: 34, maxUsage: 100, createdAt: '2026-01-28T10:00:00Z' },
    { id: 'cmp_2', businessId: 'biz_paws1', title: 'Hoş Geldin Kuponu', description: 'İlk alışverişe özel ₺50 indirim', discountPercent: 0, code: 'MERHABA50', startDate: '2026-01-01', endDate: '2026-12-31', status: 'active', usageCount: 128, createdAt: '2026-01-01T00:00:00Z' },
    { id: 'cmp_3', businessId: 'biz_vet1', title: 'Aşı Haftası', description: 'Tüm aşılarda %20 indirim', discountPercent: 20, startDate: '2026-03-01', endDate: '2026-03-07', status: 'scheduled', usageCount: 0, maxUsage: 50, createdAt: '2026-02-20T14:00:00Z' },
    { id: 'cmp_4', businessId: 'biz_pet2', title: 'Flash Sale', description: '2 saat sınırlı: Tüm oyuncaklarda %30', discountPercent: 30, startDate: '2026-02-20', endDate: '2026-02-20', status: 'ended', usageCount: 67, createdAt: '2026-02-20T10:00:00Z' },
];

// ============================
// FINANCE TRANSACTIONS
// ============================
export const MOCK_TRANSACTIONS: FinanceTransaction[] = [
    { id: 'tx_1', businessId: 'biz_paws1', type: 'sale', amount: 907, description: 'Sipariş #ord_1 satışı', relatedOrderId: 'ord_1', date: '2026-02-18T10:30:00Z', status: 'completed' },
    { id: 'tx_2', businessId: 'biz_paws1', type: 'commission', amount: -90.70, description: 'Sipariş #ord_1 komisyon (%10)', relatedOrderId: 'ord_1', date: '2026-02-18T10:30:00Z', status: 'completed' },
    { id: 'tx_3', businessId: 'biz_paws1', type: 'sale', amount: 459, description: 'Sipariş #ord_2 satışı', relatedOrderId: 'ord_2', date: '2026-02-20T08:15:00Z', status: 'completed' },
    { id: 'tx_4', businessId: 'biz_paws1', type: 'commission', amount: -45.90, description: 'Sipariş #ord_2 komisyon (%10)', relatedOrderId: 'ord_2', date: '2026-02-20T08:15:00Z', status: 'completed' },
    { id: 'tx_5', businessId: 'biz_paws1', type: 'sale', amount: 497, description: 'Sipariş #ord_3 satışı', relatedOrderId: 'ord_3', date: '2026-02-22T15:45:00Z', status: 'pending' },
    { id: 'tx_6', businessId: 'biz_paws1', type: 'payout', amount: -1500, description: 'Şubat 1. dönem ödeme', date: '2026-02-15T12:00:00Z', status: 'completed' },
    { id: 'tx_7', businessId: 'biz_paws1', type: 'sale', amount: 189, description: 'Sipariş #ord_4 satışı', relatedOrderId: 'ord_4', date: '2026-02-23T00:10:00Z', status: 'pending' },
    { id: 'tx_8', businessId: 'biz_paws1', type: 'refund', amount: -987, description: 'Sipariş #ord_5 iade', relatedOrderId: 'ord_5', date: '2026-02-19T18:00:00Z', status: 'completed' },
    { id: 'tx_9', businessId: 'biz_pet2', type: 'sale', amount: 587, description: 'Sipariş #ord_6 satışı', relatedOrderId: 'ord_6', date: '2026-02-15T09:00:00Z', status: 'completed' },
    { id: 'tx_10', businessId: 'biz_pet2', type: 'commission', amount: -58.70, description: 'Sipariş #ord_6 komisyon (%10)', relatedOrderId: 'ord_6', date: '2026-02-15T09:00:00Z', status: 'completed' },
];

// ============================
// MODERATION REPORTS
// ============================
export const MOCK_REPORTS: ModerationReport[] = [
    { id: 'rep_1', type: 'product', targetId: 'p5', targetTitle: 'Kedi Yatağı Pelüş', reportedBy: 'Ahmet Y.', reason: 'Sahte ürün görseli kullanılmış', status: 'pending', createdAt: '2026-02-22T10:00:00Z' },
    { id: 'rep_2', type: 'review', targetId: 'rev_3', targetTitle: 'Royal Canin yorumu', reportedBy: 'Mehmet A.', reason: 'Hakaret içeriyor', status: 'pending', createdAt: '2026-02-21T14:00:00Z' },
    { id: 'rep_3', type: 'social_post', targetId: 'sp_12', targetTitle: 'PetLovers gönderisi', reportedBy: 'Sistem', reason: 'Spam içerik tespit edildi', status: 'resolved', createdAt: '2026-02-20T08:00:00Z', resolvedAt: '2026-02-20T10:00:00Z', resolution: 'İçerik kaldırıldı, kullanıcıya uyarı gönderildi' },
    { id: 'rep_4', type: 'business', targetId: 'biz_groom1', targetTitle: 'Fluffy Kuaför', reportedBy: 'Zeynep K.', reason: 'İşletme bilgileri yanlış', status: 'pending', createdAt: '2026-02-22T16:00:00Z' },
];
