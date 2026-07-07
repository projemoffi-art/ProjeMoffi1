import { IFamilyService, FamilyEvent } from "../interfaces";
import { FamilyMember, FamilyLog } from "@/types/domain";

// Mock Data
const INITIAL_MEMBERS: FamilyMember[] = [
    { id: 'u1', name: 'Sen', avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=100', role: 'Owner', status: 'online', statusText: 'Çevrimiçi' },
    { id: 'u2', name: 'Annem', avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?q=80&w=100', role: 'Admin', status: 'busy', statusText: 'Mochi ile Yürüyüşte 🌲' },
    { id: 'u3', name: 'Can', avatar: 'https://images.unsplash.com/photo-1599566150163-29194dcaad36?q=80&w=100', role: 'Member', status: 'offline', statusText: 'Son görülme: 1s önce' },
];

const INITIAL_LOGS: FamilyLog[] = [
    { id: 'l1', user: 'Annem', action: 'Yürüyüşe Çıkardı', time: '14:30', iconType: 'Footprints', color: 'text-orange-500 bg-orange-100' },
    { id: 'l2', user: 'Sen', action: 'Ödül Maması Verdi', time: '12:15', iconType: 'Utensils', color: 'text-green-500 bg-green-100' },
    { id: 'l3', user: 'Can', action: 'Su Kabını Tazeledi', time: '09:00', iconType: 'Activity', color: 'text-blue-500 bg-blue-100' },
];

// Helper Generators
const ACTIONS = [
    { text: 'Mochi\'yi Yürüyüşe Çıkardı', iconType: 'Footprints' as const, color: 'text-orange-500 bg-orange-100' },
    { text: 'Ödül Maması Verdi', iconType: 'Utensils' as const, color: 'text-green-500 bg-green-100' },
    { text: 'Su Kabını Tazeledi', iconType: 'Activity' as const, color: 'text-blue-500 bg-blue-100' },
    { text: 'Mochi ile Oynadı', iconType: 'Heart' as const, color: 'text-red-500 bg-red-100' },
];

const STATUSES = [
    { key: 'online' as const, text: 'Çevrimiçi', color: 'bg-green-500' },
    { key: 'busy' as const, text: 'Mochi ile Yürüyüşte 🌲', color: 'bg-orange-500' },
    { key: 'busy' as const, text: 'Mochi\'yi Yıkıyor 🛁', color: 'bg-blue-500' },
    { key: 'offline' as const, text: 'Son görülme: Şimdi', color: 'bg-gray-400' },
];

export class FamilyMockService implements IFamilyService {
    private members: FamilyMember[] = [...INITIAL_MEMBERS];
    private logs: FamilyLog[] = [...INITIAL_LOGS];
    private subscribers: ((event: FamilyEvent) => void)[] = [];
    private simulationInterval: NodeJS.Timeout | null = null;

    constructor() {
        this.startSimulation();
    }

    async getMembers(): Promise<FamilyMember[]> {
        return Promise.resolve([...this.members]);
    }

    async getLogs(): Promise<FamilyLog[]> {
        return Promise.resolve([...this.logs]);
    }

    async inviteMember(email: string): Promise<string> {
        // Mock backend delay
        await new Promise(resolve => setTimeout(resolve, 1000));
        return "INVITE_CODE_12345";
    }

    async updateStatus(status: FamilyMember['status'], text: string): Promise<void> {
        // Update 'Sen' (Index 0)
        this.members[0] = { ...this.members[0], status, statusText: text };
        this.notify({ type: 'MEMBER_UPDATE', members: [...this.members] });
    }

    subscribe(callback: (event: FamilyEvent) => void): () => void {
        this.subscribers.push(callback);
        return () => {
            this.subscribers = this.subscribers.filter(cb => cb !== callback);
        };
    }

    private notify(event: FamilyEvent) {
        this.subscribers.forEach(cb => cb(event));
    }

    // This is the simulation logic moved from UI to Service
    private startSimulation() {
        if (this.simulationInterval) return;

        this.simulationInterval = setInterval(() => {
            const random = Math.random();
            if (random > 0.6) {
                const eventType = Math.random() > 0.5 ? 'LOG' : 'STATUS';
                const targetMemberIndex = Math.floor(Math.random() * this.members.length);
                // Don't update 'Sen' automatically
                if (this.members[targetMemberIndex].name === 'Sen') return;

                const targetMember = this.members[targetMemberIndex];

                if (eventType === 'STATUS') {
                    const newStatus = STATUSES[Math.floor(Math.random() * STATUSES.length)];
                    this.members = this.members.map((m, i) =>
                        i === targetMemberIndex
                            ? { ...m, status: newStatus.key, statusText: newStatus.text }
                            : m
                    );
                    this.notify({ type: 'MEMBER_UPDATE', members: [...this.members] });

                    if (newStatus.key === 'busy') {
                        this.notify({ type: 'NOTIFICATION', message: `${targetMember.name}: ${newStatus.text}` });
                    }
                } else {
                    const newAction = ACTIONS[Math.floor(Math.random() * ACTIONS.length)];
                    const now = new Date();
                    const timeStr = `${now.getHours()}:${now.getMinutes().toString().padStart(2, '0')}`;

                    const newLog: FamilyLog = {
                        id: Date.now().toString(),
                        user: targetMember.name,
                        action: newAction.text,
                        time: timeStr,
                        iconType: newAction.iconType,
                        color: newAction.color
                    };

                    this.logs = [newLog, ...this.logs];
                    this.notify({ type: 'NEW_LOG', log: newLog });
                    this.notify({ type: 'NOTIFICATION', message: `${targetMember.name} ${newAction.text}` });
                }
            }
        }, 5000 * 0.7); // Slightly faster for testing
    }
}
