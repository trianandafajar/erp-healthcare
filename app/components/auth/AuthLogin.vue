<script setup lang="ts">
import { ref } from 'vue'

const checkbox = ref(false)
const showPassword = ref(false)
const password = ref('')
const email = ref('')
const isSubmitting = ref(false)
const apiError = ref('')

const passwordRules = [
    (v: string) => !!v || 'Password is required',
    (v: string) => v === v.trim() || 'Password cannot start or end with spaces',
]

const emailRules = [
    (v: string) => !!v.trim() || 'E-mail is required',
    (v: string) => {
        const trimmedEmail = v.trim()
        return !/\s/.test(trimmedEmail) || 'E-mail must not contain spaces'
    },
    (v: string) => /.+@.+\..+/.test(v.trim()) || 'E-mail must be valid'
]

async function validate() {
    isSubmitting.value = true
    apiError.value = ''

    try {
        await $fetch('/api/auth/login', {
            method: 'POST',
            body: {
                email: email.value.trim(),
                password: password.value
            }
        })

        const supabase = useSupabase()
        if (!supabase) {
            throw new Error('Supabase client is unavailable')
        }

        const { data: { user } } = await supabase.auth.getUser()

        const { data: roleData, error: roleError } = await supabase
            .from('user_roles')
            .select(`
                roles (
                    name,
                    label,
                    role_permissions (
                        permissions (
                            name,
                            module,
                            category
                        )
                    )
                )
            `)
            .eq('user_id', user!.id)
            .single()

        if (roleError) throw roleError

        const role = (roleData as any)?.roles?.name

        const permissions: string[] = (roleData as any)?.roles?.role_permissions
            ?.map((rp: any) => rp.permissions?.name)
            .filter(Boolean) ?? []

        const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('tenant_id, tenants(slug)')
            .eq('id', user!.id)
            .single()

        if (profileError || !profile?.tenant_id) {
            apiError.value = 'Your account is not yet linked to any tenant.'
            return
        }

        const tenantId = profile.tenant_id
        const tenantSlug = (profile as any).tenants?.slug

        if (!tenantSlug) {
            apiError.value = 'Tenant data is invalid.'
            return
        }

        const authStore = useAuthStore()
        authStore.setUser({
            user,
            role,
            permissions,
            tenantId,
            tenantSlug,
        })

        const redirectMap: Record<string, string> = {
            superadmin: 'superadmin/dashboard',
            admin: 'dashboard',
            doctor: 'doctor/dashboard',
            specialist: 'doctor/dashboard',
            pharmacy: 'pharmacy/dashboard',
            nurse: 'nurse/dashboard',
            receptionist: 'receptionist/dashboard',
            patient: 'patient/dashboard',
        }

        const path = redirectMap[role] ?? 'dashboard'
        await navigateTo(`/${tenantSlug}/${path}`)

    } catch (err: any) {
        apiError.value = err?.data?.message || err?.message || 'Login failed.'
    } finally {
        isSubmitting.value = false
    }
}
</script>

<template>
    <div class="d-flex justify-space-between align-center">
        <h3 class="text-h3 text-center mb-0">Login</h3>
        <NuxtLink to="/register" class="text-primary text-decoration-none">Don't Have an account?</NuxtLink>
    </div>

    <v-form @submit.prevent="validate" class="mt-7 loginForm">
        <div class="mb-6">
            <v-label>Email Address</v-label>
            <v-text-field aria-label="email address" v-model="email" :rules="emailRules" class="mt-2" required
                hide-details="auto" variant="outlined" color="primary"></v-text-field>
        </div>

        <div>
            <v-label>Password</v-label>
            <v-text-field aria-label="password" v-model="password" :rules="passwordRules" required variant="outlined"
                color="primary" hide-details="auto" :type="showPassword ? 'text' : 'password'" class="mt-2">
                <template v-slot:append-inner>
                    <span @click="showPassword = !showPassword"
                        style="cursor: pointer; display: flex; align-items: center; color: rgb(var(--v-theme-secondary))">
                        <EyeOutlined v-if="showPassword" />
                        <EyeInvisibleOutlined v-else />
                    </span>
                </template>
            </v-text-field>
        </div>

        <div class="d-flex align-center mt-4 mb-7 mb-sm-0">
            <v-checkbox v-model="checkbox" label="Keep me sign in" color="primary" class="ms-n2"
                hide-details></v-checkbox>
            <div class="ml-auto">
                <NuxtLink to="/forgot-password" class="text-darkText link-hover">Forgot Password?</NuxtLink>
            </div>
        </div>

        <v-btn color="primary" :loading="isSubmitting" block class="mt-5" variant="flat" size="large" type="submit">
            Login
        </v-btn>

        <div v-if="apiError" class="mt-2">
            <v-alert color="error">{{ apiError }}</v-alert>
        </div>
    </v-form>
</template>

<style lang="scss">
.loginForm {
    .v-text-field .v-field--active input {
        font-weight: 500;
    }
}
</style>
