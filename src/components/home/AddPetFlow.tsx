'use client';

// Ana sayfadan sonradan hayvan ekleme: AddPetModal'ın durumu ve kaydı (eskiden ana sayfa dosyasının içindeydi).
// İlk kurulum /onboarding'de (PetSetup); bu pencere yalnızca sonradan eklemeler için.

import { useState } from 'react';
import { AddPetModal } from '@/components/community/modals/AddPetModal';
import { usePet } from '@/context/PetContext';
import { apiService } from '@/services/apiService';
import { healthService } from '@/services/healthService';
import { showToast } from '@/lib/utils';

export function AddPetFlow({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
    const { addPet } = usePet();
    const [step, setStep] = useState(1);
    const [name, setName] = useState('');
    const [type, setType] = useState('dog');
    const [breed, setBreed] = useState('');
    const [age, setAge] = useState('');
    const [gender, setGender] = useState('Erkek');
    const [neutered, setNeutered] = useState('Evet');
    const [size, setSize] = useState('Orta');
    const [features, setFeatures] = useState('');
    const [health, setHealth] = useState('');
    const [character, setCharacter] = useState('');
    const [microchip, setMicrochip] = useState('');
    const [showPhone, setShowPhone] = useState(true);
    const [photos, setPhotos] = useState<{ file: File; preview: string }[]>([]);
    const [weight, setWeight] = useState('');
    const [activityTarget, setActivityTarget] = useState('70');
    const [waterTarget, setWaterTarget] = useState('1200');
    const [foodTarget, setFoodTarget] = useState('1600');
    const [saving, setSaving] = useState(false);

    const reset = () => {
        setStep(1); setName(''); setBreed(''); setAge(''); setFeatures(''); setHealth(''); setCharacter('');
        setMicrochip(''); setPhotos([]); setWeight(''); setActivityTarget('70'); setWaterTarget('1200'); setFoodTarget('1600');
    };

    const save = async () => {
        setSaving(true);
        try {
            let imageUrl = '';
            if (photos.length > 0) {
                try { imageUrl = await apiService.uploadMedia(photos[0].file, 'avatars'); }
                catch (e) { console.warn('Fotoğraf yüklenemedi, hayvan fotoğrafsız kaydedilecek:', e); }
            }
            const weightText = weight ? `${weight} kg` : '';
            const data = {
                name, type, breed, age, gender, size, character,
                is_neutered: neutered === 'Evet',
                features,
                microchip_id: microchip,
                show_phone: showPhone,
                image: imageUrl,
                themeColor: '#EE5B3D',
                weight: weightText,
                streak: 0,
                activity_target: Number(activityTarget) || 70,
                water_target: Number(waterTarget) || 1200,
                food_target: Number(foodTarget) || 1600,
                sos_settings: {
                    auto_post_sos: true,
                    sos_radius: '5km' as const,
                    secure_proxy_only: false,
                    location_precision: 'exact' as const,
                    emergency_sms_number: '',
                    reward_amount: 0,
                    reward_currency: 'TL',
                    finder_message: '',
                    reward_enabled: false,
                    header_sos_alert_enabled: true,
                    weight: weightText,
                    streak: 0,
                    activity_target: Number(activityTarget) || 70,
                    water_target: Number(waterTarget) || 1200,
                    food_target: Number(foodTarget) || 1600,
                },
            };
            const saved = await apiService.addPet(data as unknown as Parameters<typeof apiService.addPet>[0]);
            const finalImage = saved.image || imageUrl || '';
            if (imageUrl && !saved.image && saved.id) {
                await apiService.updatePet(saved.id, { image: imageUrl, avatar: imageUrl }).catch(e => console.warn('Hayvan fotoğrafı yazılamadı:', e));
            }
            // Eklerken yazılan alerji/hastalık bilgisi tek sağlık kaydına (Acil Bilgiler) gider.
            if (health.trim() && saved.id) {
                await healthService.saveProfile(saved.id, { notes: health }).catch(e => console.warn('Sağlık notu kaydedilemedi:', e));
            }
            addPet({ ...data, id: saved.id, image: finalImage, avatar: finalImage } as unknown as Parameters<typeof addPet>[0]);
            showToast(`${name} aileye hoş geldi! 🐾`, 'CheckCircle2', 'text-emerald-500');
            reset();
            onClose();
        } catch (err) {
            console.error('Hayvan kayıt hatası:', err);
            const e = err as { message?: string; details?: string } | null;
            showToast(`Kaydedilemedi: ${String(e?.message || e?.details || 'bilinmeyen hata').slice(0, 80)}`, 'AlertCircle', 'text-red-500');
        } finally {
            setSaving(false);
        }
    };

    return (
        <AddPetModal
            isOpen={isOpen}
            onClose={onClose}
            step={step}
            setStep={setStep}
            newPetName={name}
            setNewPetName={setName}
            newPetType={type}
            setNewPetType={setType}
            newPetBreed={breed}
            setNewPetBreed={setBreed}
            newPetAge={age}
            setNewPetAge={setAge}
            newPetGender={gender}
            setNewPetGender={setGender}
            newPetNeutered={neutered}
            setNewPetNeutered={setNeutered}
            newPetSize={size}
            setNewPetSize={setSize}
            newPetFeatures={features}
            setNewPetFeatures={setFeatures}
            newPetHealth={health}
            setNewPetHealth={setHealth}
            newPetCharacter={character}
            setNewPetCharacter={setCharacter}
            newPetMicrochip={microchip}
            setNewPetMicrochip={setMicrochip}
            newPetShowPhone={showPhone}
            setNewPetShowPhone={setShowPhone}
            newPetPhotos={photos}
            setNewPetPhotos={setPhotos}
            isSaving={saving}
            onSave={save}
            newPetWeight={weight}
            setNewPetWeight={setWeight}
            newPetActivityTarget={activityTarget}
            setNewPetActivityTarget={setActivityTarget}
            newPetWaterTarget={waterTarget}
            setNewPetWaterTarget={setWaterTarget}
            newPetFoodTarget={foodTarget}
            setNewPetFoodTarget={setFoodTarget}
        />
    );
}
