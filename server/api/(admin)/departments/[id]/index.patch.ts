import { getTenantContext } from "~~/server/utils/getTenantContext"

export default defineEventHandler(async (event: any) => {
    const { admin, tenantId } = await getTenantContext(event)
    const departmentId = getRouterParam(event, 'id')

    if (!departmentId) throw createError({ statusCode: 400, message: 'Department ID is required' })

    const body = await readBody(event)
    const updates: Record<string, any> = { updated_at: new Date().toISOString() }

    if (body.name !== undefined) updates.name = body.name
    if (body.code !== undefined) updates.code = body.code || null
    if (body.description !== undefined) updates.description = body.description || null

    const { data, error } = await admin
        .from('departments')
        .update(updates)
        .eq('id', departmentId)
        .select()
        .single()
        .returns<any>()

    if (error) throw createError({ statusCode: 400, message: error.message })
    if (!data) throw createError({ statusCode: 404, message: 'Department not found' })

    return { data }
})