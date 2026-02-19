// Run this script to push schema to production database
// Usage: DATABASE_URL="your_neon_connection_string" npx tsx push-schema.ts

import 'dotenv/config';
import { db } from './server/db';
import { sql } from 'drizzle-orm';

async function pushSchema() {
    console.log('Checking classes table schema...');

    try {
        // Check current columns in classes table
        const result = await db.execute(sql`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'classes'
      ORDER BY ordinal_position
    `);

        console.log('Current columns in classes table:');
        console.log(result.rows);

        // Add missing columns if they don't exist
        console.log('\nAdding missing columns...');

        // Add subject column
        try {
            await db.execute(sql`ALTER TABLE classes ADD COLUMN IF NOT EXISTS subject TEXT`);
            console.log('✓ Added subject column');
        } catch (e: any) {
            if (e.message.includes('already exists')) {
                console.log('  subject column already exists');
            } else {
                console.error('  Error adding subject:', e.message);
            }
        }

        // Add mentor_email column
        try {
            await db.execute(sql`ALTER TABLE classes ADD COLUMN IF NOT EXISTS mentor_email TEXT`);
            console.log('✓ Added mentor_email column');
        } catch (e: any) {
            if (e.message.includes('already exists')) {
                console.log('  mentor_email column already exists');
            } else {
                console.error('  Error adding mentor_email:', e.message);
            }
        }

        // Add mode column
        try {
            await db.execute(sql`ALTER TABLE classes ADD COLUMN IF NOT EXISTS mode TEXT`);
            console.log('✓ Added mode column');
        } catch (e: any) {
            if (e.message.includes('already exists')) {
                console.log('  mode column already exists');
            } else {
                console.error('  Error adding mode:', e.message);
            }
        }

        // Verify the changes
        const verifyResult = await db.execute(sql`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'classes'
      ORDER BY ordinal_position
    `);

        console.log('\nUpdated columns in classes table:');
        console.log(verifyResult.rows);

        console.log('\n✅ Schema migration complete!');

    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }

    process.exit(0);
}

pushSchema();
