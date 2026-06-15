import { createBrowserClient, createServerClient } from '@supabase/ssr'
import { setCookie } from 'h3'

type CookiePair = {
    name: string
    value: string
}

const safeDecode = (value: string) => {
    try {
        return decodeURIComponent(value)
    } catch {
        return value
    }
}

const parseCookieHeader = (cookieHeader: string | undefined): CookiePair[] => {
    if (!cookieHeader) return []

    return cookieHeader
        .split(';')
        .map((entry) => entry.trim())
        .filter(Boolean)
        .map((entry) => {
            const separatorIndex = entry.indexOf('=')
            const name = separatorIndex >= 0 ? entry.slice(0, separatorIndex) : entry
            const value = separatorIndex >= 0 ? entry.slice(separatorIndex + 1) : ''

            return {
                name: safeDecode(name),
                value: safeDecode(value),
            }
        })
}

export default defineNuxtPlugin(() => {
    const config = useRuntimeConfig()
    const supabaseUrl = config.public.supabaseUrl as string
    const supabaseKey = config.public.supabaseKey as string
    const requestEvent = import.meta.server ? useRequestEvent() : null
    const requestCookies = import.meta.server
        ? parseCookieHeader(useRequestHeaders(['cookie']).cookie)
        : []

    const supabase = import.meta.server
        ? createServerClient(supabaseUrl, supabaseKey, {
            cookies: {
                getAll() {
                    return requestCookies
                },
                setAll(cookies) {
                    if (!requestEvent) return

                    cookies.forEach(({ name, value, options }) => {
                        setCookie(requestEvent, name, value, {
                            path: '/',
                            ...(options as any),
                        } as any)
                    })
                },
            },
        })
        : createBrowserClient(supabaseUrl, supabaseKey)

    return {
        provide: { supabase },
    }
})
