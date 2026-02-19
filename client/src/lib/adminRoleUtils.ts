// Utility functions for admin sub-role management

export function getAdminSubRole(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('adminSubRole');
}

export function setAdminSubRole(role: 'admin_organizer' | 'session_organizer'): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem('adminSubRole', role);
}

export function clearAdminSubRole(): void {
    if (typeof window === 'undefined') return;
    localStorage.removeItem('adminSubRole');
}

export function isAdminOrganizer(userRole?: string): boolean {
    if (userRole !== 'admin') return false;
    return getAdminSubRole() === 'admin_organizer';
}

export function isSessionOrganizer(userRole?: string): boolean {
    if (userRole !== 'admin') return false;
    return getAdminSubRole() === 'session_organizer';
}

export function hasManagerPermissions(userRole?: string): boolean {
    // Manager role always has manager permissions
    if (userRole === 'manager') return true;

    // Admin Organizer has manager-level permissions
    if (userRole === 'admin' && isAdminOrganizer(userRole)) return true;

    return false;
}

export function hasAccountsPermissions(userRole?: string): boolean {
    // Accounts role always has accounts permissions
    if (userRole === 'accounts') return true;

    // Session Coordinator role has accounts-level permissions
    if (userRole === 'session-coordinator') return true;

    // Session Organizer (admin sub-role) has accounts-level permissions
    if (userRole === 'admin' && isSessionOrganizer(userRole)) return true;

    return false;
}
