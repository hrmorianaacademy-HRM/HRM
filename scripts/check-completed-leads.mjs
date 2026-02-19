import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const pool = new pg.Pool({
    connectionString: process.env.DATABASE_URL
});

async function checkCompletedLeads() {
    try {
        // Check lead history entries with 'completed' status
        const historyResult = await pool.query(`
      SELECT lead_id, from_user_id, changed_by_user_id, new_status, changed_at 
      FROM lead_history 
      WHERE new_status = 'completed' 
      ORDER BY changed_at DESC 
      LIMIT 10
    `);

        console.log('\n=== Lead History entries with status "completed" ===');
        console.log(`Found ${historyResult.rows.length} entries:`);
        console.log(JSON.stringify(historyResult.rows, null, 2));

        // Check all unique status values in leads table
        const statusResult = await pool.query(`
      SELECT status, COUNT(*) as count FROM leads GROUP BY status
    `);

        console.log('\n=== Lead Status Distribution ===');
        console.log(JSON.stringify(statusResult.rows, null, 2));

        // Check all unique new_status values in lead_history
        const historyStatusResult = await pool.query(`
      SELECT new_status, COUNT(*) as count FROM lead_history GROUP BY new_status
    `);

        console.log('\n=== Lead History new_status Distribution ===');
        console.log(JSON.stringify(historyStatusResult.rows, null, 2));

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await pool.end();
    }
}

checkCompletedLeads();
