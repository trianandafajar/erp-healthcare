import { supabaseEphemeral } from "~~/server/utils/supabase"

export default defineEventHandler(async (event) => {
    const config = useRuntimeConfig()

    if (!config.instantSuperadminLogin) {
        throw createError({ statusCode: 404, message: 'Not found.' })
    }

    const email = config.superadminEmail?.trim().toLowerCase()
    if (!email) {
        throw createError({ statusCode: 500, message: 'SUPERADMIN_EMAIL is not configured.' })
    }

    const admin = supabaseAdmin()
    const supabase = serverSupabase(event)

    const { data: { users }, error: listError } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 })
    const targetUser = users?.find((u) => u.email?.toLowerCase() === email && !u.banned_at)

    if (listError || !targetUser) {
        throw createError({ statusCode: 404, message: 'Superadmin user not found.' })
    }

    const { data: userRoleRows } = await admin
        .from('user_roles')
        .select('roles(name)')
        .eq('user_id', targetUser.id)
        .returns<any[]>()

    const isSuperadmin = userRoleRows?.some((r: any) => r.roles?.name === 'superadmin')
    if (!isSuperadmin) {
        throw createError({ statusCode: 403, message: 'User is not a superadmin.' })
    }

    const { data: linkData, error: linkError } = await admin.auth.admin.generateLink({
        type: 'magiclink',
        email,
    })
    if (linkError || !linkData) {
        throw createError({ statusCode: 500, message: linkError?.message ?? 'Failed to create instant login session.' })
    }

    const { data: otpData, error: otpError } = await supabaseEphemeral().auth.verifyOtp({
        type: 'magiclink',
        token_hash: linkData.properties.hashed_token,
    })
    if (otpError || !otpData.session) {
        throw createError({ statusCode: 500, message: otpError?.message ?? 'Failed to create instant login session.' })
    }

    await supabase.auth.setSession({
        access_token: otpData.session.access_token,
        refresh_token: otpData.session.refresh_token,
    })

    return {
        user: { id: targetUser.id, email: targetUser.email },
        role: 'superadmin',
    }
})