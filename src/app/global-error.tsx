"use client";

export default function GlobalError({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    return (
        <html>
            <body style={{ margin: 0, background: '#050508', color: '#fff', fontFamily: 'sans-serif', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
                <div style={{ textAlign: 'center', padding: '40px' }}>
                    <h2 style={{ fontSize: '20px', marginBottom: '12px' }}>Bir şeyler ters gitti</h2>
                    <p style={{ color: '#666', marginBottom: '24px', fontSize: '14px' }}>{error?.message || 'Beklenmeyen bir hata oluştu.'}</p>
                    <button
                        onClick={() => reset()}
                        style={{ background: '#fff', color: '#000', border: 'none', padding: '12px 32px', borderRadius: '12px', fontSize: '14px', fontWeight: 'bold', cursor: 'pointer' }}
                    >
                        Yeniden Dene
                    </button>
                </div>
            </body>
        </html>
    );
}
