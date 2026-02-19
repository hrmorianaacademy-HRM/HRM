import pkg from 'pg';
const { Client } = pkg;

const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_URL?.includes('neon.tech') ? { rejectUnauthorized: false } : undefined
});

async function checkAccountsLeads() {
    try {
        await client.connect();
        console.log('✓ Connected to database\n');

        // Check leads with accounts_pending status
        console.log('=== LEADS WITH ACCOUNTS_PENDING STATUS ===');
        const accountsPendingResult = await client.query(
            'SELECT id, name, email, status, current_owner_id, created_at FROM leads WHERE status = $1 ORDER BY created_at DESC LIMIT 10',
            ['accounts_pending']
        );

        if (accountsPendingResult.rows.length === 0) {
            console.log('❌ NO leads found with accounts_pending status');
        } else {
            console.log(`✓ Found ${accountsPendingResult.rows.length} leads with accounts_pending status:`);
            accountsPendingResult.rows.forEach((lead, index) => {
                console.log(`  ${index + 1}. Lead #${lead.id}: ${lead.name} (${lead.email})`);
                console.log(`     Status: ${lead.status}, Owner: ${lead.current_owner_id || 'NONE'}`);
                console.log(`     Created: ${lead.created_at}`);
            });
        }

        // Check recent lead_history entries
        console.log('\n=== RECENT LEAD HISTORY (accounts_pending) ===');
        const historyResult = await client.query(
            `SELECT lh.id, lh.lead_id, lh.new_status, lh.changed_at, lh.changed_by_user_id, l.name as lead_name
       FROM lead_history lh
       LEFT JOIN leads l ON lh.lead_id = l.id
       WHERE lh.new_status = $1
       ORDER BY lh.changed_at DESC
       LIMIT 10`,
            ['accounts_pending']
        );

        if (historyResult.rows.length === 0) {
            console.log('❌ NO history entries found with accounts_pending status');
        } else {
            console.log(`✓ Found ${historyResult.rows.length} history entries:`);
            historyResult.rows.forEach((entry, index) => {
                console.log(`  ${index + 1}. Lead #${entry.lead_id} (${entry.lead_name}): changed by ${entry.changed_by_user_id}`);
                console.log(`     Changed at: ${entry.changed_at}`);
            });
        }

        // Check accounts users
        console.log('\n=== ACCOUNTS USERS ===');
        const usersResult = await client.query(
            "SELECT id, full_name, email, role FROM users WHERE role = 'accounts'"
        );

        if (usersResult.rows.length === 0) {
            console.log('❌ NO accounts users found');
        } else {
            console.log(`✓ Found ${usersResult.rows.length} accounts users:`);
            usersResult.rows.forEach((user, index) => {
                console.log(`  ${index + 1}. ${user.full_name} (${user.email})`);
                console.log(`     ID: ${user.id}`);
            });
        }

        // Check all lead statuses
        console.log('\n=== LEAD STATUS DISTRIBUTION ===');
        const statusResult = await client.query(
            'SELECT status, COUNT(*) as count FROM leads GROUP BY status ORDER BY count DESC'
        );
        statusResult.rows.forEach(row => {
            console.log(`  ${row.status}: ${row.count} leads`);
        });

    } catch (error) {
        console.error('Error:', error.message);
    } finally {
        await client.end();
    }
}

checkAccountsLeads();
