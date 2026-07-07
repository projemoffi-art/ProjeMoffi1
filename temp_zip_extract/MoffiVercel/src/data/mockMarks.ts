
export interface MapMark {
    id: string;
    type: 'info' | 'warning' | 'social' | 'love';
    emoji: string;
    message: string;
    lat: number;
    lng: number;
    user: string;
    timestamp: string;
    likes: number;
}

export const MOCK_MARKS: MapMark[] = [
    {
        id: '1',
        type: 'info',
        emoji: '💧',
        message: 'Burada temiz su kabı var!',
        lat: 41.0085,
        lng: 28.9790,
        user: '@Baran',
        timestamp: '10 dk önce',
        likes: 5
    },
    {
        id: '2',
        type: 'warning',
        emoji: '⚠️',
        message: 'Kırık camlar var, patiye dikkat.',
        lat: 41.0090,
        lng: 28.9775,
        user: '@Selin',
        timestamp: '1 saat önce',
        likes: 12
    },
    {
        id: '3',
        type: 'social',
        emoji: '🐕',
        message: 'Max ile parktayız, bekleriz!',
        lat: 41.0078,
        lng: 28.9780,
        user: '@Can',
        timestamp: 'Şimdi',
        likes: 3
    },
    {
        id: '4',
        type: 'love',
        emoji: '❤️',
        message: 'Moffi burayı çok sevdi.',
        lat: 41.0081,
        lng: 28.9795,
        user: '@Zeynep',
        timestamp: '2 gün önce',
        likes: 8
    }
];
