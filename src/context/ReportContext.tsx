"use client";

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { ReportModal } from '@/components/common/modals/ReportModal';

type EntityType = 'post' | 'comment' | 'user' | 'pet';

interface ReportContextType {
    openReportModal: (entityType: EntityType, entityId: string) => void;
    closeReportModal: () => void;
}

const ReportContext = createContext<ReportContextType | undefined>(undefined);

class ReportErrorBoundary extends React.Component<{children: ReactNode}, {hasError: boolean, error: Error | null}> {
    constructor(props: {children: ReactNode}) {
        super(props);
        this.state = { hasError: false, error: null };
    }
    static getDerivedStateFromError(error: Error) {
        return { hasError: true, error };
    }
    componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
        console.error("ReportModal Error:", error, errorInfo);
        // Force an alert on the screen so the user can see it!
        if (typeof window !== 'undefined') {
            window.alert("Şikayet Modalı Hatası: " + error.message);
        }
    }
    render() {
        if (this.state.hasError) {
            return (
                <div className="fixed inset-0 z-[999999] flex items-center justify-center bg-black/80 p-4">
                    <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl max-w-lg w-full">
                        <h2 className="text-red-500 font-bold text-xl mb-4">Şikayet Sistemi Hatası</h2>
                        <p className="text-sm text-gray-500 mb-2">Lütfen bu mesajı kopyalayıp gönderin:</p>
                        <pre className="bg-red-50 dark:bg-red-950/20 p-4 rounded-xl text-xs text-red-600 dark:text-red-400 overflow-auto whitespace-pre-wrap">
                            {this.state.error?.message}
                        </pre>
                        <button onClick={() => this.setState({hasError: false})} className="mt-4 px-4 py-2 bg-black dark:bg-white text-white dark:text-black rounded-lg text-sm font-bold w-full">Kapat</button>
                    </div>
                </div>
            );
        }
        return this.props.children;
    }
}

import { useAuth } from '@/context/AuthContext';

export function ReportProvider({ children }: { children: ReactNode }) {
    const [isOpen, setIsOpen] = useState(false);
    const [entityType, setEntityType] = useState<EntityType>('post');
    const [entityId, setEntityId] = useState('');
    const { user } = useAuth();

    const openReportModal = useCallback((type: EntityType, id: string) => {
        const isValidUUID = (uuid: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(uuid);
        
        // Merkezi giriş kontrolü: Üye değilse veya UUID'si geçersizse direkt girişe yönlendir
        if (!user || !isValidUUID(String(user.id))) {
            window.dispatchEvent(new CustomEvent('moffi-navigate', { detail: 'login' }));
            return;
        }

        setEntityType(type);
        setEntityId(id);
        setIsOpen(true);
    }, [user]);

    const closeReportModal = useCallback(() => {
        setIsOpen(false);
        // We delay clearing the type and id slightly to let the modal exit animation play smoothly
        setTimeout(() => {
            setEntityId('');
        }, 300);
    }, []);

    return (
        <ReportContext.Provider value={{ openReportModal, closeReportModal }}>
            {children}
            <ReportErrorBoundary>
                <ReportModal
                    isOpen={isOpen}
                    onClose={closeReportModal}
                    entityType={entityType}
                    entityId={entityId}
                />
            </ReportErrorBoundary>
        </ReportContext.Provider>
    );
}

export function useReport() {
    const context = useContext(ReportContext);
    if (context === undefined) {
        throw new Error('useReport must be used within a ReportProvider');
    }
    return context;
}
