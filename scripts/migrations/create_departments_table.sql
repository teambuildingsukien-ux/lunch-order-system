-- Create departments table
CREATE TABLE IF NOT EXISTS public.departments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Enable read access for all users"
ON public.departments FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Enable insert for authenticated users"
ON public.departments FOR INSERT
TO authenticated
WITH CHECK (true);

-- Populate existing departments
INSERT INTO public.departments (name)
SELECT DISTINCT department FROM public.users
WHERE department IS NOT NULL AND department != ''
ON CONFLICT (name) DO NOTHING;
