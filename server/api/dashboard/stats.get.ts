export default defineEventHandler(async () => {
    const admin = supabaseAdmin()

    const [
        { data: profiles },
        { count: totalPatients },
        { count: totalDoctors },
        { count: totalNurses },
        { count: totalDepartments },
    ] = await Promise.all([
        admin.from('profiles').select('id, created_at'),
        admin.from('patients').select('*', { count: 'exact', head: true }),
        admin.from('doctors').select('*', { count: 'exact', head: true }),
        admin.from('nurses').select('*', { count: 'exact', head: true }),
        admin.from('departments').select('*', { count: 'exact', head: true }),
    ])

    return {
        profiles: profiles ?? [],
        stats: {
            patients: totalPatients ?? 0,
            doctors: totalDoctors ?? 0,
            nurses: totalNurses ?? 0,
            departments: totalDepartments ?? 0,
        }
    }
})