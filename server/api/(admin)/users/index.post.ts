import { getTenantContext } from "~~/server/utils/getTenantContext"

export default defineEventHandler(async (event: any) => {
    const body = await readBody(event)
    const { email, password, full_name, role, status } = body

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

        if (patient) {
            patientId = patient.id
            medicalRecordNumber = patient.medical_record_number

            const patientUpdates: Record<string, any> = {}
            if (body.date_of_birth) patientUpdates.date_of_birth = body.date_of_birth
            if (body.gender) patientUpdates.gender = body.gender
            if (body.phone) patientUpdates.phone = body.phone
            if (body.blood_type) patientUpdates.blood_type = body.blood_type
            if (body.address) patientUpdates.address = body.address
            if (body.room) patientUpdates.room = body.room

            if (Object.keys(patientUpdates).length) {
                await admin.from('patients').update(patientUpdates).eq('id', patient.id)
            }
        }
    }

    if (role === 'doctor') {
        const doctorUpdates: Record<string, any> = { tenant_id: tenantId }
        if (body.department_id) doctorUpdates.department_id = body.department_id
        if (body.specialization) doctorUpdates.specialization = body.specialization
        if (body.str_number) doctorUpdates.str_number = body.str_number
        if (body.sip_number) doctorUpdates.sip_number = body.sip_number
        if (body.phone) doctorUpdates.phone = body.phone
        if (body.biography) doctorUpdates.biography = body.biography
        if (body.experience_years !== undefined) doctorUpdates.experience_years = body.experience_years
        if (body.consultation_fee !== undefined) doctorUpdates.consultation_fee = body.consultation_fee
        if (body.is_available !== undefined) doctorUpdates.is_available = body.is_available

        const { error: doctorUpdateError } = await admin
            .from('doctors')
            .update(doctorUpdates)
            .eq('id', userId)

        if (doctorUpdateError) {
            throw createError({ statusCode: 400, message: doctorUpdateError.message })
        }
    }

    if (role === 'nurse') {
        const { error: nurseInsertError } = await admin
            .from('nurses')
            .insert({
                id: userId,
                tenant_id: tenantId,
                department_id: body.department_id ?? null,
                phone: body.phone ?? null,
                experience_years: body.experience_years ?? 0,
                is_available: body.is_available ?? true,
            })

        if (nurseInsertError) {
            throw createError({ statusCode: 400, message: nurseInsertError.message })
        }
    }

    await admin.rpc('log_activity', {
        p_actor_id: user?.id,
        p_tenant_id: tenantId,
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
