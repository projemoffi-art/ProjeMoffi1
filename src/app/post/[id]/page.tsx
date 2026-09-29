import { redirect } from 'next/navigation';

// Eski gönderi bağlantıları Keşfet'teki gönderi sayfasına gider.
export default async function LegacyPostRedirect({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    redirect(`/community/gonderi/${id}`);
}
