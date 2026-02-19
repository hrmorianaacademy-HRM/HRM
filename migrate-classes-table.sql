-- Migration to add missing columns to the classes table
-- Run this on the Render database to fix class creation

-- Add subject column if it doesn't exist
ALTER TABLE classes ADD COLUMN IF NOT EXISTS subject TEXT;

-- Add mentor_email column if it doesn't exist  
ALTER TABLE classes ADD COLUMN IF NOT EXISTS mentor_email TEXT;

-- Add mode column if it doesn't exist
ALTER TABLE classes ADD COLUMN IF NOT EXISTS mode TEXT;

-- Verify the columns were added
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'classes';
