import { db, leads } from "./server/storage";
import { sql } from "drizzle-orm";

async function checkLeads() {
    try {
        const allLeads = await db.select().from(leads);
        console.log("Total leads in DB:", allLeads.length);

        const readyForClass = allLeads.filter(l => l.status === 'ready_for_class');
        console.log("Leads with status 'ready_for_class':", readyForClass.length);

        readyForClass.forEach(l => {
            console.log(`ID: ${l.id}, Name: ${l.name}, Status: ${l.status}, OwnerID: ${l.currentOwnerId}`);
        });

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

checkLeads();
