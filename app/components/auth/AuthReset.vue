<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { EyeInvisibleOutlined, EyeOutlined } from '@ant-design/icons-vue'

definePageMeta({
    layout: false,
    middleware: 'guest'
})

const password = ref('')
const confirmPassword = ref('')
const showPassword = ref(false)
const showConfirmPassword = ref(false)
const isSubmitting = ref(false)
const apiError = ref('')

onMounted(async () => {
    const supabase = useSupabase()
    if (!supabase) return navigateTo('/forgot-password')

    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return navigateTo('/forgot-password')
})

const passwordRules = [
    (v: string) => !!v || 'Password is required',
    (v: string) => v.length >= 8 || 'Password of at least 8 characters',
    (v: string) => v === v.trim() || 'Password cannot start or end with spaces',
]

const confirmRules = [
    (v: string) => !!v || 'Confirm password is required',
    (v: string) => v === password.value || 'Passwords are not the same',
]

async function validate() {
    if (password.value !== confirmPassword.value) {
        apiError.value = 'Passwords are not the same'
        return
    }

    isSubmitting.value = true
    apiError.value = ''

    try {
        const supabase = useSupabase()
        if (!supabase) throw new Error('Supabase not available')

        const { error } = await supabase.auth.updateUser({
            password: password.value
        })

        if (error) {
            apiError.value = error.message
            return
        }

        await supabase.auth.signOut()
        await navigateTo('/login?reset=true')
    } catch (err: any) {
        apiError.value = err.message || 'Password reset failed.'
    } finally {
        isSubmitting.value = false
    }
}
</script>

<template>
    <div class="d-flex justify-space-between align-center">
        <h3 class="text-h3 text-center mb-0">Reset Password</h3>
        <NuxtLink to="/login" class="text-primary text-decoration-none">Back to Login</NuxtLink>
    </div>

    <v-form @submit.prevent="validate" class="mt-7 loginForm">
        <div class="mb-6">
            <v-label>New Password</v-label>
            <v-text-field v-model="password" :rules="passwordRules" required variant="outlined" color="primary"
                hide-details="auto" :type="showPassword ? 'text' : 'password'" class="mt-2">
                <template v-slot:append-inner>
                    <v-btn color="secondary" icon rounded variant="text" @click="showPassword = !showPassword">
                        <EyeInvisibleOutlined v-if="!showPassword"
                            :style="{ color: 'rgb(var(--v-theme-secondary))' }" />
                        <EyeOutlined v-else :style="{ color: 'rgb(var(--v-theme-secondary))' }" />
                    </v-btn>
                </template>
            </v-text-field>
        </div>

        <div class="mb-6">
            <v-label>Confirm Password</v-label>
            <v-text-field v-model="confirmPassword" :rules="confirmRules" required variant="outlined" color="primary"
                hide-details="auto" :type="showConfirmPassword ? 'text' : 'password'" class="mt-2">
                <template v-slot:append-inner>
                    <v-btn color="secondary" icon rounded variant="text"
                        @click="showConfirmPassword = !showConfirmPassword">
                        <EyeInvisibleOutlined v-if="!showConfirmPassword"
                            :style="{ color: 'rgb(var(--v-theme-secondary))' }" />
                        <EyeOutlined v-else :style="{ color: 'rgb(var(--v-theme-secondary))' }" />
                    </v-btn>
                </template>
            </v-text-field>
        </div>

        <v-btn color="primary" :loading="isSubmitting" block class="mt-5" variant="flat" size="large" type="submit">
            Reset Password
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