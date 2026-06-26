export default defineEventHandler(async (event) => {
    const { email, password, full_name, role, status } = await readBody(event)

    if (!email || !password || !full_name) {
        throw createError({
            statusCode: 400,
            message: 'Email, password, and full name are required.',
        })
    }

    const admin = supabaseAdmin()
    const supabase = serverSupabase(event)
    const { data: { user } } = await supabase.auth.getUser()

    if (role) {
        const { data: foundRole, error: roleError } = await admin
            .from('roles')
            .select('id')
            .eq('name', role)
            .single()

        if (roleError || !foundRole) {
            throw createError({ statusCode: 400, message: `Role '${role}' not found` })
        }
    }

    const { data, error } = await admin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { full_name, role },
    })

    if (error) throw createError({ statusCode: 400, message: error.message })

    const userId = data.user.id

    if (status) {
        await admin.from('profiles').update({ status }).eq('id', userId)
    }

    let patientId = null
    if (role === 'patient') {
        const { data: patient } = await admin
            .from('patients')
            .select('id, medical_record_number')
            .eq('profile_id', userId)
            .single()

        patientId = patient?.id ?? null
    }


    await admin.rpc('log_activity', {
        p_actor_id: user?.id,
        p_action: 'create',
        p_module: 'users',
        p_entity_id: userId,
        p_description: `Created user '${full_name}' (${email}) with role '${role ?? '-'}'`,
        p_metadata: { after: { email, full_name, role, status } }
    })

    return {
        user: {
            ...data.user,
            ...(patientId && {
                id: patientId,
                medical_record_number: patientId?.medical_record_number
            })
        }
    }
})