export default defineEventHandler(async () => {
    const admin = supabaseAdmin()

    const [
        { data: profiles },
        { count: totalPatients },
        { count: totalDoctors },
        { count: totalNurses },
        { count: totalDepartments },
        { data: userRoles },
    ] = await Promise.all([
        admin.from('profiles').select('id, created_at'),
        admin.from('patients').select('*', { count: 'exact', head: true }),
        admin.from('doctors').select('*', { count: 'exact', head: true }),
        admin.from('nurses').select('*', { count: 'exact', head: true }),
        admin.from('departments').select('*', { count: 'exact', head: true }),
        admin.from('user_roles').select('roles(name, label)').returns<any[]>(),
    ])

    const roleCounts: Record<string, { label: string, count: number }> = {}
    userRoles?.forEach((ur: any) => {
        const name = ur.roles?.name
        const label = ur.roles?.label
        if (!name) return
        if (!roleCounts[name]) roleCounts[name] = { label: label ?? name, count: 0 }
        roleCounts[name].count++
    })

    return {
        profiles: profiles ?? [],
        stats: {
            patients: totalPatients ?? 0,
            doctors: totalDoctors ?? 0,
            nurses: totalNurses ?? 0,
            departments: totalDepartments ?? 0,
        },
        roleCounts
    }
})