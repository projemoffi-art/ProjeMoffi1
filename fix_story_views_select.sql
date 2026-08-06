-- 1. Yalnızca kullanıcıların kendi görüntüledikleri hikayeleri seçebilmeleri için SELECT kuralı ekliyoruz
DROP POLICY IF EXISTS "Users can view their own story views" ON public.story_views;
CREATE POLICY "Users can view their own story views" ON public.story_views
    FOR SELECT
    USING (auth.uid() = viewer_id);

-- 2. Yalnızca kullanıcıların kendi adlarına görüntüleme ekleyebilmeleri için INSERT kuralı
DROP POLICY IF EXISTS "Users can insert their own story views" ON public.story_views;
CREATE POLICY "Users can insert their own story views" ON public.story_views
    FOR INSERT
    WITH CHECK (auth.uid() = viewer_id);

-- 3. Yalnızca kullanıcıların kendi görüntüleme kayıtlarını güncelleyebilmeleri için UPDATE kuralı
DROP POLICY IF EXISTS "Users can update their own views" ON public.story_views;
CREATE POLICY "Users can update their own views" ON public.story_views
    FOR UPDATE
    USING (auth.uid() = viewer_id)
    WITH CHECK (auth.uid() = viewer_id);
