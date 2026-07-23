import { parseCookies } from "h3"

export default defineEventHandler(async (event) => {
    const cookies = parseCookies(event)
    const backupCookie = cookies.admin_session_backup
    const metaRaw = cookies.impersonation_meta

    if (!backupCookie) {
        return { is_impersonating: false }
    }

    let meta = { name: '', role: '' }
    if (metaRaw) {
        try {
            meta = JSON.parse(metaRaw)
        } catch {}
    }

    return {
        is_impersonating: true,
        name: meta.name,
        role: meta.role,
    }
})
