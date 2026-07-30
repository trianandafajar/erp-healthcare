import { supabaseEphemeral } from "~~/server/utils/supabase"
import { setCookie, parseCookies } from "h3"

export default defineEventHandler(async (event) => {
    const { id, return_to } = await readBody(event)
    if (!id) throw createError({ statusCode: 400, message: 'User ID is required.' })

    const admin = supabaseAdmin()
    const supabase = serverSupabase(event)

    const { data: { user: actor } } = await supabase.auth.getUser()
    if (!actor) throw createError({ statusCode: 401, message: 'Unauthorized.' })

    if (actor.id === id) {
        throw createError({ statusCode: 400, message: 'You are already logged in as this user.' })
    }

    const { data: actorRoleRows } = await admin
        .from('user_roles')
        .select('roles(name)')
        .eq('user_id', actor.id)
        .returns<any[]>()

    const actorRoleName = actorRoleRows?.[0]?.roles?.name
    if (!['admin', 'superadmin'].includes(actorRoleName)) {
        throw createError({ statusCode: 403, message: 'Only admins can impersonate users.' })
    }

    const { data: targetUser, error: userError } = await admin.auth.admin.getUserById(id)
    if (userError || !targetUser.user) {
        throw createError({ statusCode: 404, message: 'User not found.' })
    }

    const email = targetUser.user.email!
    const targetName = targetUser.user.user_metadata?.full_name ?? "Super Admin"

    const { data: actorSession } = await supabase.auth.getSession()
    if (!actorSession.session) {
        throw createError({ statusCode: 500, message: 'No active session.' })
    }

    const { data: linkData, error: linkError } = await admin.auth.admin.generateLink({
        type: 'magiclink',
        email,
    })
    if (linkError || !linkData) {
        throw createError({ statusCode: 500, message: linkError?.message ?? 'Failed to generate impersonation link.' })
    }

    const exchangeClient = supabaseEphemeral()
    const { data: otpData, error: otpError } = await exchangeClient.auth.verifyOtp({
        type: 'magiclink',
        token_hash: linkData.properties.hashed_token,
    })
    if (otpError || !otpData.session) {
        throw createError({ statusCode: 500, message: otpError?.message ?? 'Failed to create impersonation session.' })
    }

    const cookies = parseCookies(event)

    const backupRaw = cookies.admin_session_backup_stack || '[]'
    const metaRaw = cookies.impersonation_meta_stack || '[]'

    let backupStack: { access_token: string; refresh_token: string }[] = []
    let metaStack: { name: string; role: string; by_role: string; return_to: string }[] = []
    try { backupStack = JSON.parse(backupRaw) } catch { backupStack = [] }
    try { metaStack = JSON.parse(metaRaw) } catch { metaStack = [] }

    backupStack.push({
        access_token: actorSession.session.access_token,
        refresh_token: actorSession.session.refresh_token,
    })
    metaStack.push({
        name: targetName,
        role: targetUser.user.user_metadata?.role ?? 'superadmin',
        by_role: actorRoleName,
        return_to: return_to ?? '',
    })

    const cookieOptions = {
        path: '/',
        secure: true,
        sameSite: 'lax' as const,
        maxAge: 60 * 60,
    }

    setCookie(event, 'admin_session_backup_stack', JSON.stringify(backupStack), {
        ...cookieOptions,
        httpOnly: true,
    })
    setCookie(event, 'impersonation_meta_stack', JSON.stringify(metaStack), {
        ...cookieOptions,
        httpOnly: false,
    })

    setCookie(event, 'admin_session_backup', '', { path: '/', maxAge: 0 })
    setCookie(event, 'impersonation_meta', '', { path: '/', maxAge: 0 })

    await supabase.auth.setSession({
        access_token: otpData.session.access_token,
        refresh_token: otpData.session.refresh_token,
    })

    await admin.rpc('log_activity', {
        p_actor_id: actor.id,
        p_action: 'impersonate',
        p_module: 'users',
        p_entity_id: id,
        p_description: `Admin impersonated user '${targetName}'`,
        p_metadata: { target_email: email }
    })

    return {
        name: targetName,
        role: targetUser.user.user_metadata?.role ?? '',
    }
})
