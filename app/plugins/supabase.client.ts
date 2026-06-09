import { createBrowserClient } from '@supabase/ssr'

export default defineNuxtPlugin(() => {
    const config = useRuntimeConfig()

    const supabase = createBrowserClient(
        config.public.supabaseUrl as string,
        config.public.supabaseKey as string
    )

    return {
        provide: { supabase }
    }
})