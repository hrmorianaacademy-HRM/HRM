import "dotenv/config";
import { Pool } from 'pg';

async function checkAdminUser() {
    if (!process.env.DATABASE_URL) {
        console.error("DATABASE_URL is not set in .env");
        return;
    }

    const pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false },
        connectionTimeoutMillis: 10000
    });

    try {
        const client = await pool.connect();
        console.log("✅ Connected to database\n");

        // Check for admin users
        const admins = await client.query(`
      SELECT id, email, role, first_name, last_name, is_active 
      FROM users 
      WHERE role = 'admin' OR email LIKE '%mathesh%' OR email LIKE '%vcodez%'
      ORDER BY email;
    `);

        console.log("=== ADMIN AND RELATED USERS ===");
        console.table(admins.rows);

        if (admins.rows.length === 0) {
            console.error("❌ No admin users found!");
        } else {
            console.log(`\n✅ Found ${admins.rows.length} matching user(s)`);

            // Check if any have valid UUIDs
            for (const user of admins.rows) {
                const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
                if (uuidPattern.test(user.id)) {
                    console.log(`✅ User ${user.email} has valid UUID: ${user.id}`);
                } else {
                    console.log(`⚠️ User ${user.email} has NON-UUID ID: ${user.id}`);
                }
            }
        }

        // Also check the manager user
        const manager = await client.query(`
      SELECT id, email, role, first_name, last_name, is_active 
      FROM users 
      WHERE email = 'vcodezmanager@gmail.com';
    `);

        console.log("\n=== MANAGER USER ===");
        if (manager.rows.length > 0) {
            console.table(manager.rows);
        } else {
            console.error("❌ Manager user 'vcodezmanager@gmail.com' NOT FOUND in database!");
        }

        client.release();
    } catch (err: any) {
        console.error("Database error:", err.message);
    } finally {
        await pool.end();
    }
}

checkAdminUser();
