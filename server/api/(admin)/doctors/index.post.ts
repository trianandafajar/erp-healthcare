import { getTenantContext } from "~~/server/utils/getTenantContext"

export default defineEventHandler(async (event: any) => {
  const {
    id,
    department_id,
    specialization,
    str_number,
    sip_number,
    phone,
    biography,
    experience_years,
    consultation_fee,
    is_available
  } = await readBody(event)

  if (!id) throw createError({ statusCode: 400, message: 'User ID is required' })

  const { admin, tenantId, user } = await getTenantContext(event)

  const { data: hasRole } = await admin
    .from('user_roles')
    .select('roles(name)')
    .eq('user_id', id)
    .returns<any[]>()

  const isDoctor = hasRole?.some((r: any) => r.roles?.name === 'doctor')
  if (!isDoctor) {
    throw createError({ statusCode: 400, message: 'User does not have doctor role' })
  }

  const { data, error } = await admin
    .from('doctors')
    .insert({
      id,
      department_id,
      specialization,
      str_number,
      sip_number,
      phone,
      biography,
      experience_years,
      consultation_fee,
      is_available: is_available ?? true,
      tenant_id: tenantId
    })
    .select()
    .single()

  if (error) throw createError({ statusCode: 400, message: error.message })

  await admin.rpc('log_activity', {
    p_actor_id: user?.id,
    p_action: 'create',
    p_module: 'doctors',
    p_entity_id: data.id,
    p_description: `Created doctor profile for ${specialization ?? 'a doctor'}`,
    p_metadata: null
  })

  return { doctor: data }
})