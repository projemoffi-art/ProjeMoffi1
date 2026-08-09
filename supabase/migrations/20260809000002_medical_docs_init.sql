-- Add attachments column to medical_records
ALTER TABLE public.medical_records ADD COLUMN IF NOT EXISTS attachments TEXT[] DEFAULT '{}';

-- Create the private bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('medical-documents', 'medical-documents', false)
ON CONFLICT (id) DO NOTHING;

-- Sadece pet sahibi VEYA o pet'in gerçek klinik kaydını oluşturan klinik erişebilsin
DROP POLICY IF EXISTS "Owners and clinics can view medical documents" ON storage.objects;
CREATE POLICY "Owners and clinics can view medical documents"
ON storage.objects FOR SELECT
TO authenticated
USING (
    bucket_id = 'medical-documents'
    AND (
        -- path formatı: {pet_id}/{appointment_id}/{filename}
        EXISTS (
            SELECT 1 FROM public.pets p
            WHERE p.id::text = (string_to_array(name, '/'))[1]
            AND p.owner_id = auth.uid()
        )
        OR
        EXISTS (
            SELECT 1 FROM public.medical_records mr
            WHERE mr.pet_id::text = (string_to_array(name, '/'))[1]
            AND mr.clinic_id = auth.uid()::text
        )
    )
);

DROP POLICY IF EXISTS "Clinics can upload medical documents" ON storage.objects;
CREATE POLICY "Clinics can upload medical documents"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'medical-documents');
