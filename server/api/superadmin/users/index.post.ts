export default defineEventHandler(async (event) => {
    const { email, password, full_name, role, status, tenant_id } = await readBody(event)

    if (!email || !password || !full_name || !role || !tenant_id) {
        throw createError({
            statusCode: 400,
            message: 'Email, password, full name, role, and tenant are required.',
        })
    }

    const supabase = serverSupabase(event)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw createError({ statusCode: 401, message: 'Unauthorized' })

    const { data: userRoles } = await supabase
        .from('user_roles')
        .select('roles(name)')
        .eq('user_id', user.id)

    const isSuperadmin = userRoles?.some((r: any) => r.roles?.name === 'superadmin')
    if (!isSuperadmin) throw createError({ statusCode: 403, message: 'Forbidden' })

    const admin = supabaseAdmin()

    const { data: foundRole, error: roleError } = await admin
        .from('roles')
        .select('id')
        .eq('name', role)
        .single()

    if (roleError || !foundRole) {
        throw createError({ statusCode: 400, message: `Role '${role}' not found` })
    }

    const { data: authData, error: authError } = await admin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { full_name, role },
    })

    if (authError) throw createError({ statusCode: 400, message: authError.message })

    const userId = authData.user.id

    const { error: profileUpdateError } = await admin
        .from('profiles')
        .update({
            tenant_id,
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
            .update({ tenant_id })
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
            .update({ tenant_id })
            .eq('id', userId)

        if (doctorUpdateError) {
            throw createError({ statusCode: 400, message: doctorUpdateError.message })
        }
    }

    await admin.rpc('log_activity', {
        p_actor_id: user.id,
        p_action: 'create',
        p_module: 'users',
        p_entity_id: userId,
        p_description: `Created user '${full_name}' (${email}) with role '${role}' in tenant ${tenant_id}`,
        p_metadata: { after: { email, full_name, role, status, tenant_id } }
    })

    return {
        user: {
            ...authData.user,
            ...(patientId && {
                id: patientId,
                medical_record_number: medicalRecordNumber,
            })
        }
    }
})
