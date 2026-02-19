import "dotenv/config";
import { Pool } from 'pg';

async function checkClassesSchema() {
    if (!process.env.DATABASE_URL) {
        console.error("DATABASE_URL is not set in .env");
        return;
    }

    const pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false }
    });

    try {
        const client = await pool.connect();
        console.log("✓ Connected to database\n");

        // Check classes table structure
        const classesSchema = await client.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name = 'classes'
      ORDER BY ordinal_position;
    `);

        console.log("=== CLASSES TABLE SCHEMA ===");
        console.table(classesSchema.rows);

        // Check constraints
        const constraints = await client.query(`
      SELECT
        tc.constraint_name,
        tc.constraint_type,
        kcu.column_name,
        ccu.table_name AS foreign_table_name,
        ccu.column_name AS foreign_column_name
      FROM information_schema.table_constraints AS tc
      JOIN information_schema.key_column_usage AS kcu
        ON tc.constraint_name = kcu.constraint_name
      LEFT JOIN information_schema.constraint_column_usage AS ccu
        ON ccu.constraint_name = tc.constraint_name
      WHERE tc.table_name = 'classes';
    `);

        console.log("\n=== CLASSES TABLE CONSTRAINTS ===");
        console.table(constraints.rows);

        // Try to get a sample user ID
        const users = await client.query(`SELECT id, email, role FROM users LIMIT 5`);
        console.log("\n=== SAMPLE USERS (for testing instructor_id) ===");
        console.table(users.rows);

        client.release();
    } catch (err) {
        console.error("Error:", err);
    } finally {
        await pool.end();
    }
}

checkClassesSchema();
