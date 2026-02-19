import { db } from './server/db.js';
import { leads, leadHistory } from './shared/schema.js';

async function clearAllLeads() {
    try {
        console.log('Deleting all lead history...');
        const historyResult = await db.delete(leadHistory);
        console.log(`✅ Deleted lead history records`);

        console.log('Deleting all leads...');
        const leadsResult = await db.delete(leads);
        console.log(`✅ Deleted all leads`);

        console.log('\n✅ All leads and history cleared successfully!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error clearing leads:', error);
        process.exit(1);
    }
}

clearAllLeads();
