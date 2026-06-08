<script setup lang="ts">
import { ref } from 'vue'
import { EyeInvisibleOutlined, EyeOutlined } from '@ant-design/icons-vue'

const checkbox = ref(false)
const valid = ref(false)
const showPassword = ref(false)
const password = ref('')
const username = ref('')
const isSubmitting = ref(false)
const apiError = ref('')

// Password validation rules
const passwordRules = [
    (v: string) => !!v || 'Password is required',
    (v: string) => v === v.trim() || 'Password cannot start or end with spaces',
]

// Email validation rules
const emailRules = [
    (v: string) => !!v.trim() || 'E-mail is required',
    (v: string) => {
        const trimmedEmail = v.trim()
        return !/\s/.test(trimmedEmail) || 'E-mail must not contain spaces'
    },
    (v: string) => /.+@.+\..+/.test(v.trim()) || 'E-mail must be valid'
]

async function validate() {
    username.value = username.value.trim()

    isSubmitting.value = true
    apiError.value = ''

    try {
        const { session } = await $fetch('/api/auth/login', {
            method: 'POST',
            body: {
                email: username.value,
                password: password.value
            },
        })

        const token = useCookie('sb-token')
        token.value = session.access_token

        await navigateTo('/')
    } catch (err: any) {
        apiError.value = err.data?.message || 'Login failed. Please check your credentials.'
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
            <v-text-field aria-label="email address" v-model="username" :rules="emailRules" class="mt-2" required
                hide-details="auto" variant="outlined" color="primary"></v-text-field>
        </div>

        <div>
            <v-label>Password</v-label>
            <v-text-field aria-label="password" v-model="password" :rules="passwordRules" required variant="outlined"
                color="primary" hide-details="auto" :type="showPassword ? 'text' : 'password'" class="mt-2"
                @input="password">
                <template v-slot:append-inner>
                    <v-btn color="secondary" icon rounded variant="text">
                        <EyeInvisibleOutlined :style="{ color: 'rgb(var(--v-theme-secondary))' }"
                            v-if="showPassword == false" @click="showPassword = !showPassword" />
                        <EyeOutlined :style="{ color: 'rgb(var(--v-theme-secondary))' }" v-if="showPassword == true"
                            @click="showPassword = !showPassword" />
                    </v-btn>
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

        <v-btn color="primary" :loading="isSubmitting" block class="mt-5" variant="flat" size="large" :disabled="valid"
            type="submit">
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