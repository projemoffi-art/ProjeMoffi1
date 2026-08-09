CREATE TABLE IF NOT EXISTS public.pet_ownership_transfers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pet_id UUID NOT NULL REFERENCES public.pets(id) ON DELETE CASCADE,
    from_owner_id UUID NOT NULL REFERENCES auth.users(id),
    to_email TEXT NOT NULL,
    to_owner_id UUID REFERENCES auth.users(id), -- kabul edilince doldurulur
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'cancelled', 'expired')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    expires_at TIMESTAMP WITH TIME ZONE DEFAULT (timezone('utc'::text, now()) + INTERVAL '7 days'),
    responded_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS idx_transfers_pet_id ON public.pet_ownership_transfers(pet_id);
CREATE INDEX IF NOT EXISTS idx_transfers_to_email ON public.pet_ownership_transfers(to_email);

GRANT ALL ON TABLE public.pet_ownership_transfers TO postgres, service_role, authenticated;
ALTER TABLE public.pet_ownership_transfers ENABLE ROW LEVEL SECURITY;

-- Mevcut sahip kendi başlattığı transferleri görebilir/oluşturabilir/iptal edebilir
DROP POLICY IF EXISTS "Owner manages own transfers" ON public.pet_ownership_transfers;
CREATE POLICY "Owner manages own transfers"
ON public.pet_ownership_transfers FOR ALL
TO authenticated
USING (auth.uid() = from_owner_id)
WITH CHECK (auth.uid() = from_owner_id);

-- Alıcı, kendi emailine gelen bekleyen transferleri görebilir
DROP POLICY IF EXISTS "Recipient can view pending transfers" ON public.pet_ownership_transfers;
CREATE POLICY "Recipient can view pending transfers"
ON public.pet_ownership_transfers FOR SELECT
TO authenticated
USING (to_email = (SELECT email FROM auth.users WHERE id = auth.uid()));

-- GÜVENLİ KABUL FONKSİYONU: Alıcının kendi UPDATE yetkisi olmadan,
-- kontrollü bir şekilde hem transferi hem pets.owner_id'yi ATOMIK değiştirir
CREATE OR REPLACE FUNCTION public.accept_pet_transfer(p_transfer_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_transfer RECORD;
    v_my_email TEXT;
BEGIN
    SELECT email INTO v_my_email FROM auth.users WHERE id = auth.uid();

    SELECT * INTO v_transfer FROM public.pet_ownership_transfers
    WHERE id = p_transfer_id AND status = 'pending' AND expires_at > now();

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Transfer bulunamadı, süresi dolmuş veya zaten işlenmiş.';
    END IF;

    IF v_transfer.to_email != v_my_email THEN
        RAISE EXCEPTION 'Bu transfer size ait değil.';
    END IF;

    -- Atomik: hem pet'in sahibini değiştir hem transferi kapat
    UPDATE public.pets SET owner_id = auth.uid() WHERE id = v_transfer.pet_id;
    UPDATE public.pet_ownership_transfers
        SET status = 'accepted', to_owner_id = auth.uid(), responded_at = now()
        WHERE id = p_transfer_id;

    RETURN true;
END;
$$;

GRANT EXECUTE ON FUNCTION public.accept_pet_transfer(UUID) TO authenticated;
