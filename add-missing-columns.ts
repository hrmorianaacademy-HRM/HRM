import { db } from './server/db';
import { sql } from 'drizzle-orm';

async function addMissingColumns() {
    try {
        console.log('Adding missing columns to class_students table...');

        // Check if student_id column exists
        const checkStudentId = await db.execute(sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name='class_students' AND column_name='student_id'
    `);

        if ((checkStudentId as any).length === 0 || (checkStudentId as any).rows?.length === 0) {
            console.log('Adding student_id column...');
            await db.execute(sql`ALTER TABLE class_students ADD COLUMN IF NOT EXISTS student_id TEXT`);
            console.log('student_id column added!');
        } else {
            console.log('student_id column already exists');
        }

        // Check if joined_at column exists
        const checkJoinedAt = await db.execute(sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name='class_students' AND column_name='joined_at'
    `);

        if ((checkJoinedAt as any).length === 0 || (checkJoinedAt as any).rows?.length === 0) {
            console.log('Adding joined_at column...');
            await db.execute(sql`ALTER TABLE class_students ADD COLUMN IF NOT EXISTS joined_at TIMESTAMP DEFAULT NOW()`);
            console.log('joined_at column added!');
        } else {
            console.log('joined_at column already exists');
        }

        console.log('Done! Missing columns added successfully.');
        process.exit(0);
    } catch (error) {
        console.error('Error adding columns:', error);
        process.exit(1);
    }
}

addMissingColumns();
