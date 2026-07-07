import { useState, useEffect, useRef } from "react";
import { IFamilyService } from "@/services/interfaces";
import { FamilyMockService } from "@/services/mock/FamilyMockService";
import { FamilyMember, FamilyLog } from "@/types/domain";

// Singleton Instance (Simulating Dependency Injection)
const familyService: IFamilyService = new FamilyMockService();

export function useFamily() {
    const [members, setMembers] = useState<FamilyMember[]>([]);
    const [logs, setLogs] = useState<FamilyLog[]>([]);
    const [notification, setNotification] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        // Initial Load
        Promise.all([
            familyService.getMembers(),
            familyService.getLogs()
        ]).then(([m, l]) => {
            setMembers(m);
            setLogs(l);
            setIsLoading(false);
        });

        // Subscription
        const unsubscribe = familyService.subscribe((event) => {
            switch (event.type) {
                case 'MEMBER_UPDATE':
                    setMembers(event.members);
                    break;
                case 'NEW_LOG':
                    setLogs(prev => [event.log, ...prev]);
                    break;
                case 'NOTIFICATION':
                    setNotification(event.message);
                    // Auto dismiss handled by UI or here? Better here for state consistency
                    setTimeout(() => setNotification(null), 4000);
                    break;
            }
        });

        return () => unsubscribe();
    }, []);

    const inviteMember = async (email: string) => {
        return await familyService.inviteMember(email);
    };

    const updateMyStatus = async (status: FamilyMember['status'], text: string) => {
        return await familyService.updateStatus(status, text);
    };

    return {
        members,
        logs,
        notification,
        isLoading,
        inviteMember,
        updateMyStatus
    };
}
