<script setup lang="ts">
import { ref } from 'vue'

const valid = ref(false)
const email = ref('')
const isSubmitting = ref(false)
const apiError = ref('')
const isSuccess = ref(false)

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
    if (!email.value) return

    email.value = email.value.trim()
    isSubmitting.value = true
    apiError.value = ''
    isSuccess.value = false

    try {
        await $fetch('/api/auth/forgot-password', {
            method: 'POST',
            body: {
                email: email.value,
            },
        })

        isSuccess.value = true
    } catch (err: any) {
        apiError.value = err?.data?.message || err?.message || 'Failed to send reset email. Please try again.'
    } finally {
        isSubmitting.value = false
    }
}
</script>

<template>
    <div class="d-flex justify-space-between align-center">
        <h3 class="text-h5 mb-0">Forgot Password</h3>
        <NuxtLink to="/login" class="text-primary text-decoration-none">Back to Login?</NuxtLink>
    </div>

    <v-form @submit.prevent="validate" class="mt-7 loginForm">
        <div class="mb-6">
            <v-label>Email Address</v-label>
            <v-text-field aria-label="email address" placeholder="youremail@example.com" v-model="email" :rules="emailRules" class="mt-2" required
                hide-details="auto" variant="outlined" color="primary"></v-text-field>
        </div>

        <v-btn color="primary" :loading="isSubmitting" block class="mt-5" variant="flat" size="large" :disabled="valid"
            type="submit">
            Send Email
        </v-btn>

        <div v-if="isSuccess" class="mt-4">
            <v-alert color="success" variant="tonal">Reset link has been sent to your email address.</v-alert>
        </div>

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