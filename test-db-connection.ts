import "dotenv/config";
import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from "./shared/schema";

async function testConnection() {
    if (!process.env.DATABASE_URL) {
        console.error("DATABASE_URL is not set in .env");
        return;
    }

    console.log("Testing connection to:", process.env.DATABASE_URL.split('@')[1]); // Hide credentials

    const pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false } // Common for Neon/Supabase
    });

    try {
        const client = await pool.connect();
        console.log("Successfully connected to the database.");

        const res = await client.query('SELECT tablename FROM pg_catalog.pg_tables WHERE schemaname = \'public\'');
        console.log("Tables in database:", res.rows.map(r => r.tablename));

        const tableNames = res.rows.map(r => r.tablename);
        const requiredTables = ['users', 'leads', 'classes', 'class_students'];

        for (const table of requiredTables) {
            if (tableNames.includes(table)) {
                console.log(`✓ Table '${table}' exists.`);
            } else {
                console.error(`✗ Table '${table}' is MISSING!`);
            }
        }

        client.release();
    } catch (err) {
        console.error("Connection error:", err);
    } finally {
        await pool.end();
    }
}

testConnection();
