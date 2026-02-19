-- Check the status of all leads in HR's "My Completion"
-- This will help us understand why they're not appearing in Accounts' "My Leads"

SELECT 
    l.id,
    l.name,
    l.status,
    l.current_owner_id,
    lh.changed_by_user_id,
    lh.new_status as history_status,
    lh.changed_at
FROM leads l
LEFT JOIN lead_history lh ON l.id = lh.lead_id
WHERE lh.new_status IN ('completed', 'pending', 'accounts_pending', 'ready_for_class')
ORDER BY lh.changed_at DESC
LIMIT 20;

-- Check specifically for accounts_pending leads
SELECT id, name, status, current_owner_id 
FROM leads 
WHERE status = 'accounts_pending';

-- Check all unique statuses in the database
SELECT status, COUNT(*) as count 
FROM leads 
GROUP BY status 
ORDER BY count DESC;
