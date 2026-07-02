import { getTenantContext } from "~~/server/utils/getTenantContext"

export default defineEventHandler(async (event: any) => {
    const { admin, tenantId, user } = await getTenantContext(event)

    const { data: profiles, error } = await admin
        .from('profiles')
        .select(`
        id,
        full_name,
        email,
        status,
        created_at,
        updated_at,
        user_roles (
            roles (
                name,
                label
            )
        )
    `)
        .eq('tenant_id', tenantId)
        .neq('id', user?.id)
        .returns<any[]>()

    if (error) {
        throw createError({ statusCode: 404, message: error.message })
    }

    // flatten role
    const result = profiles.map(p => ({
        ...p,
        role: p.user_roles?.[0]?.roles?.name ?? null,
        role_label: p.user_roles?.[0]?.roles?.label ?? null,
        user_roles: undefined
    }))

    return { profiles: result }
})