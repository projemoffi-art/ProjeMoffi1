import { IVaccineService } from "../interfaces";
import { VaccineRuleset, UserVaccineRecord, VaccineDefinition } from "@/types/domain";

// --- SEED DATA: TR RULESET ---
const TR_VACCINES: VaccineDefinition[] = [
    { 
        id: 'mixed', 
        name: 'Karma Aşı (DHPPi)', 
        description: 'Distemper (Gençlik Hastalığı), Hepatit, Parvovirüs (Kanlı İshal) ve Parainfluenza virüslerine karşı hayati koruma sağlar. Özellikle Parvovirüs, yavru köpeklerde %90\'a varan ölüm oranına sahip olup sindirim sistemini ağır tahrip eder. Bu aşı, bağışıklık sistemini bu ölümcül viral ajanlara karşı eğiterek ömür boyu direnç oluşturulmasının temel taşıdır.', 
        isCore: true, 
        frequencyMonths: 12, 
        minAgeWeeks: 8, 
        tags: ['viral', 'core'] 
    },
    { 
        id: 'rabies', 
        name: 'Kuduz (Rabies)', 
        description: 'Tüm memelilerde merkezi sinir sistemine saldırarak felç ve ölüme yol açan, tedavisi olmayan zoonoz (hayvandan insana geçen) bir hastalıktır. Yasal bir zorunluluk olmasının ötesinde, hem evcil hayvanınızın hem de ailenizin can güvenliği için en kritik aşıdır. Yıllık tekrarlar, antikor seviyesinin yasal ve tıbbi koruma sınırında kalmasını sağlar.', 
        isCore: true, 
        frequencyMonths: 12, 
        minAgeWeeks: 12, 
        tags: ['zoonotic', 'legal', 'core'] 
    },
    { 
        id: 'kc', 
        name: 'Bronşin (Kennel Cough)', 
        description: 'Bordetella bronchiseptica bakterisi ve köpek influenza virüslerinin neden olduğu, köpekler arasında son derece bulaşıcı olan "Barınak Öksürüğü" enfeksiyonuna karşı korur. Özellikle sosyalleşen, pansiyona giden veya parklarda vakit geçiren köpeklerde havayoluyla hızla yayılır. Şiddetli öksürük krizlerini ve zatürre gibi ikincil komplikasyonları engeller.', 
        isCore: false, 
        frequencyMonths: 12, 
        minAgeWeeks: 8, 
        tags: ['bacterial', 'social'] 
    },
    { 
        id: 'internal', 
        name: 'İç Parazit', 
        description: 'Echinococcus granulosus (Kist Hidatik), kancalı kurtlar ve yuvarlak solucanlar gibi sindirim sistemi parazitlerini hedefler. Bu parazitler sadece evcil hayvanınızda iştahsızlık ve kilo kaybına neden olmakla kalmaz, aynı zamanda insanlar için ciddi karaciğer hastalıkları ve kist riski taşır. 3 aylık düzenli uygulama, biyolojik kalkan görevi görür.', 
        isCore: true, 
        frequencyMonths: 3, 
        minAgeWeeks: 4, 
        tags: ['parasite', 'public-health'] 
    },
    { 
        id: 'external', 
        name: 'Dış Parazit', 
        description: 'Kene, pire ve bitlere karşı hem koruyucu hem de tedavi edici etki gösterir. Dış parazitler sadece kaşıntı ve deri irritasyonu yapmaz; Lyme, Erlişiyoz ve Anaplazmoz gibi kan yoluyla bulaşan ağır hastalıkların taşıyıcısıdırlar. Düzenli uygulama, parazitlerin deriyle temas ettiği anda etkisiz hale gelmesini sağlayarak hastalık riskini minimize eder.', 
        isCore: true, 
        frequencyMonths: 2, 
        minAgeWeeks: 6, 
        tags: ['parasite', 'prevention'] 
    },
];

const RULES_TR: VaccineRuleset = {
    countryCode: 'TR',
    version: '2025.1',
    source: 'Veterinary Association of Turkey',
    lastUpdated: '2025-01-01',
    definitions: TR_VACCINES
};

// --- MOCK USER HISTORY (In-Memory DB) ---
let USER_RECORDS: UserVaccineRecord[] = [
    // Completed in the past
    { id: 'rec_1', petId: 'pet-1', vaccineId: 'mixed', dateAdministered: '2024-10-12', dueDate: '2025-10-12', status: 'completed', vetName: 'VetLife' },
    { id: 'rec_2', petId: 'pet-1', vaccineId: 'rabies', dateAdministered: '2024-11-15', dueDate: '2025-11-15', status: 'completed', vetName: 'Paws Center' },

    // Upcoming / Pending (Calculated based on rules usually, but pre-filled for mock)
    { id: 'rec_3', petId: 'pet-1', vaccineId: 'kc', dueDate: '2025-01-20', status: 'pending' },
    { id: 'rec_4', petId: 'pet-1', vaccineId: 'internal', dueDate: '2025-12-25', status: 'pending' } // Very soon
];

export class VaccineMockService implements IVaccineService {

    async getRuleset(countryCode: string): Promise<VaccineRuleset> {
        await this.delay();
        if (countryCode === 'TR') return RULES_TR;
        // Fallback or empty for others in MVP
        return { ...RULES_TR, countryCode };
    }

    async getUserSchedule(petId: string, countryCode: string): Promise<UserVaccineRecord[]> {
        await this.delay();
        // In a real app, logic would be:
        // 1. Get Rules
        // 2. Get Past History
        // 3. Calculate Next Dates based on Frequency
        // Here we just return the Mock DB which simulates this state
        return [...USER_RECORDS];
    }

    async markAsDone(recordId: string, date: string, vetName: string): Promise<void> {
        await this.delay();
        const record = USER_RECORDS.find(r => r.id === recordId);
        if (record) {
            record.status = 'completed';
            record.dateAdministered = date;
            record.vetName = vetName;

            // LOGIC: Create Next Due Record?
            // For mock, let's keep it simple.
        }
    }

    private delay() {
        return new Promise(resolve => setTimeout(resolve, 600));
    }
}
