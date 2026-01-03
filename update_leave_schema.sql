-- Add admin_comment to leave_requests
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'leave_requests' AND column_name = 'admin_comment') THEN
        ALTER TABLE public.leave_requests ADD COLUMN admin_comment TEXT;
    END IF;
END $$;
