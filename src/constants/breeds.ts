// Irk listeleri (ilk kurulum ve pasaport). Türkiye'de en sık görülenler; listede olmayan ırk serbest metinle yazılır.
// "Melez / Bilmiyorum" her listenin başındadır: ırkı bilinmeyen hayvan kaydı bloklanmaz.

export const UNKNOWN_BREED = 'Melez / Bilmiyorum';

const DOG = [
    'Golden Retriever', 'Labrador Retriever', 'Kangal', 'Akbaş', 'Alman Çoban Köpeği', 'Pug', 'Cavalier King Charles Spaniel',
    'Chihuahua', 'Pomeranian (Spitz)', 'Yorkshire Terrier', 'Maltese Terrier', 'Shih Tzu', 'Fransız Bulldog', 'İngiliz Bulldog',
    'Boxer', 'Rottweiler', 'Doberman', 'Husky (Sibirya)', 'Alaskan Malamute', 'Border Collie', 'Cocker Spaniel', 'Beagle',
    'Dachshund (Sosis)', 'Jack Russell Terrier', 'Pitbull Terrier', 'Staffordshire Terrier', 'Bichon Frise', 'Samoyed',
    'Saint Bernard', 'Great Dane', 'Akita Inu', 'Shiba Inu', 'Belçika Malinois', 'Doberman Pinscher', 'Poodle (Kaniş)',
    'West Highland Terrier', 'Pekingese', 'Basset Hound', 'Australian Shepherd', 'Çoban Köpeği (Anadolu)', 'Sokak köpeği',
];

const CAT = [
    'Tekir (Sokak Kedisi)', 'British Shorthair', 'Scottish Fold', 'Van Kedisi', 'Ankara Kedisi', 'Persian (İran Kedisi)',
    'Siyam (Siamese)', 'Maine Coon', 'Ragdoll', 'Bengal', 'Sphynx', 'Rus Mavisi', 'Norwegian Forest', 'Birman', 'Abyssinian',
    'Exotic Shorthair', 'Devon Rex', 'Burmese', 'Himalayan', 'Munchkin', 'Amerikan Shorthair', 'Oriental Shorthair',
];

const BIRD = ['Muhabbet Kuşu', 'Kanarya', 'Sultan Papağanı', 'Cennet Papağanı', 'Jako (Gri Papağan)', 'Forpus', 'İspinoz', 'Bülbül', 'Diğer kuş'];
const RABBIT = ['Hollanda Lop', 'Mini Lop', 'Cüce Tavşan', 'Angora', 'Rex', 'Ankara Tavşanı', 'Diğer tavşan'];
const SMALL = ['Hamster (Suriye)', 'Hamster (Cüce)', 'Kobay (Gine Domuzu)', 'Gerbil', 'Sincap', 'Chinchilla', 'Diğer küçük memeli'];

const LISTS: Record<string, string[]> = {
    dog: DOG,
    cat: CAT,
    bird: BIRD,
    rabbit: RABBIT,
    small_mammal: SMALL,
    other: [],
};

export function breedsFor(type: string | null | undefined): string[] {
    const list = LISTS[type || ''] ?? [];
    return [UNKNOWN_BREED, ...[...list].sort((a, b) => a.localeCompare(b, 'tr'))];
}
