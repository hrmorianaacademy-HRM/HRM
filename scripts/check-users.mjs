import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const pool = new pg.Pool({
    connectionString: process.env.DATABASE_URL
});

async function checkUsers() {
    try {
        // Get all HR users
        const hrUsers = await pool.query(`
      SELECT id, email, full_name, role FROM users WHERE role = 'hr'
    `);

        console.log('\n=== HR Users ===');
        for (const user of hrUsers.rows) {
            console.log(`ID: ${user.id}, Email: ${user.email}, Name: ${user.full_name}`);
        }

        // Check lead history entries with 'completed' status and their users
        const historyResult = await pool.query(`
      SELECT lh.lead_id, lh.from_user_id, lh.changed_by_user_id, lh.new_status, 
             u1.email as from_user_email, u2.email as changed_by_email
      FROM lead_history lh
      LEFT JOIN users u1 ON lh.from_user_id = u1.id
      LEFT JOIN users u2 ON lh.changed_by_user_id = u2.id
      WHERE lh.new_status = 'completed' 
      ORDER BY lh.changed_at DESC 
      LIMIT 5
    `);

        console.log('\n=== Completed Lead History ===');
        for (const row of historyResult.rows) {
            console.log(`Lead ${row.lead_id}: from=${row.from_user_email || 'null'}, changedBy=${row.changed_by_email || 'null'}`);
        }

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await pool.end();
    }
}

checkUsers();
