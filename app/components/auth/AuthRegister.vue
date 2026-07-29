<script setup lang="ts">
import { ref, computed } from 'vue'
import { EyeInvisibleOutlined, EyeOutlined } from '@ant-design/icons-vue'

const firstname = ref('')
const lastname = ref('')
const email = ref('')
const password = ref('')
const confirmPassword = ref('')
const errorMsg = ref('')
const loading = ref(false)
const showPassword = ref(false)
const showConfirmPassword = ref(false)

const firstRules = [(v: string) => !!v || 'First name is required']
const lastRules = [(v: string) => !!v || 'Last name is required']

const passwordRules = [
    (v: string) => !!v || 'Password is required',
    (v: string) => v.length >= 8 || 'Minimum 8 characters',
    (v: string) => /[A-Z]/.test(v) || 'Must contain at least 1 uppercase letter',
    (v: string) => /[0-9]/.test(v) || 'Must contain at least 1 number',
    (v: string) => /[!@#$%^&*(),.?":{}|<>_\-+=~`[\]/;]/.test(v) || 'Must contain at least 1 special character (@ # $ etc.)',
]

const confirmPasswordRules = [
    (v: string) => !!v || 'Please confirm your password',
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
    if (score <= 4 || score <= 5) return { label: 'Medium', color: 'warning', percent: 66 }
    return { label: 'Strong', color: 'success', percent: 100 }
})

async function register() {
    if(passwordScore.value < 6) {
        errorMsg.value = 'Your password is not strong enough'
        return
    }
    if (password.value !== confirmPassword.value) {
        errorMsg.value = 'Passwords do not match'
        return
    }

    loading.value = true
    errorMsg.value = ''

    try {
        const res = await $fetch<{ redirect: string }>('/api/auth/register', {
            method: 'POST',
            body: {
                email: email.value,
                password: password.value,
                full_name: `${firstname.value} ${lastname.value}`,
            },
        })

        await navigateTo(res.redirect)
    } catch (err: any) {
        errorMsg.value = err.data?.message || 'Registration failed'
    } finally {
        loading.value = false
    }
}
</script>

<template>
    <div class="d-flex justify-space-between align-center">
        <h3 class="text-h3 text-center mb-0">Sign up</h3>
        <NuxtLink to="/login" class="text-primary text-decoration-none">Already have an account?</NuxtLink>
    </div>

    <v-alert v-if="errorMsg" type="error" class="mt-4">{{ errorMsg }}</v-alert>

    <v-form class="mt-7 loginForm">
        <v-row class="my-0">
            <v-col cols="12" sm="6" class="py-0">
                <div class="mb-6">
                    <AppLabel required>First Name</AppLabel>
                    <v-text-field v-model="firstname" :rules="firstRules" hide-details="auto" required
                        variant="outlined" class="mt-2" color="primary" placeholder="John"></v-text-field>
                </div>
            </v-col>
            <v-col cols="12" sm="6" class="py-0">
                <div class="mb-6">
                    <AppLabel required>Last Name</AppLabel>
                    <v-text-field v-model="lastname" :rules="lastRules" hide-details="auto" required variant="outlined"
                        class="mt-2" color="primary" placeholder="Doe"></v-text-field>
                </div>
            </v-col>
        </v-row>

        <div class="mb-6">
            <AppLabel required>Email Address</AppLabel>
            <v-text-field v-model="email" placeholder="demo@company.com" class="mt-2" required hide-details="auto"
                variant="outlined" color="primary" />
        </div>

        <div class="mb-6">
            <AppLabel required>Password</AppLabel>
            <v-text-field aria-label="password" placeholder="Enter your password" v-model="password" :rules="passwordRules" required variant="outlined"
                color="primary" hide-details="auto" :type="showPassword ? 'text' : 'password'" class="mt-2">
                <template v-slot:append-inner>
                    <span @click="showPassword = !showPassword"
                        style="cursor: pointer; display: flex; align-items: center; color: rgb(var(--v-theme-secondary))">
                        <EyeOutlined v-if="showPassword" />
                        <EyeInvisibleOutlined v-else />
                    </span>
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
            <AppLabel required>Confirm Password</AppLabel>
            <v-text-field aria-label="confirm password" placeholder="Confirm your password" v-model="confirmPassword" :rules="confirmPasswordRules" required
                variant="outlined" color="primary" hide-details="auto" :type="showConfirmPassword ? 'text' : 'password'"
                class="mt-2">
                <template v-slot:append-inner>
                    <span @click="showConfirmPassword = !showConfirmPassword"
                        style="cursor: pointer; display: flex; align-items: center; color: rgb(var(--v-theme-secondary))">
                        <EyeOutlined v-if="showConfirmPassword" />
                        <EyeInvisibleOutlined v-else />
                    </span>
                </template>
            </v-text-field>
        </div>

        <div class="d-sm-inline-flex align-center mt-2 mb-7 mb-sm-0 font-weight-bold">
            <h6 class="text-caption">
                By Signing up, you agree to our
                <NuxtLink to="/legal?page=terms" class="text-primary link-hover font-weight-medium">Terms of Service</NuxtLink>
                and
                <NuxtLink to="/legal?page=privacy" class="text-primary link-hover font-weight-medium">Privacy Policy</NuxtLink>
            </h6>
        </div>

        <v-btn color="primary" block class="mt-4" variant="flat" size="large" :loading="loading" @click="register">
            Create Account
        </v-btn>
    </v-form>
</template>
