export const ROLE_AREA_ROLES: Record<string, string[]> = {
    '/doctor': ['doctor', 'specialist'],
    '/nurse': ['nurse'],
    '/pharmacy': ['pharmacy'],
    '/receptionist': ['receptionist'],
    '/patient': ['patient'],
    '/super-admin': ['superadmin'],
}

export function getAllowedRolesForPath(path: string): string[] | null {
    for (const [prefix, roles] of Object.entries(ROLE_AREA_ROLES)) {
        if (path.startsWith(prefix)) return roles
    }
    return null
}
