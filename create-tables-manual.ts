import "dotenv/config";
import { Pool } from 'pg';

async function createMissingTables() {
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
        console.log("Connected to database for table creation.");

        const createClassesSql = `
      CREATE TABLE IF NOT EXISTS classes (
        id SERIAL PRIMARY KEY,
        name text NOT NULL,
        subject text,
        mentor_email text,
        mode text,
        instructor_id text NOT NULL,
        created_at timestamp DEFAULT CURRENT_TIMESTAMP
      )`;

        const createClassStudentsSql = `
      CREATE TABLE IF NOT EXISTS class_students (
        id SERIAL PRIMARY KEY,
        class_id integer NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
        lead_id integer NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
        joined_at timestamp DEFAULT CURRENT_TIMESTAMP
      )`;

        console.log("Creating 'classes' table...");
        await client.query(createClassesSql);
        console.log("✓ 'classes' table created or already exists.");

        console.log("Creating 'class_students' table...");
        await client.query(createClassStudentsSql);
        console.log("✓ 'class_students' table created or already exists.");

        client.release();
    } catch (err) {
        console.error("Error creating tables:", err);
    } finally {
        await pool.end();
    }
}

createMissingTables();
