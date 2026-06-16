import type { User } from '@supabase/supabase-js'

export const useAuth = () => {
    const user = useState<User | null>('user', () => null)
    const role = useState<{ userId: string | null; name: string | null }>('user-role-cache', () => ({
        userId: null,
        name: null,
    }))
    const userLoaded = useState('user-loaded', () => false)

    const getUser = async () => {
        if (userLoaded.value) {
            return user.value
        }

        const supabase = useSupabase()
        if (!supabase) return null

        const { data } = await supabase.auth.getUser()
        user.value = data.user
        userLoaded.value = true
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
        userLoaded.value = true
        role.value = {
            userId: data.user?.id ?? null,
            name: null,
        }
        return { data, error }
    }

    const logout = async () => {
        const supabase = useSupabase()
        if (!supabase) return

        await supabase.auth.signOut()
        user.value = null
        userLoaded.value = false
        role.value = {
            userId: null,
            name: null,
        }
    }

    return { user, role, userLoaded, login, logout, getUser }
}
