import "dotenv/config";
import { Pool } from 'pg';

async function fixClassesTable() {
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
        console.log("Connected to database for fixing classes table.\n");

        // Drop the existing tables to recreate them properly
        console.log("Dropping existing tables...");
        await client.query(`DROP TABLE IF EXISTS class_students CASCADE;`);
        await client.query(`DROP TABLE IF EXISTS classes CASCADE;`);
        console.log("✓ Dropped existing tables\n");

        // Recreate classes table WITH foreign key constraint
        const createClassesSql = `
      CREATE TABLE IF NOT EXISTS classes (
        id SERIAL PRIMARY KEY,
        name text NOT NULL,
        subject text,
        mentor_email text,
        mode text,
        instructor_id text NOT NULL REFERENCES users(id),
        created_at timestamp DEFAULT CURRENT_TIMESTAMP
      )`;

        console.log("Creating 'classes' table with foreign key constraint...");
        await client.query(createClassesSql);
        console.log("✓ 'classes' table created with proper foreign key\n");

        // Recreate class_students table
        const createClassStudentsSql = `
      CREATE TABLE IF NOT EXISTS class_students (
        id SERIAL PRIMARY KEY,
        class_id integer NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
        lead_id integer NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
        joined_at timestamp DEFAULT CURRENT_TIMESTAMP
      )`;

        console.log("Creating 'class_students' table...");
        await client.query(createClassStudentsSql);
        console.log("✓ 'class_students' table created\n");

        // Verify the constraint was created
        const checkConstraint = await client.query(`
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
      WHERE tc.table_name = 'classes' AND tc.constraint_type = 'FOREIGN KEY';
    `);

        console.log("=== FOREIGN KEY CONSTRAINTS ON CLASSES TABLE ===");
        console.table(checkConstraint.rows);

        client.release();
        console.log("\n✓ All done! Classes table is now properly configured.");
    } catch (err) {
        console.error("Error fixing tables:", err);
    } finally {
        await pool.end();
    }
}

fixClassesTable();
