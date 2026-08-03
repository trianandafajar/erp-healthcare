<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'

const route = useRoute()
const router = useRouter()

const email = ref('')
const otp = ref(['', '', '', '', '', ''])
const loading = ref(false)
const resending = ref(false)
const errorMsg = ref('')
const successMsg = ref('')
const cooldown = ref(0)
const canResend = computed(() => cooldown.value === 0 && !resending.value)

let cooldownTimer: NodeJS.Timeout | null = null

onMounted(async () => {
    const queryEmail = route.query.email as string
    if (queryEmail) {
        email.value = queryEmail
        cooldown.value = 30
        if (route.query.from === 'login') {
            try {
                await $fetch('/api/auth/send-verification-otp', {
                    method: 'POST',
                    body: { email: email.value },
                })
            } catch (err: any) {
                if (err?.data?.message !== 'Email already verified') {
                    errorMsg.value = err?.data?.message || 'Failed to send verification code'
                }
            }
        }
    } else {
        errorMsg.value = 'No email provided'
    }
})

watch(cooldown, (val) => {
    if (val > 0) {
        cooldownTimer = setTimeout(() => cooldown.value--, 1000)
    }
})

onUnmounted(() => {
    if (cooldownTimer) clearTimeout(cooldownTimer)
})

const otpValue = computed(() => otp.value.join(''))
const isValid = computed(() => otpValue.value.length === 6)

function onOtpInput(index: number) {
    if (otp.value[index] && index < 5) {
        const next = (document.querySelector(`[data-otp-index="${index + 1}"]`) as HTMLInputElement)
        next?.focus()
    }
}

function onOtpKeydown(index: number, e: KeyboardEvent) {
    if (e.key === 'Backspace' && !otp.value[index] && index > 0) {
        const prev = (document.querySelector(`[data-otp-index="${index - 1}"]`) as HTMLInputElement)
        prev?.focus()
    }
}

function onOtpPaste(e: ClipboardEvent) {
    const pasted = e.clipboardData?.getData('text') ?? ''
    const digits = pasted.replace(/\D/g, '').slice(0, 6).split('')
    digits.forEach((d, i) => {
        if (i < 6) otp.value[i] = d
    })
    const last = Math.min(digits.length, 5)
    const el = (document.querySelector(`[data-otp-index="${last}"]`) as HTMLInputElement)
    el?.focus()
}

async function verify() {
    if (!isValid.value || !email.value) return
    loading.value = true
    errorMsg.value = ''

    try {
        await $fetch('/api/auth/verify-email-otp', {
            method: 'POST',
            body: { email: email.value, otp: otpValue.value },
        })
        successMsg.value = 'Email verified successfully!'
        setTimeout(() => router.push('/login?verified=true'), 1500)
    } catch (err: any) {
        errorMsg.value = err?.data?.message || 'Verification failed'
        otp.value = ['', '', '', '', '', '']
        const first = document.querySelector('[data-otp-index="0"]') as HTMLInputElement
        first?.focus()
    } finally {
        loading.value = false
    }
}

async function resendOtp() {
    if (!canResend.value || !email.value) return
    resending.value = true
    errorMsg.value = ''

    try {
        await $fetch('/api/auth/send-verification-otp', {
            method: 'POST',
            body: { email: email.value },
        })
        cooldown.value = 30
        otp.value = ['', '', '', '', '', '']
    } catch (err: any) {
        errorMsg.value = err?.data?.message || 'Failed to resend code'
    } finally {
        resending.value = false
    }
}
</script>

<template>
    <div>
        <h3 class="text-h3 text-center mb-1">Verify Your Email</h3>
        <p class="text-body-2 text-medium-emphasis text-center mb-6">
            Enter the 6-digit code sent to <strong>{{ email }}</strong>
        </p>

        <v-alert v-if="successMsg" type="success" class="mb-4">{{ successMsg }}</v-alert>
        <v-alert v-if="errorMsg" type="error" class="mb-4">{{ errorMsg }}</v-alert>

        <div class="d-flex justify-center ga-2 mb-6">
            <input v-for="(digit, i) in 6" :key="i"
                v-model="otp[i]"
                :data-otp-index="i"
                type="text"
                inputmode="numeric"
                maxlength="1"
                class="otp-input"
                :class="{ filled: otp[i] }"
                @input="onOtpInput(i)"
                @keydown="onOtpKeydown(i, $event)"
                @paste="i === 0 && onOtpPaste($event)"
            />
        </div>

        <v-btn color="primary" block variant="flat" size="large" :loading="loading"
            :disabled="!isValid || loading" @click="verify">
            Verify Email
        </v-btn>

        <div class="text-center mt-4">
            <span class="text-body-2 text-medium-emphasis">Didn't receive the code? </span>
            <button v-if="canResend" class="text-primary text-body-2 font-weight-medium bg-transparent border-none"
                style="cursor:pointer;text-decoration:underline;" @click="resendOtp">
                Resend
            </button>
            <span v-else class="text-body-2 text-medium-emphasis">
                Resend in {{ cooldown }}s
            </span>
        </div>

        <div class="text-center mt-2">
            <NuxtLink to="/login" class="text-primary text-body-2">Back to Login</NuxtLink>
        </div>
    </div>
</template>

<style scoped>
.otp-input {
    width: 48px;
    height: 56px;
    text-align: center;
    font-size: 24px;
    font-weight: 700;
    font-family: monospace;
    border: 2px solid #dadce0;
    border-radius: 8px;
    outline: none;
    transition: border-color 0.2s;
    background: transparent;
}

.otp-input:focus {
    border-color: rgb(var(--v-theme-primary));
    box-shadow: 0 0 0 1px rgb(var(--v-theme-primary));
}

.otp-input.filled {
    border-color: rgb(var(--v-theme-primary));
    background: rgba(var(--v-theme-primary), 0.04);
}
</style>
