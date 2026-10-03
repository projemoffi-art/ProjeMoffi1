'use client';

// Ana sayfadan sonradan hayvan ekleme: AddPetModal'ın durumu ve kaydı (eskiden ana sayfa dosyasının içindeydi).
// İlk kurulum /onboarding'de (PetSetup); bu pencere yalnızca sonradan eklemeler için (ana sayfa ve profil aynı akışı kullanır).

import { useState } from 'react';
import { AddPetModal } from '@/components/community/modals/AddPetModal';
import { usePet } from '@/context/PetContext';
import { apiService } from '@/services/apiService';
import { healthService } from '@/services/healthService';
import { errorMessage, showToast } from '@/lib/utils';
import type { Pet } from '@/services/types';

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
    const [photos, setPhotos] = useState<{ file: File; preview: string }[]>([]);
    const [weight, setWeight] = useState('');
    const [saving, setSaving] = useState(false);

    const reset = () => {
        setStep(1); setName(''); setBreed(''); setAge(''); setFeatures(''); setHealth(''); setCharacter('');
        setMicrochip(''); setPhotos([]); setWeight('');
    };

    const save = async () => {
        setSaving(true);
        try {
            let imageUrl = '';
            if (photos.length > 0) {
                try { imageUrl = await apiService.uploadMedia(photos[0].file, 'avatars'); }
                catch (e) { console.warn('Fotoğraf yüklenemedi, hayvan fotoğrafsız kaydedilecek:', e); }
            }
            const data: Partial<Pet> & { name: string } = {
                name, type, breed, age, gender, size, character,
                neutered: neutered === 'Evet',
                // Ayırt edici özellikler virgülle yazılır, veritabanında liste olarak durur.
                features: features.split(',').map(f => f.trim()).filter(Boolean),
                microchip,
                image: imageUrl,
                weight: weight ? `${weight} kg` : '',
                sos_settings: {
                    auto_post_sos: true, sos_radius: '5km', secure_proxy_only: false, location_precision: 'exact',
                    emergency_sms_number: '', reward_amount: 0, reward_currency: 'TL', finder_message: '',
                    reward_enabled: false, header_sos_alert_enabled: true,
                },
            };
            const saved = await apiService.addPet(data);
            // Eklerken yazılan alerji/hastalık bilgisi tek sağlık kaydına (Acil Bilgiler) gider.
            if (health.trim() && saved.id) {
                await healthService.saveProfile(saved.id, { notes: health }).catch(e => console.warn('Sağlık notu kaydedilemedi:', e));
            }
            addPet({ id: saved.id });
            showToast(`${name} aileye hoş geldi! 🐾`, 'CheckCircle2', 'text-emerald-500');
            reset();
            onClose();
        } catch (err) {
            console.error('Hayvan kayıt hatası:', err);
            // Sunucu mesajı olduğu gibi (ör. hayvan sınırı: "Ücretsiz hesapta en çok 5 hayvan… Prime ile 15")
            showToast(errorMessage(err, 'Kaydedilemedi, tekrar dene.'), 'AlertCircle', 'text-red-500');
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
            newPetPhotos={photos}
            setNewPetPhotos={setPhotos}
            isSaving={saving}
            onSave={save}
            newPetWeight={weight}
            setNewPetWeight={setWeight}
        />
    );
}
