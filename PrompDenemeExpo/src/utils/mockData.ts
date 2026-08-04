export const mockStories = [
  { id: '1', name: 'Sen', avatar: 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?w=200&h=200&fit=crop', isMe: true },
  { id: '2', name: 'Elif', avatar: 'https://images.unsplash.com/photo-1517849845537-4d257902454a?w=200&h=200&fit=crop' },
  { id: '3', name: 'Can', avatar: 'https://images.unsplash.com/photo-1537151608804-ea2f1ea14a15?w=200&h=200&fit=crop' },
  { id: '4', name: 'Ayşe', avatar: 'https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?w=200&h=200&fit=crop' },
  { id: '5', name: 'Mert', avatar: 'https://images.unsplash.com/photo-1517423440428-a5a00ad493e8?w=200&h=200&fit=crop' },
];

export const mockPosts = [
  {
    id: 'p1',
    user: { name: 'Moffi Demo', username: 'moffi_demo', avatar: 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?w=200&h=200&fit=crop' },
    image: 'https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?w=800&h=800&fit=crop',
    likes: 124,
    caption: 'Sabah yürüyüşü harikaydı! 🐾 #moffi',
    commentsCount: 12,
    isLiked: false,
  },
  {
    id: 'p2',
    user: { name: 'Elif K.', username: 'elifk', avatar: 'https://images.unsplash.com/photo-1517849845537-4d257902454a?w=200&h=200&fit=crop' },
    image: 'https://images.unsplash.com/photo-1537151608804-ea2f1ea14a15?w=800&h=800&fit=crop',
    likes: 89,
    caption: 'Yeni Moffi sweatshirt çok yakıştı! 🧥',
    commentsCount: 5,
    isLiked: true,
  },
  {
    id: 'p3',
    user: { name: 'Can B.', username: 'canb', avatar: 'https://images.unsplash.com/photo-1517423440428-a5a00ad493e8?w=200&h=200&fit=crop' },
    image: 'https://images.unsplash.com/photo-1541364983171-a8ba01e95cfc?w=800&h=800&fit=crop',
    likes: 256,
    caption: 'Uyku vakti geldi... 💤',
    commentsCount: 24,
    isLiked: false,
  }
];

export const mockPets = [
  { id: '1', name: 'Max', breed: 'Golden Retriever', age: '3', avatar: 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?w=200&h=200&fit=crop' },
  { id: '2', name: 'Luna', breed: 'Scottish Fold', age: '1', avatar: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=200&h=200&fit=crop' }
];

export const mockVets = [
  { id: '1', name: 'Yeşil Pati', address: 'Kadıköy', rating: 4.8, reviews: 128, is24_7: true, image: 'https://images.unsplash.com/photo-1583337130417-3346a1be7dee?w=400&h=400&fit=crop', hours: '09:00 - 22:00' },
  { id: '2', name: 'Dost Veteriner', address: 'Beşiktaş', rating: 4.6, reviews: 95, is24_7: false, image: 'https://images.unsplash.com/photo-1628009368231-7bb7cbcb8122?w=400&h=400&fit=crop', hours: '09:00 - 20:00' },
  { id: '3', name: 'Ada Hayvan Hastanesi', address: 'Beyoğlu', rating: 4.9, reviews: 210, is24_7: true, image: 'https://images.unsplash.com/photo-1537151608804-ea2f1ea14a15?w=400&h=400&fit=crop', hours: '09:00 - 18:00' }
];

export const mockProducts = [
  { id: '1', name: 'Moffi Yeşil Sweatshirt', color: 'Yeşil', price: 349, image: 'https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?w=400&h=400&fit=crop', category: 'Sweatshirt' },
  { id: '2', name: 'Klasik Tişört', color: 'Beyaz', price: 199, image: 'https://images.unsplash.com/photo-1537151608804-ea2f1ea14a15?w=400&h=400&fit=crop', category: 'Tişört' },
  { id: '3', name: 'Sarı Yağmurluk', color: 'Sarı', price: 449, image: 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?w=400&h=400&fit=crop', category: 'Yağmurluk' },
  { id: '4', name: 'Desenli Bandana', color: 'Kırmızı', price: 89, image: 'https://images.unsplash.com/photo-1517849845537-4d257902454a?w=400&h=400&fit=crop', category: 'Bandana' },
  { id: '5', name: 'Deri Tasma', color: 'Kahverengi', price: 259, image: 'https://images.unsplash.com/photo-1517423440428-a5a00ad493e8?w=400&h=400&fit=crop', category: 'Tasma' },
  { id: '6', name: 'Tüy Fırçası', color: 'Mavi', price: 149, image: 'https://images.unsplash.com/photo-1541364983171-a8ba01e95cfc?w=400&h=400&fit=crop', category: 'Aksesuar' }
];

export const mockCategories = ['Tümü', 'Sweatshirt', 'Tişört', 'Yağmurluk', 'Bandana', 'Tasma', 'Aksesuar'];
