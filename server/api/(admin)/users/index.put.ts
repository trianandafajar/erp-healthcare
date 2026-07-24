import { getTenantContext } from "~~/server/utils/getTenantContext"

export default defineEventHandler(async (event: any) => {
    const body = await readBody(event)
    const { id, full_name, role, status } = body

    if (!id) {
        throw createError({ statusCode: 400, message: 'User ID is required' })
    }

    const { admin, tenantId, user } = await getTenantContext(event)

    const { data: before } = await admin
        .from('profiles')
        .select('full_name, status, email')
        .eq('id', id)
        .eq('tenant_id', tenantId)
        .single()

    if (role) {
        const { data: tenant } = await admin
            .from('tenants')
            .select('owner_id')
            .eq('id', tenantId)
            .single()

        if (tenant && tenant.owner_id === id) {
            const { data: currentRole } = await admin
                .from('user_roles')
                .select('roles(name)')
                .eq('user_id', id)
                .single()

            if (currentRole && currentRole.roles?.name !== role) {
                throw createError({ statusCode: 403, message: 'Cannot change the role of the tenant owner' })
            }
        }
    }

    const { error: authError } = await admin.auth.admin.updateUserById(id, {
        user_metadata: { full_name, role },
    })
    if (authError) throw createError({ statusCode: 400, message: authError.message })

    const { error: profileError } = await admin
        .from('profiles')
        .update({ full_name, status })
        .eq('id', id)
    if (profileError) throw createError({ statusCode: 400, message: profileError.message })

    if (role) {
        const { data: roleData, error: roleError } = await admin
            .from('roles')
            .select('id')
            .eq('name', role)
            .single()

        if (roleError || !roleData) {
            throw createError({ statusCode: 400, message: `Role '${role}' not found` })
        }

        await admin.from('user_roles').delete().eq('user_id', id)

        const { error: userRoleError } = await admin
            .from('user_roles')
            .insert({ user_id: id, role_id: roleData.id })

        if (userRoleError) {
            throw createError({ statusCode: 400, message: userRoleError.message })
        }
    }

    // Update role-specific tables
    if (role === 'doctor') {
        const doctorUpdates: Record<string, any> = {}
        if (body.department_id) doctorUpdates.department_id = body.department_id
        if (body.specialization) doctorUpdates.specialization = body.specialization
        if (body.str_number) doctorUpdates.str_number = body.str_number
        if (body.sip_number) doctorUpdates.sip_number = body.sip_number
        if (body.phone) doctorUpdates.phone = body.phone
        if (body.biography) doctorUpdates.biography = body.biography
        if (body.experience_years !== undefined) doctorUpdates.experience_years = body.experience_years
        if (body.consultation_fee !== undefined) doctorUpdates.consultation_fee = body.consultation_fee
        if (body.is_available !== undefined) doctorUpdates.is_available = body.is_available

        if (Object.keys(doctorUpdates).length) {
            const { error: doctorError } = await admin
                .from('doctors')
                .update(doctorUpdates)
                .eq('id', id)
            if (doctorError) throw createError({ statusCode: 400, message: doctorError.message })
        }
    }

    if (role === 'nurse') {
        const nurseUpdates: Record<string, any> = {}
        if (body.department_id) nurseUpdates.department_id = body.department_id
        if (body.phone) nurseUpdates.phone = body.phone
        if (body.experience_years !== undefined) nurseUpdates.experience_years = body.experience_years
        if (body.is_available !== undefined) nurseUpdates.is_available = body.is_available

        if (Object.keys(nurseUpdates).length) {
            const { error: nurseError } = await admin
                .from('nurses')
                .update(nurseUpdates)
                .eq('id', id)
            if (nurseError) throw createError({ statusCode: 400, message: nurseError.message })
        }
    }

    if (role === 'patient') {
        const patientUpdates: Record<string, any> = {}
        if (body.date_of_birth) patientUpdates.date_of_birth = body.date_of_birth
        if (body.gender) patientUpdates.gender = body.gender
        if (body.phone) patientUpdates.phone = body.phone
        if (body.blood_type) patientUpdates.blood_type = body.blood_type
        if (body.address) patientUpdates.address = body.address
        if (body.room) patientUpdates.room = body.room

        if (Object.keys(patientUpdates).length) {
            const { error: patientError } = await admin
                .from('patients')
                .update(patientUpdates)
                .eq('profile_id', id)
            if (patientError) throw createError({ statusCode: 400, message: patientError.message })
        }
    }

    await admin.rpc('log_activity', {
        p_actor_id: user?.id,
        p_tenant_id: tenantId,
        p_action: 'update',
        p_module: 'users',
        p_entity_id: id,
        p_description: `Updated user '${full_name ?? before?.full_name}' (${before?.email ?? '-'})`,
        p_metadata: {
            before: before ?? null,
            after: { full_name, role, status }
        }
    })

    return { message: 'User updated successfully' }
})
