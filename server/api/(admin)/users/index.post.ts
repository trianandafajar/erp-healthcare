import { getTenantContext } from "~~/server/utils/getTenantContext"

export default defineEventHandler(async (event: any) => {
    const { email, password, full_name, role, status } = await readBody(event)

    if (!email || !password || !full_name || !role) {
        throw createError({
            statusCode: 400,
            message: 'Email, password, full name, and role are required.',
        })
    }

    const { admin, tenantId, user } = await getTenantContext(event)

    const { data: foundRole, error: roleError } = await admin
        .from('roles')
        .select('id')
        .eq('name', role)
        .single()

    if (roleError || !foundRole) {
        throw createError({ statusCode: 400, message: `Role '${role}' not found` })
    }

    const { data, error } = await admin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { full_name, role },
    })

    if (error) throw createError({ statusCode: 400, message: error.message })

    const userId = data.user.id

    const { error: profileUpdateError } = await admin
        .from('profiles')
        .update({
            tenant_id: tenantId,
            ...(status && { status }),
        })
        .eq('id', userId)

    if (profileUpdateError) {
        throw createError({ statusCode: 400, message: profileUpdateError.message })
    }

    let patientId: string | null = null
    let medicalRecordNumber: string | null = null

    if (role === 'patient') {
        const { data: patient, error: patientUpdateError } = await admin
            .from('patients')
            .update({ tenant_id: tenantId })
            .eq('profile_id', userId)
            .select('id, medical_record_number')
            .single()

        if (patientUpdateError) {
            throw createError({ statusCode: 400, message: patientUpdateError.message })
        }
        patientId = patient?.id ?? null
        medicalRecordNumber = patient?.medical_record_number ?? null
    }

    if (role === 'doctor') {
        const { error: doctorUpdateError } = await admin
            .from('doctors')
            .update({ tenant_id: tenantId })
            .eq('id', userId)

        if (doctorUpdateError) {
            throw createError({ statusCode: 400, message: doctorUpdateError.message })
        }
    }

    await admin.rpc('log_activity', {
        p_actor_id: user?.id,
        p_action: 'create',
        p_module: 'users',
        p_entity_id: userId,
        p_description: `Created user '${full_name}' (${email}) with role '${role}'`,
        p_metadata: { after: { email, full_name, role, status } }
    })

    return {
        user: {
            ...data.user,
            ...(patientId && {
                id: patientId,
                medical_record_number: medicalRecordNumber,
            })
        }
    }
})