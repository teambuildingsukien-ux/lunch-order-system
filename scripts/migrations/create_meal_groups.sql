-- 1. Create 'meal_groups' table
CREATE TABLE IF NOT EXISTS public.meal_groups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Create 'user_meal_groups' junction table
CREATE TABLE IF NOT EXISTS public.user_meal_groups (
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    meal_group_id UUID REFERENCES public.meal_groups(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (user_id, meal_group_id)
);

-- 3. Enable RLS
ALTER TABLE public.meal_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_meal_groups ENABLE ROW LEVEL SECURITY;

-- 4. Policies (Simple for now to unblock development)
-- Allow anyone authenticated to read
CREATE POLICY "Allow read access for authenticated users" ON public.meal_groups 
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow insert/update/delete for authenticated admin users" ON public.meal_groups 
    FOR ALL TO authenticated USING (true); -- Ideally restrict to admin role check later

CREATE POLICY "Allow read access for authenticated users" ON public.user_meal_groups 
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow basic write access for authenticated users" ON public.user_meal_groups 
    FOR ALL TO authenticated USING (true);
