import { db } from './server/db.js';
import { leads } from './shared/schema.js';
import { isNull, or, eq } from 'drizzle-orm';

async function updateLeadsCategory() {
    try {
        console.log('Updating leads without category to "Client Hiring"...');

        const result = await db
            .update(leads)
            .set({ category: 'Client Hiring' })
            .where(or(isNull(leads.category), eq(leads.category, '')))
            .returning();

        console.log(`✅ Updated ${result.length} leads to have "Client Hiring" category`);
        process.exit(0);
    } catch (error) {
        console.error('❌ Error updating leads:', error);
        process.exit(1);
    }
}

updateLeadsCategory();
