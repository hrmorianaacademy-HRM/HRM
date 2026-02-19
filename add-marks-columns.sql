-- Migration: Add missing columns to marks table
-- Run this on your Render PostgreSQL database

-- Check if the columns exist before adding them
DO $$
BEGIN
    -- Add assessment1 column if not exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'marks' AND column_name = 'assessment1') THEN
        ALTER TABLE marks ADD COLUMN assessment1 INTEGER DEFAULT 0;
    END IF;

    -- Add assessment2 column if not exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'marks' AND column_name = 'assessment2') THEN
        ALTER TABLE marks ADD COLUMN assessment2 INTEGER DEFAULT 0;
    END IF;

    -- Add task column if not exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'marks' AND column_name = 'task') THEN
        ALTER TABLE marks ADD COLUMN task INTEGER DEFAULT 0;
    END IF;

    -- Add project column if not exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'marks' AND column_name = 'project') THEN
        ALTER TABLE marks ADD COLUMN project INTEGER DEFAULT 0;
    END IF;

    -- Add final_validation column if not exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'marks' AND column_name = 'final_validation') THEN
        ALTER TABLE marks ADD COLUMN final_validation INTEGER DEFAULT 0;
    END IF;

    -- Add total column if not exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'marks' AND column_name = 'total') THEN
        ALTER TABLE marks ADD COLUMN total INTEGER DEFAULT 0;
    END IF;

    -- Add created_at column if not exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'marks' AND column_name = 'created_at') THEN
        ALTER TABLE marks ADD COLUMN created_at TIMESTAMP DEFAULT NOW();
    END IF;

    -- Add updated_at column if not exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'marks' AND column_name = 'updated_at') THEN
        ALTER TABLE marks ADD COLUMN updated_at TIMESTAMP DEFAULT NOW();
    END IF;
END $$;

-- Verify columns were added
SELECT column_name, data_type, column_default 
FROM information_schema.columns 
WHERE table_name = 'marks'
ORDER BY ordinal_position;
