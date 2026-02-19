// This file was used for debugging and is no longer needed.
// It has been recreated to clear lint errors from your editor.
// You can safely delete this file.

interface Lead {
    id: number;
    name: string;
    status: string;
    currentOwnerId?: string;
}

export function debugLeads(leads: Lead[]): void {
    console.log('Debugging leads:');
    leads.forEach((l: Lead) => {
        console.log(`Lead #${l.id}: ${l.name} - ${l.status}`);
    });
}

export function filterLeadsByStatus(leads: Lead[], status: string): Lead[] {
    return leads.filter((l: Lead) => l.status === status);
}
