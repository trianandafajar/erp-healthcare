import { createServerClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'
import { parseCookies, setCookie } from 'h3'

declare const process: {
    env: {
        SUPABASE_URL?: string
        SUPABASE_KEY?: string
        SUPABASE_SERVICE_KEY?: string
    }
}

export const serverSupabase = (event: any) => {
    return createServerClient(
        process.env.SUPABASE_URL!,
        process.env.SUPABASE_KEY!,
        {
            cookies: {
                getAll() {
                    const cookies = parseCookies(event)
                    return Object.entries(cookies).map(([name, value]) => ({
                        name,
                        value: value ?? ''
                    }))
                },
                setAll(cookies) {
                    cookies.forEach(({ name, value, options }) => {
                        setCookie(event, name, value, options as any)
                    })
                }
            }
        }
    )
}

export const supabaseAdmin = () => {
    return createClient(
        process.env.SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_KEY!,
    )
}