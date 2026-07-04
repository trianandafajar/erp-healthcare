export const DASHBOARD_BY_ROLE: Record<string, string> = {
    admin: '/dashboard',
    superadmin: '/super-admin/dashboard',
    doctor: '/doctor/dashboard',
    specialist: '/doctor/dashboard',
    pharmacy: '/pharmacy/dashboard',
    nurse: '/nurse/dashboard',
    receptionist: '/receptionist/dashboard',
    patient: '/patient/dashboard',
}

export function getDashboardPath(role?: string | null): string {
    if (!role) return '/dashboard'
    return DASHBOARD_BY_ROLE[role] ?? '/dashboard'
}