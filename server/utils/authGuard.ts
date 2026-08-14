type GuardHandler = (event: any) => any | Promise<any>

export async function requireUser(event: any): Promise<{ user: any }> {
    const supabase = serverSupabase(event)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw createError({ statusCode: 401, message: 'Unauthorized' })
    return { user }
}

export async function requireRole(event: any, roles: string | string[]): Promise<{ user: any }> {
    const allowed = Array.isArray(roles) ? roles : [roles]
    const { user } = await requireUser(event)

    const supabase = serverSupabase(event)
    const { data: userRoles } = await supabase
        .from('user_roles')
        .select('roles(name)')
        .eq('user_id', user.id)

    const hasRole = userRoles?.some((r: any) => r.roles && allowed.includes(r.roles.name))
    if (!hasRole) throw createError({ statusCode: 403, message: 'Forbidden' })

    return { user }
}

export function withAuth<T extends GuardHandler>(handler: T): T {
    return defineEventHandler(async (event: any) => {
        const { user } = await requireUser(event)
        event.context.user = user
        return handler(event)
    }) as T
}

export function withRole(roles: string | string[]) {
    return <T extends GuardHandler>(handler: T): T => {
        return defineEventHandler(async (event: any) => {
            const { user } = await requireRole(event, roles)
            event.context.user = user
            return handler(event)
        }) as T
    }
}

export function withSuperadmin<T extends GuardHandler>(handler: T): T {
    return withRole('superadmin')(handler)
}