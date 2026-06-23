
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
        lat: 40.9855,
        lng: 29.0310,
        user: '@Baran',
        timestamp: '10 dk önce',
        likes: 5
    },
    {
        id: '2',
        type: 'warning',
        emoji: '⚠️',
        message: 'Kırık camlar var, patiye dikkat.',
        lat: 40.9860,
        lng: 29.0295,
        user: '@Selin',
        timestamp: '1 saat önce',
        likes: 12
    },
    {
        id: '3',
        type: 'social',
        emoji: '🐕',
        message: 'Max ile parktayız, bekleriz!',
        lat: 40.9848,
        lng: 29.0300,
        user: '@Can',
        timestamp: 'Şimdi',
        likes: 3
    },
    {
        id: '4',
        type: 'love',
        emoji: '❤️',
        message: 'Moffi burayı çok sevdi.',
        lat: 40.9851,
        lng: 29.0315,
        user: '@Zeynep',
        timestamp: '2 gün önce',
        likes: 8
    }
];
