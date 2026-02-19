import "dotenv/config";
import { Pool } from 'pg';

async function verifyProductionDatabase() {
    if (!process.env.DATABASE_URL) {
        console.error("❌ DATABASE_URL is not set in .env");
        return;
    }

    console.log("Testing PRODUCTION database connection...\n");

    const pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false },
        connectionTimeoutMillis: 10000 // 10 second timeout
    });

    try {
        const client = await pool.connect();
        console.log("✅ Successfully connected to production database\n");

        // 1. Check if tables exist
        const tablesQuery = await client.query(`
      SELECT tablename FROM pg_catalog.pg_tables 
      WHERE schemaname = 'public' AND tablename IN ('classes', 'class_students', 'users')
      ORDER BY tablename;
    `);

        console.log("=== TABLES IN PRODUCTION DATABASE ===");
        console.table(tablesQuery.rows);

        if (tablesQuery.rows.length < 3) {
            console.error("\n❌ ERROR: Missing tables! Expected: classes, class_students, users");
            client.release();
            return;
        }

        // 2. Check classes table schema
        const classesSchema = await client.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'classes'
      ORDER BY ordinal_position;
    `);

        console.log("\n=== CLASSES TABLE SCHEMA ===");
        console.table(classesSchema.rows);

        // 3. Check for foreign key constraints
        const fkConstraints = await client.query(`
      SELECT
        tc.constraint_name,
        kcu.column_name,
        ccu.table_name AS foreign_table_name,
        ccu.column_name AS foreign_column_name
      FROM information_schema.table_constraints AS tc
      JOIN information_schema.key_column_usage AS kcu
        ON tc.constraint_name = kcu.constraint_name
      LEFT JOIN information_schema.constraint_column_usage AS ccu
        ON ccu.constraint_name = tc.constraint_name
      WHERE tc.table_name = 'classes' 
        AND tc.constraint_type = 'FOREIGN KEY';
    `);

        console.log("\n=== FOREIGN KEY CONSTRAINTS ON CLASSES ===");
        if (fkConstraints.rows.length === 0) {
            console.error("❌ ERROR: NO foreign key constraints found on classes table!");
            console.error("This is the problem! The instructor_id foreign key is missing.");
        } else {
            console.table(fkConstraints.rows);
            console.log("✅ Foreign key constraints exist");
        }

        // 4. Check if we can create a test class (dry run)
        const users = await client.query(`SELECT id, email, role FROM users WHERE role IN ('session-coordinator', 'manager', 'admin') LIMIT 1`);

        console.log("\n=== SAMPLE USER FOR TESTING ===");
        if (users.rows.length > 0) {
            console.table(users.rows);
            console.log(`✅ Found user with ID: ${users.rows[0].id} that can create classes`);
        } else {
            console.error("❌ No users with role 'session-coordinator', 'manager', or 'admin' found!");
        }

        client.release();
        console.log("\n✅ Database verification complete!");

    } catch (err: any) {
        console.error("\n❌ DATABASE CONNECTION ERROR:");
        console.error(err.message);
        if (err.code) console.error("Error code:", err.code);
    } finally {
        await pool.end();
    }
}

verifyProductionDatabase();
