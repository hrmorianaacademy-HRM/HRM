import pkg from 'pg';
const { Client } = pkg;

const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_URL?.includes('neon.tech') ? { rejectUnauthorized: false } : undefined
});

async function createTestAccountsLead() {
    try {
        await client.connect();
        console.log('✓ Connected to database\n');

        // Get an HR user
        const hrResult = await client.query(
            "SELECT id, full_name FROM users WHERE role = 'hr' LIMIT 1"
        );

        if (hrResult.rows.length === 0) {
            console.log('❌ No HR users found. Cannot create test lead.');
            return;
        }

        const hrUser = hrResult.rows[0];
        console.log(`✓ Found HR user: ${hrUser.full_name} (${hrUser.id})`);

        // Check if there are any existing leads
        const existingLeadResult = await client.query(
            "SELECT id, name, status FROM leads WHERE status != 'accounts_pending' LIMIT 1"
        );

        let leadId;
        let leadName;

        if (existingLeadResult.rows.length > 0) {
            // Update an existing lead
            const existingLead = existingLeadResult.rows[0];
            leadId = existingLead.id;
            leadName = existingLead.name;

            console.log(`\n✓ Found existing lead: ${leadName} (ID: ${leadId})`);
            console.log(`  Current status: ${existingLead.status}`);

            // Update the lead to accounts_pending
            await client.query(
                `UPDATE leads 
         SET status = 'accounts_pending', 
             email = COALESCE(email, 'test@example.com'),
             phone = COALESCE(phone, '1234567890'),
             walkin_date = COALESCE(walkin_date, CURRENT_DATE),
             walkin_time = COALESCE(walkin_time, '10:00'),
             registration_amount = COALESCE(registration_amount, 5000),
             updated_at = NOW()
         WHERE id = $1`,
                [leadId]
            );

            console.log(`✓ Updated lead to accounts_pending status`);

            // Create history entry
            await client.query(
                `INSERT INTO lead_history (lead_id, from_user_id, previous_status, new_status, change_reason, changed_by_user_id, changed_at)
         VALUES ($1, $2, $3, 'accounts_pending', 'Test data - Passed to Accounts', $2, NOW())`,
                [leadId, hrUser.id, existingLead.status]
            );

            console.log(`✓ Created lead_history entry`);

        } else {
            // Create a new test lead
            console.log('\n✓ No existing leads found. Creating new test lead...');

            const newLeadResult = await client.query(
                `INSERT INTO leads (
          name, email, phone, location, degree, domain, 
          session_days, walkin_date, walkin_time, timing,
          current_owner_id, status, registration_amount, category,
          created_at, updated_at
        ) VALUES (
          'Test Lead for Accounts',
          'testlead@example.com',
          '9876543210',
          'Test City',
          'B.Tech',
          'Computer Science',
          'M,W,F',
          CURRENT_DATE,
          '10:00',
          'Morning',
          NULL,
          'accounts_pending',
          5000,
          'Client Hiring',
          NOW(),
          NOW()
        ) RETURNING id, name`,
                []
            );

            leadId = newLeadResult.rows[0].id;
            leadName = newLeadResult.rows[0].name;

            console.log(`✓ Created new lead: ${leadName} (ID: ${leadId})`);

            // Create history entry
            await client.query(
                `INSERT INTO lead_history (lead_id, from_user_id, previous_status, new_status, change_reason, changed_by_user_id, changed_at)
         VALUES ($1, $2, 'new', 'accounts_pending', 'Test data - Passed to Accounts', $2, NOW())`,
                [leadId, hrUser.id]
            );

            console.log(`✓ Created lead_history entry`);
        }

        // Verify the lead is now visible
        const verifyResult = await client.query(
            'SELECT id, name, status, current_owner_id FROM leads WHERE status = $1',
            ['accounts_pending']
        );

        console.log(`\n✅ SUCCESS! Found ${verifyResult.rows.length} lead(s) with accounts_pending status:`);
        verifyResult.rows.forEach(lead => {
            console.log(`  - Lead #${lead.id}: ${lead.name} (Owner: ${lead.current_owner_id || 'NONE'})`);
        });

        console.log('\n📝 Next steps:');
        console.log('  1. Refresh your Accounts "My Leads" page in the browser');
        console.log('  2. You should now see the test lead');
        console.log('  3. HR users will also see this in "My Completion"');

    } catch (error) {
        console.error('❌ Error:', error.message);
        console.error(error.stack);
    } finally {
        await client.end();
    }
}

createTestAccountsLead();
