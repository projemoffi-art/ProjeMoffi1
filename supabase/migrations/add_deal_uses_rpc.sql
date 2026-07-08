-- RPC Function to safely increment deal uses and prevent race conditions
CREATE OR REPLACE FUNCTION public.increment_deal_uses(deal_id_param UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.business_deals
  SET current_uses = current_uses + 1
  WHERE id = deal_id_param;
END;
$$;
