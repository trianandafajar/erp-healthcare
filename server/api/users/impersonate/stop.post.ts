import { parseCookies, setCookie } from "h3"

export default defineEventHandler(async (event) => {
    const cookies = parseCookies(event)
    const backupRaw = cookies.admin_session_backup
    if (!backupRaw) {
        throw createError({ statusCode: 400, message: 'No impersonation session found.' })
    }

    let backup: { access_token: string; refresh_token: string }
    try {
        backup = JSON.parse(backupRaw)
    } catch {
        throw createError({ statusCode: 400, message: 'Invalid impersonation session.' })
    }

    const supabase = serverSupabase(event)

    const { error } = await supabase.auth.setSession({
        access_token: backup.access_token,
        refresh_token: backup.refresh_token,
    })

    if (error) {
        throw createError({ statusCode: 500, message: error.message })
    }

    setCookie(event, 'admin_session_backup', '', { path: '/', maxAge: 0 })
    setCookie(event, 'impersonation_meta', '', { path: '/', maxAge: 0 })

    return { success: true }
})
