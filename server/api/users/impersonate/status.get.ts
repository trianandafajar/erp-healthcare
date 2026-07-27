import { parseCookies } from "h3"

export default defineEventHandler(async (event) => {
    const cookies = parseCookies(event)
    const backupStackRaw = cookies.admin_session_backup_stack

    if (!backupStackRaw) {
        return { is_impersonating: false }
    }

    let backupStack: any[] = []
    let metaStack: any[] = []
    try { backupStack = JSON.parse(backupStackRaw) } catch {}
    try { metaStack = JSON.parse(cookies.impersonation_meta_stack || '[]') } catch {}

    if (backupStack.length === 0) {
        return { is_impersonating: false }
    }

    const current = metaStack.length > 0 ? metaStack[metaStack.length - 1] : { name: '', role: '' }

    return {
        is_impersonating: true,
        name: current.name ?? '',
        role: current.role ?? '',
    }
})
