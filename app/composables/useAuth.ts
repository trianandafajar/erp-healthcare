import type { User } from '@supabase/supabase-js'

export const useAuth = () => {
    const user = useState<User | null>('user', () => null)

    const getUser = async () => {
        if (import.meta.server) return null
        const supabase = useSupabase()
        if (!supabase) return null

        const { data } = await supabase.auth.getUser()
        user.value = data.user
        return data.user
    }

    const login = async (email: string, password: string) => {
        const supabase = useSupabase()
        if (!supabase) throw new Error('Cannot login on server side')

        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password
        })
        if (data.user) user.value = data.user
        return { data, error }
    }

    const logout = async () => {
        const supabase = useSupabase()
        if (!supabase) return

        await supabase.auth.signOut()
        user.value = null
    }

    return { user, login, logout, getUser }
}