// Evcil hayvan kimlik alanlarının gösterimi (Pet Pasaportu, paylaşılan pasaport, künye).
import { getPetTypeConfig } from '@/constants/petTypes';

export function genderMark(g?: string | null): string {
    const s = String(g || '').toLocaleLowerCase('tr-TR');
    if (s.startsWith('di') || s.startsWith('f') || s === 'kız') return '♀';
    if (s.startsWith('er') || s.startsWith('m')) return '♂';
    return '';
}

export function genderLabel(g?: string | null): string | null {
    const m = genderMark(g);
    if (m === '♀') return 'Dişi';
    if (m === '♂') return 'Erkek';
    return g?.trim() || null;
}

export function speciesLabel(type?: string | null): string | null {
    const s = String(type || '').toLocaleLowerCase('tr-TR');
    if (s === 'dog' || s === 'köpek' || s === '🐶') return 'Köpek';
    if (s === 'cat' || s === 'kedi' || s === '🐱') return 'Kedi';
    if (s === 'other' || s === 'diğer') return 'Diğer';
    const configured = getPetTypeConfig(s);
    if (configured) return configured.label;
    return type?.trim() || null;
}

export const SPECIES_OPTIONS = [
    { value: 'dog', label: 'Köpek' },
    { value: 'cat', label: 'Kedi' },
    { value: 'other', label: 'Diğer' },
];

export const GENDER_OPTIONS = [
    { value: 'Dişi', label: 'Dişi' },
    { value: 'Erkek', label: 'Erkek' },
];
