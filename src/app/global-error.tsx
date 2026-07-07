"use client";

import React from 'react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <html lang="en" className="notranslate" translate="no">
      <body className="bg-background text-foreground font-sans antialiased">
        <div className="min-h-screen flex items-center justify-center p-6">
          <div className="max-w-md w-full bg-[#1C1C1E] border border-white/5 rounded-[2rem] p-8 text-center shadow-2xl">
            <h2 className="text-2xl font-black text-red-500 mb-4">Bir şeyler ters gitti!</h2>
            <p className="text-gray-400 text-sm mb-8">Kritik bir hata oluştu. Lütfen sayfayı yenilemeyi deneyin.</p>
            <button
              onClick={() => reset()}
              className="w-full bg-[#0A84FF] text-white font-bold py-4 rounded-2xl active:scale-95 transition-transform"
            >
              Yeniden Dene
            </button>
          </div>
        </div>
      </body>
    </html>
  )
}
