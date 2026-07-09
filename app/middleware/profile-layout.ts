export default defineNuxtRouteMiddleware(() => {
    const authStore = useAuthStore()

    const layoutMap: Record<string, string> = {
        doctor: 'doctor',
        nurse: 'nurse',
        pharmacy: 'pharmacy',
        receptionist: 'receptionist',
        patient: 'patient',
        admin: 'default',
        superadmin: 'superadmin',
    }

    const layout = layoutMap[authStore.role ?? ''] ?? 'default'
    setPageLayout(layout as any)
})