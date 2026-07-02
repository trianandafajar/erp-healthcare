<script setup lang="ts">
import { ref } from 'vue'
import { EyeInvisibleOutlined, EyeOutlined } from '@ant-design/icons-vue'

const firstname = ref('')
const lastname = ref('')
const email = ref('')
const password = ref('')
const confirmPassword = ref('')
const tenantName = ref('')
const errorMsg = ref('')
const loading = ref(false)
const showPassword = ref(false)
const showConfirmPassword = ref(false)

const firstRules = [(v: string) => !!v || 'First name is required']
const lastRules = [(v: string) => !!v || 'Last name is required']
const tenantRules = [(v: string) => !!v || 'The name of the clinic or hospital must be filled in.']

async function register() {
    if (password.value !== confirmPassword.value) {
        errorMsg.value = 'Password tidak sama'
        return
    }

    loading.value = true
    errorMsg.value = ''

    try {
        await $fetch('/api/auth/register', {
            method: 'POST',
            body: {
                email: email.value,
                password: password.value,
                full_name: `${firstname.value} ${lastname.value}`,
                tenant_name: tenantName.value,
            },
        })

        await navigateTo('/login')
    } catch (err: any) {
        errorMsg.value = err.data?.message || 'Register gagal'
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
                    <v-label>First Name*</v-label>
                    <v-text-field v-model="firstname" :rules="firstRules" hide-details="auto" required
                        variant="outlined" class="mt-2" color="primary" placeholder="John"></v-text-field>
                </div>
            </v-col>
            <v-col cols="12" sm="6" class="py-0">
                <div class="mb-6">
                    <v-label>Last Name*</v-label>
                    <v-text-field v-model="lastname" :rules="lastRules" hide-details="auto" required variant="outlined"
                        class="mt-2" color="primary" placeholder="Doe"></v-text-field>
                </div>
            </v-col>
        </v-row>

        <div class="mb-6">
            <v-label>Email Address*</v-label>
            <v-text-field v-model="email" placeholder="demo@company.com" class="mt-2" required hide-details="auto"
                variant="outlined" color="primary" />
        </div>

        <div class="mb-6">
            <v-label>Password</v-label>
            <v-text-field v-model="password" placeholder="*****" required variant="outlined" color="primary"
                hide-details="auto" :type="showPassword ? 'text' : 'password'" class="mt-2">
                <template v-slot:append-inner>
                    <v-btn color="secondary" icon rounded variant="text" @click="showPassword = !showPassword">
                        <EyeInvisibleOutlined v-if="!showPassword" />
                        <EyeOutlined v-else />
                    </v-btn>
                </template>
            </v-text-field>
        </div>

        <div class="mb-6">
            <v-label>Confirm Password</v-label>
            <v-text-field v-model="confirmPassword" placeholder="*****" required variant="outlined" color="primary"
                hide-details="auto" :type="showConfirmPassword ? 'text' : 'password'" class="mt-2">
                <template v-slot:append-inner>
                    <v-btn color="secondary" icon rounded variant="text"
                        @click="showConfirmPassword = !showConfirmPassword">
                        <EyeInvisibleOutlined v-if="!showConfirmPassword" />
                        <EyeOutlined v-else />
                    </v-btn>
                </template>
            </v-text-field>
        </div>

        <div class="mb-6">
            <v-label>Clinic / Hospital Name*</v-label>
            <v-text-field v-model="tenantName" :rules="tenantRules" placeholder="Enter the clinic name"
                hide-details="auto" required variant="outlined" color="primary" class="mt-2" />
        </div>

        <div class="d-sm-inline-flex align-center mt-2 mb-7 mb-sm-0 font-weight-bold">
            <h6 class="text-caption">
                By Signing up, you agree to our
                <NuxtLink to="/register" class="text-primary link-hover font-weight-medium">Terms of Service</NuxtLink>
                and
                <NuxtLink to="/register" class="text-primary link-hover font-weight-medium">Privacy Policy</NuxtLink>
            </h6>
        </div>

        <v-btn color="primary" block class="mt-4" variant="flat" size="large" :loading="loading" @click="register">
            Create Account
        </v-btn>
    </v-form>
</template>