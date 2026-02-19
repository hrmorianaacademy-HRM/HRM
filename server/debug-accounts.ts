import { db } from "./db";
import { sql } from "drizzle-orm";

export async function debugAccountsLeads() {
    console.log("\n=== DEBUG: Accounts Pending Leads ===");

    // Check all leads with accounts_pending status
    const accountsPendingLeads = await db.execute(
        sql`SELECT id, name, status, current_owner_id FROM leads WHERE status = 'accounts_pending'`
    );
    console.log(`\nFound ${accountsPendingLeads.rows.length} leads with accounts_pending status:`);
    accountsPendingLeads.rows.forEach((lead: any) => {
        console.log(`  - Lead #${lead.id}: ${lead.name} (owner: ${lead.current_owner_id || 'NONE'})`);
    });

    // Check lead_history for accounts_pending entries
    const historyEntries = await db.execute(
        sql`SELECT lead_id, new_status, changed_at, changed_by_user_id 
        FROM lead_history 
        WHERE new_status = 'accounts_pending' 
        ORDER BY changed_at DESC 
        LIMIT 5`
    );
    console.log(`\nRecent lead_history entries with accounts_pending status:`);
    historyEntries.rows.forEach((entry: any) => {
        console.log(`  - Lead #${entry.lead_id}: set to accounts_pending at ${entry.changed_at} by ${entry.changed_by_user_id}`);
    });

    // Check accounts users
    const accountsUsers = await db.execute(
        sql`SELECT id, full_name, email FROM users WHERE role = 'accounts'`
    );
    console.log(`\nAccounts users:`);
    accountsUsers.rows.forEach((user: any) => {
        console.log(`  - ${user.full_name} (${user.email}): ${user.id}`);
    });

    console.log("\n=== END DEBUG ===\n");
}
