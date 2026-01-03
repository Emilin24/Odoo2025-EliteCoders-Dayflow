-- Add new columns to profiles table safely
DO $$ 
BEGIN 
    -- Contact Details
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'phone') THEN
        ALTER TABLE public.profiles ADD COLUMN phone TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'address') THEN
        ALTER TABLE public.profiles ADD COLUMN address TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'avatar_url') THEN
        ALTER TABLE public.profiles ADD COLUMN avatar_url TEXT;
    END IF;

    -- Job Details
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'department') THEN
        ALTER TABLE public.profiles ADD COLUMN department TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'designation') THEN
        ALTER TABLE public.profiles ADD COLUMN designation TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'joining_date') THEN
        ALTER TABLE public.profiles ADD COLUMN joining_date DATE;
    END IF;

    -- Salary Structure (base_salary already exists from payroll update)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'salary_hra') THEN
        ALTER TABLE public.profiles ADD COLUMN salary_hra NUMERIC(12, 2) DEFAULT 0.00;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'salary_allowances') THEN
        ALTER TABLE public.profiles ADD COLUMN salary_allowances NUMERIC(12, 2) DEFAULT 0.00;
    END IF;

    -- Documents (JSONB array)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'documents') THEN
        ALTER TABLE public.profiles ADD COLUMN documents JSONB DEFAULT '[]'::jsonb;
    END IF;

END $$;
