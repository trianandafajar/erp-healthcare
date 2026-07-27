import { parseCookies, setCookie } from "h3"

export default defineEventHandler(async (event) => {
    const cookies = parseCookies(event)
    const backupRaw = cookies.admin_session_backup_stack
    if (!backupRaw) {
        throw createError({ statusCode: 400, message: 'No impersonation session found.' })
    }

    let backupStack: { access_token: string; refresh_token: string }[] = []
    let metaStack: any[] = []
    try { backupStack = JSON.parse(backupRaw) } catch { backupStack = [] }
    try { metaStack = JSON.parse(cookies.impersonation_meta_stack || '[]') } catch { metaStack = [] }

    if (backupStack.length === 0) {
        throw createError({ statusCode: 400, message: 'No impersonation session found.' })
    }

    const backup = backupStack.pop()!
    metaStack.pop()

    const supabase = serverSupabase(event)

    const { error } = await supabase.auth.setSession({
        access_token: backup.access_token,
        refresh_token: backup.refresh_token,
    })

    if (error) {
        throw createError({ statusCode: 500, message: error.message })
    }

    if (backupStack.length === 0) {
        setCookie(event, 'admin_session_backup_stack', '', { path: '/', maxAge: 0 })
        setCookie(event, 'impersonation_meta_stack', '', { path: '/', maxAge: 0 })
    } else {
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
    }

    setCookie(event, 'admin_session_backup', '', { path: '/', maxAge: 0 })
    setCookie(event, 'impersonation_meta', '', { path: '/', maxAge: 0 })

    return { success: true, access_token: backup.access_token, refresh_token: backup.refresh_token }
})
