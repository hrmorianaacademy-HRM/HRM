-- Add mentor_email and mode columns to classes table if they don't exist
-- This migration adds the new fields to support mentor assignment and class delivery mode

-- Check and add mentor_email column
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'classes' AND column_name = 'mentor_email'
    ) THEN
        ALTER TABLE classes ADD COLUMN mentor_email TEXT;
        RAISE NOTICE 'Added mentor_email column to classes table';
    END IF;
END $$;

-- Check and add mode column
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'classes' AND column_name = 'mode'
    ) THEN
        ALTER TABLE classes ADD COLUMN mode TEXT;
        RAISE NOTICE 'Added mode column to classes table';
    END IF;
END $$;

-- Verify the columns were added
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'classes' 
ORDER BY ordinal_position;
