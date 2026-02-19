import "dotenv/config";
import { Pool } from 'pg';

async function checkUsers() {
    const pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false }
    });

    try {
        const client = await pool.connect();

        // Check for all users
        const result = await client.query(`
      SELECT id, email, role FROM users ORDER BY role, email;
    `);

        console.log("ALL USERS:");
        for (const row of result.rows) {
            console.log(`  ${row.role.padEnd(12)} | ${row.email.padEnd(35)} | ID: ${row.id}`);
        }

        // Check specifically for mathesh
        const mathesh = await client.query(`
      SELECT * FROM users WHERE email LIKE '%mathesh%';
    `);

        console.log("\nMATHESH USER:");
        if (mathesh.rows.length > 0) {
            console.log(JSON.stringify(mathesh.rows[0], null, 2));
        } else {
            console.log("NOT FOUND!");
        }

        client.release();
    } catch (err: any) {
        console.error("Error:", err.message);
    } finally {
        await pool.end();
    }
}

checkUsers();
