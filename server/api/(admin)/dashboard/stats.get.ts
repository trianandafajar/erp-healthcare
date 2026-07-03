import { getTenantContext } from "~~/server/utils/getTenantContext"

export default defineEventHandler(async (event: any) => {
    const { admin, tenantId } = await getTenantContext(event)

    const [
        { data: profiles },
        { count: totalPatients },
        { count: totalDoctors },
        { count: totalNurses },
        { count: totalDepartments },
        { data: userRoles },
        { data: recentUsers },
    ] = await Promise.all([
        admin.from('profiles').select('id, created_at').eq('tenant_id', tenantId),
        admin.from('patients').select('*', { count: 'exact', head: true }).eq('tenant_id', tenantId),
        admin.from('doctors').select('*', { count: 'exact', head: true }).eq('tenant_id', tenantId),
        admin.from('nurses').select('*', { count: 'exact', head: true }).eq('tenant_id', tenantId),
        admin.from('departments').select('*', { count: 'exact', head: true }).eq('tenant_id', tenantId),
        admin.from('profiles').select('user_roles!inner(roles!inner(name, label))').eq('tenant_id', tenantId).returns<any[]>(),
        admin
            .from('profiles')
            .select('id, full_name, email, status, created_at, user_roles(roles(name, label))')
            .eq('tenant_id', tenantId)
            .order('created_at', { ascending: false })
            .limit(8)
            .returns<any[]>(),
    ])

    const roleCounts: Record<string, { label: string, count: number }> = {}
    userRoles?.forEach((profile: any) => {
        profile.user_roles?.forEach((ur: any) => {
            const name = ur.roles?.name
            const label = ur.roles?.label
            if (!name) return
            if (!roleCounts[name]) roleCounts[name] = { label: label ?? name, count: 0 }
            roleCounts[name].count++
        })
    })

    const recentActivity = (recentUsers ?? []).map((u: any) => ({
        id: u.id,
        full_name: u.full_name ?? '-',
        email: u.email ?? '-',
        status: u.status,
        role: u.user_roles?.[0]?.roles?.name ?? null,
        role_label: u.user_roles?.[0]?.roles?.label ?? '-',
        created_at: u.created_at
    }))

    return {
        profiles: profiles ?? [],
        stats: {
            patients: totalPatients ?? 0,
            doctors: totalDoctors ?? 0,
            nurses: totalNurses ?? 0,
            departments: totalDepartments ?? 0,
        },
        roleCounts,
        recentActivity
    }
})