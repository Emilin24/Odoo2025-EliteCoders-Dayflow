-- 1. START TRANSACTION
-- This ensures that if any part fails, no changes are applied.
BEGIN;

-- 2. ENHANCE PROFILES TABLE
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'profiles' AND column_name = 'base_salary') THEN
        ALTER TABLE public.profiles ADD COLUMN base_salary NUMERIC(12, 2) DEFAULT 0.00;
    END IF;
END $$;

-- 3. CREATE PAYROLL TABLE
CREATE TABLE IF NOT EXISTS public.payroll (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE RESTRICT NOT NULL,
    salary_amount NUMERIC(12, 2) NOT NULL CHECK (salary_amount >= 0),
    pay_date DATE NOT NULL DEFAULT CURRENT_DATE,
    status TEXT NOT NULL DEFAULT 'Pending' 
        CHECK (status IN ('Paid', 'Pending', 'Processing', 'Cancelled')),
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 4. AUTOMATION TRIGGER FUNCTION
-- This automatically fetches the base_salary from profiles if salary_amount isn't provided.
CREATE OR REPLACE FUNCTION public.fn_sync_salary_amount()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.salary_amount IS NULL OR NEW.salary_amount = 0 THEN
        SELECT base_salary INTO NEW.salary_amount 
        FROM public.profiles 
        WHERE id = NEW.user_id;
    END IF;
    
    -- Safety check: ensure we don't insert a null salary
    IF NEW.salary_amount IS NULL THEN
        NEW.salary_amount := 0.00;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 5. ATTACH TRIGGER
DROP TRIGGER IF EXISTS tr_sync_salary_amount ON public.payroll;
CREATE TRIGGER tr_sync_salary_amount
    BEFORE INSERT ON public.payroll
    FOR EACH ROW EXECUTE FUNCTION public.fn_sync_salary_amount();

-- 6. CONFIGURE ROW LEVEL SECURITY (RLS)
ALTER TABLE public.payroll ENABLE ROW LEVEL SECURITY;

-- Policy: Employees view only their own records
DROP POLICY IF EXISTS "Users can view own payroll" ON public.payroll;
CREATE POLICY "Users can view own payroll" ON public.payroll
    FOR SELECT USING (auth.uid() = user_id);

-- Policy: HR full access (Insert, Update, Delete, Select)
DROP POLICY IF EXISTS "HR full access to payroll" ON public.payroll;
CREATE POLICY "HR full access to payroll" ON public.payroll
    FOR ALL TO authenticated
    USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'HR'))
    WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'HR'));

-- Policy: HR can update profiles (specifically to manage base_salary)
DROP POLICY IF EXISTS "HR can update profiles" ON public.profiles;
CREATE POLICY "HR can update profiles" ON public.profiles
    FOR UPDATE USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'HR'));

-- 7. FINALIZE
COMMIT;
