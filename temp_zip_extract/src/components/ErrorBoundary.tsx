"use client";

import React from "react";

interface Props {
    children: React.ReactNode;
    fallback?: React.ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
        console.error('[ErrorBoundary]', error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            if (this.props.fallback) {
                return this.props.fallback;
            }

            return (
                <div style={{ padding: '24px', textAlign: 'center', background: 'transparent', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '50vh' }}>
                    <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'rgba(255,100,100,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }}>
                        <span style={{ fontSize: '20px' }}>⚠️</span>
                    </div>
                    <h2 style={{ fontSize: '16px', fontWeight: 'bold', color: '#fff', marginBottom: '8px' }}>Bu Bölümde Bir Hata Oluştu</h2>
                    <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.5)', maxWidth: '280px', margin: '0 auto 20px', lineHeight: '1.4' }}>Bunu hemen teknik ekibe iletiyoruz. Geri dönüp başka bir alana geçebilirsiniz.</p>
                    <div style={{ background: 'rgba(255,0,0,0.1)', border: '1px solid rgba(255,0,0,0.2)', padding: '10px', borderRadius: '8px', marginBottom: '20px', width: '90%', maxWidth: '300px', wordBreak: 'break-all' }}>
                        <p style={{ color: '#ff6b6b', fontSize: '11px', textAlign: 'left', fontFamily: 'monospace' }}>
                            {this.state.error?.message || "Unknown Error"}
                        </p>
                    </div>
                    <button 
                        onClick={() => window.location.href = '/community'} 
                        style={{ padding: '10px 24px', background: '#fff', color: '#000', borderRadius: '12px', fontSize: '13px', fontWeight: 'bold', border: 'none', cursor: 'pointer' }}
                    >
                        Ana Ekrana Dön
                    </button>
                </div>
            );
        }

        return this.props.children;
    }
}
