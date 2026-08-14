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
  checkFormat(isUUID(id), 'ID', 'UUID')
  if (department_id !== undefined && department_id !== null) {
    checkFormat(isUUID(department_id), 'department_id', 'UUID')
  }

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

  const experienceYears = experience_years !== undefined && experience_years !== null
    ? toRequiredNumber(experience_years, 'experience_years')
    : null
  const consultationFee = consultation_fee !== undefined && consultation_fee !== null
    ? toRequiredNumber(consultation_fee, 'consultation_fee')
    : null

  if (experienceYears !== null) checkField(isInt(experienceYears, { min: 0, max: 100 }), 'Experience years must be a valid integer')
  if (consultationFee !== null) checkField(consultationFee >= 0, 'Consultation fee must be a non-negative number')
  if (is_available !== undefined && is_available !== null) {
    checkField(typeof is_available === 'boolean', 'is_available must be a boolean')
  }

  const { data, error } = await admin
    .from('doctors')
    .upsert({
      id,
      department_id,
      specialization,
      str_number,
      sip_number,
      phone,
      biography,
      experience_years: experienceYears,
      consultation_fee: consultationFee,
      is_available: is_available ?? true,
      tenant_id: tenantId
    }, { onConflict: 'id' })
    .select()
    .single()

  if (error) throw createError({ statusCode: 400, message: error.message })

  await admin.rpc('log_activity', {
    p_actor_id: user?.id,
    p_tenant_id: tenantId,
    p_action: 'create',
    p_module: 'doctors',
    p_entity_id: data.id,
    p_description: `Created doctor profile for ${specialization ?? 'a doctor'}`,
    p_metadata: null
  })

  return { doctor: data }
})