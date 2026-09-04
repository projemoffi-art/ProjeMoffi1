export interface PetTypeConfig {
    key: string;
    label: string;
    emoji: string;
}

export const PET_TYPES: PetTypeConfig[] = [
    { key: 'dog', label: 'Köpek', emoji: '🐶' },
    { key: 'cat', label: 'Kedi', emoji: '🐱' },
    { key: 'bird', label: 'Kuş', emoji: '🦜' },
    { key: 'rabbit', label: 'Tavşan', emoji: '🐰' },
    { key: 'small_mammal', label: 'Küçük Memeli', emoji: '🐹' },
    { key: 'other', label: 'Diğer', emoji: '🐾' }
];

export const getPetTypeConfig = (key: string): PetTypeConfig | undefined => {
    return PET_TYPES.find(pt => pt.key === key);
};
