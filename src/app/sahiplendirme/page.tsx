import { redirect } from 'next/navigation';

// Sahiplendirme ekranları Faz 2'de (design-reference/community-final/sahiplendirme-reference.jpg) kurulacak;
// o zamana kadar mevcut sahiplendirme panosu açılır.
export default function AdoptionRedirect() {
    redirect('/community?tab=radar&mode=adopt');
}
