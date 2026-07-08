<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { EyeInvisibleOutlined, EyeOutlined } from '@ant-design/icons-vue'

definePageMeta({
    layout: false,
    middleware: 'guest'
})

const route = useRoute()
const token = ref('')
const tokenValid = ref(false)
const tokenChecking = ref(true)
const tokenError = ref('')

const password = ref('')
const confirmPassword = ref('')
const showPassword = ref(false)
const showConfirmPassword = ref(false)
const isSubmitting = ref(false)
const apiError = ref('')
const isSuccess = ref(false)

// Verify token on mount
onMounted(async () => {
    token.value = route.query.token as string

    if (!token.value) {
        tokenError.value = 'Invalid reset link.'
        tokenChecking.value = false
        return
    }

    try {
        await $fetch('/api/auth/verify-reset-token', {
            method: 'POST',
            body: { token: token.value }
        })
        tokenValid.value = true
    } catch (err: any) {
        tokenError.value = err?.data?.message || 'Invalid or expired reset link.'
    } finally {
        tokenChecking.value = false
    }
})

const passwordRules = [
    (v: string) => !!v || 'Password is required',
    (v: string) => v.length >= 8 || 'Minimum 8 characters',
    (v: string) => v === v.trim() || 'Password cannot start or end with spaces',
    (v: string) => /[A-Z]/.test(v) || 'Must contain at least 1 uppercase letter',
    (v: string) => /[0-9]/.test(v) || 'Must contain at least 1 number',
    (v: string) => /[!@#$%^&*(),.?":{}|<>_\-+=~`[\]/;]/.test(v) || 'Must contain at least 1 special character (@ # $ etc.)',
]

const confirmRules = [
    (v: string) => !!v || 'Confirm password is required',
    (v: string) => v === password.value || 'Passwords do not match',
]

const passwordScore = computed(() => {
    const v = password.value
    if (!v) return 0

    let score = 0
    if (v.length >= 8) score++
    if (v.length >= 12) score++
    if (/[A-Z]/.test(v)) score++
    if (/[a-z]/.test(v)) score++
    if (/[0-9]/.test(v)) score++
    if (/[!@#$%^&*(),.?":{}|<>_\-+=~`[\]/;]/.test(v)) score++

    return score
})

const passwordStrength = computed(() => {
    const score = passwordScore.value

    if (!password.value) return { label: '', color: '', percent: 0 }
    if (score <= 2) return { label: 'Weak', color: 'error', percent: 33 }
    if (score <= 4) return { label: 'Medium', color: 'warning', percent: 66 }
    return { label: 'Strong', color: 'success', percent: 100 }
})

async function validate() {
    if (password.value !== confirmPassword.value) {
        apiError.value = 'Passwords do not match'
        return
    }

    isSubmitting.value = true
    apiError.value = ''

    try {
        await $fetch('/api/auth/reset-password', {
            method: 'POST',
            body: {
                token: token.value,
                password: password.value,
            }
        })

        isSuccess.value = true
        setTimeout(() => navigateTo('/login?reset=true'), 2000)
    } catch (err: any) {
        apiError.value = err?.data?.message || 'Password reset failed.'
    } finally {
        isSubmitting.value = false
    }
}
</script>

<template>
    <div class="d-flex justify-space-between align-center">
        <h3 class="text-h5 mb-0">Reset Password</h3>
        <NuxtLink to="/login" class="text-primary text-decoration-none">Back to Login</NuxtLink>
    </div>

    <div v-if="tokenChecking" class="mt-7 text-center">
        <v-progress-circular indeterminate color="primary" />
        <p class="mt-3 text-medium-emphasis">Validating reset link...</p>
    </div>
    <div v-else-if="tokenError" class="mt-7">
        <v-alert color="error" variant="tonal">{{ tokenError }}</v-alert>
        <v-btn to="/forgot-password" color="primary" variant="tonal" block class="mt-4">
            Request New Reset Link
        </v-btn>
    </div>
    <div v-else-if="isSuccess" class="mt-7">
        <v-alert color="success" variant="tonal">
            Password reset successful! Redirecting to login...
        </v-alert>
    </div>

    <!-- form -->
    <v-form v-else @submit.prevent="validate" class="mt-7 loginForm">
        <div class="mb-6">
            <v-label>New Password</v-label>
            <v-text-field v-model="password" placeholder="Enter your new password" :rules="passwordRules" required
                variant="outlined" color="primary" hide-details="auto" :type="showPassword ? 'text' : 'password'"
                class="mt-2">
                <template v-slot:append-inner>
                    <v-btn color="secondary" icon rounded variant="text" @click="showPassword = !showPassword">
                        <EyeInvisibleOutlined v-if="!showPassword"
                            :style="{ color: 'rgb(var(--v-theme-secondary))' }" />
                        <EyeOutlined v-else :style="{ color: 'rgb(var(--v-theme-secondary))' }" />
                    </v-btn>
                </template>
            </v-text-field>

            <div v-if="password" class="mt-2">
                <v-progress-linear :model-value="passwordStrength.percent" :color="passwordStrength.color" height="6"
                    rounded></v-progress-linear>
                <span class="text-caption font-weight-medium" :class="`text-${passwordStrength.color}`">
                    {{ passwordStrength.label }}
                </span>
            </div>
        </div>

        <div class="mb-6">
            <v-label>Confirm Password</v-label>
            <v-text-field v-model="confirmPassword" placeholder="Confirm your new password" :rules="confirmRules"
                required variant="outlined" color="primary" hide-details="auto"
                :type="showConfirmPassword ? 'text' : 'password'" class="mt-2">
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

        <div v-if="apiError" class="mt-4">
            <v-alert color="error" variant="tonal">{{ apiError }}</v-alert>
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