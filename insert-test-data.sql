-- This SQL script creates test data for the HR → Accounts flow
-- Run this in your Neon database console or using psql

-- Step 1: Get HR user ID (replace with actual HR user ID from your database)
-- You can find this by running: SELECT id, full_name, email FROM users WHERE role = 'hr';

-- Step 2: Insert a test lead with accounts_pending status
INSERT INTO leads (
    name, email, phone, location, degree, domain,
    session_days, walkin_date, walkin_time, timing,
    current_owner_id, status, registration_amount, category,
    created_at, updated_at
) VALUES (
    'Test Lead - HR to Accounts',
    'testlead@example.com',
    '9876543210',
    'Test City',
    'B.Tech',
    'Computer Science',
    'M,W,F',
    CURRENT_DATE,
    '10:00',
    'Morning',
    NULL,  -- No current owner (passed to accounts)
    'accounts_pending',  -- This is the key status
    5000,
    'Client Hiring',
    NOW(),
    NOW()
) RETURNING id;

-- Step 3: Create lead history entry (replace LEAD_ID and HR_USER_ID with actual values)
-- After running the INSERT above, note the returned ID
-- Then run this with the actual IDs:
/*
INSERT INTO lead_history (
    lead_id, from_user_id, previous_status, new_status,
    change_reason, changed_by_user_id, changed_at
) VALUES (
    LEAD_ID,  -- Replace with the ID from step 2
    'HR_USER_ID',  -- Replace with actual HR user ID
    'new',
    'accounts_pending',
    'Test data - Passed to Accounts',
    'HR_USER_ID',  -- Replace with actual HR user ID
    NOW()
);
*/

-- Step 4: Verify the data
SELECT id, name, status, current_owner_id FROM leads WHERE status = 'accounts_pending';
