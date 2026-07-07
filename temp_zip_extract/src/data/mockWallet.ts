
export interface Transaction {
    id: string;
    title: string;
    category: 'food' | 'health' | 'toy' | 'other';
    amount: number;
    date: string;
    merchant: string;
    icon: string;
}

export interface CoinTransaction {
    id: string;
    title: string;
    amount: number;
    type: 'earn' | 'spend';
    date: string;
    source: string;
}

export const COIN_STATS = {
    balance: 2450,
    totalEarned: 5200,
    totalSpent: 2750,
    thisMonthEarned: 450,
    thisMonthSpent: 150
};

export const COIN_HISTORY: CoinTransaction[] = [
    { id: 'c1', title: 'Yürüyüş Ödülü', amount: 50, type: 'earn', date: 'Bugün', source: 'Moffi Walk' },
    { id: 'c2', title: 'Market İndirimi', amount: 150, type: 'spend', date: 'Dün', source: 'Moffi Shop' },
    { id: 'c3', title: 'Haftalık Görev', amount: 200, type: 'earn', date: '10 Ara', source: 'Görevler' },
    { id: 'c4', title: 'Avatar Kıyafeti', amount: 300, type: 'spend', date: '08 Ara', source: 'Moffi Studio' },
    { id: 'c5', title: 'Arkadaş Daveti', amount: 500, type: 'earn', date: '05 Ara', source: 'Referans' },
];

export const MOCK_TRANSACTIONS: Transaction[] = [
    { id: '1', title: 'Royal Canin Mama', category: 'food', amount: 850, date: '2023-10-25', merchant: 'Moffi Shop', icon: '🥩' },
    { id: '2', title: 'Yıllık Aşı', category: 'health', amount: 1200, date: '2023-10-20', merchant: 'Vet Point', icon: '💉' },
    { id: '3', title: 'Gıcırtılı Ördek', category: 'toy', amount: 150, date: '2023-10-18', merchant: 'Amazon', icon: '🦆' },
    { id: '4', title: 'Ödül Maması', category: 'food', amount: 200, date: '2023-10-15', merchant: 'Petgross', icon: '🦴' },
    { id: '5', title: 'Tasma', category: 'other', amount: 450, date: '2023-10-10', merchant: 'Moffi Shop', icon: '🦮' },
];

export const BUDGET_STATUS = {
    totalBudget: 3000,
    spent: 2850,
    categories: {
        food: { limit: 1000, spent: 1050, name: 'Beslenme' },
        health: { limit: 1500, spent: 1200, name: 'Sağlık' },
        toy: { limit: 500, spent: 600, name: 'Eğlence' }
    }
};
