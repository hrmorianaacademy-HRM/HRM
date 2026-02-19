import 'dotenv/config';
import { pool } from './db';
import { storage } from './storage';

/**
 * Migration script to transfer all existing completed leads from HR users to Accounts users
 */
async function migrateCompletedLeads() {
    console.log('🔄 Starting migration: Transferring completed leads to Accounts...');

    try {
        // Get all accounts users
        const accountsUsers = await storage.getUsersByRole('accounts');

        if (!accountsUsers || accountsUsers.length === 0) {

            console.error('❌ No Accounts users found! Create at least one Accounts user first.');
            process.exit(1);
        }

        const accountsUser = accountsUsers[0];
        console.log(`✅ Found ${accountsUsers.length} Accounts user(s)`);
        console.log(`📝 Will assign leads to: ${accountsUser.email}`);

        // Get all HR users
        const hrUsers = await storage.getUsersByRole('hr');

        if (!hrUsers || hrUsers.length === 0) {
            console.log('⚠️ No HR users found.');
            process.exit(0);
        }

        // Find all completed leads owned by HR users OR already owned by Accounts using SQL
        const hrUserIds = hrUsers.map(hr => hr.id);
        const allRelevantUserIds = [...hrUserIds, accountsUser.id];


        // Query for completed leads owned by HR or Accounts
        const result = await pool.query(
            `SELECT * FROM leads 
       WHERE status = $1 
       AND "current_owner_id" = ANY($2)`,
            ['completed', allRelevantUserIds]
        );



        const leadsToTransfer = result.rows;
        console.log(`📊 Found ${leadsToTransfer.length} completed leads to transfer`);

        if (leadsToTransfer.length === 0) {
            console.log('✅ No leads need to be transferred!');
            process.exit(0);
        }

        // Transfer each lead
        let successCount = 0;
        for (const lead of leadsToTransfer) {
            try {
                console.log(`  🔄 Transferring Lead #${lead.id} (${lead.name})...`);

                // Update lead owner and set status to 'pending'
                await storage.updateLead(lead.id, {
                    currentOwnerId: accountsUser.id,
                    status: 'pending'
                });

                // Create history entry
                await storage.createLeadHistory({
                    leadId: lead.id,
                    fromUserId: lead.current_owner_id,
                    toUserId: accountsUser.id,
                    previousStatus: lead.status,
                    newStatus: 'pending',
                    changeReason: 'Migration: Auto-assigned to Accounts (Status: Pending)',
                    changeData: JSON.stringify({
                        action: 'migration_transfer',
                        date: new Date().toISOString(),
                        previousStatus: lead.status
                    }),
                    changedByUserId: accountsUser.id
                });

                successCount++;
                console.log(`  ✅ Lead #${lead.id} transferred`);
            } catch (error) {
                console.error(`  ❌ Failed Lead #${lead.id}:`, error);
            }
        }

        console.log(`\n✅ Migration complete! Transferred ${successCount}/${leadsToTransfer.length} leads`);
        process.exit(0);
    } catch (error) {
        console.error('❌ Migration failed:', error);
        process.exit(1);
    }
}

migrateCompletedLeads();
