import { redirect } from 'next/navigation';

// Paylaşım tek yerde: Pet Pasaportu → Paylaş (bağlantı + PDF). Eski bağlantılar oraya gider.
export default async function HealthShareRedirect({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
    const params = await searchParams;
    const bolum = typeof params.bolum === 'string' ? `?bolum=${encodeURIComponent(params.bolum)}` : '';
    redirect(`/pasaport/paylas${bolum}`);
}
