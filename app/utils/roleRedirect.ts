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

export function getDashboardPath(role?: string | null, tenantSlug?: string | null): string | null {
    if (!role || !DASHBOARD_BY_ROLE[role]) return null
    const path = DASHBOARD_BY_ROLE[role]
    if (role === 'superadmin') return path
    if (tenantSlug) return `/${tenantSlug}${path}`
    return null
}