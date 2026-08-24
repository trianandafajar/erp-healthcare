import { ref, computed, onUnmounted } from 'vue'

export function useRateLimitLockout() {
    const lockoutSeconds = ref(0)
    const errorMsg = ref('')
    let timer: ReturnType<typeof setInterval> | null = null

    const isLocked = computed(() => lockoutSeconds.value > 0)

    function handle429(err: any) {
        const retryAfter =
            err?.data?.retryAfter ??
            parseInt(err?.response?.headers?.get?.('retry-after') ?? '', 10) ||
            60

        lockoutSeconds.value = retryAfter
        errorMsg.value = `Too many attempts. Please try again in ${lockoutSeconds.value} seconds.`

        if (timer) clearInterval(timer)

        timer = setInterval(() => {
            lockoutSeconds.value--
            if (lockoutSeconds.value <= 0) {
                lockoutSeconds.value = 0
                errorMsg.value = ''
                if (timer) {
                    clearInterval(timer)
                    timer = null
                }
            } else {
                errorMsg.value = `Too many attempts. Please try again in ${lockoutSeconds.value} seconds.`
            }
        }, 1000)
    }

    function clear() {
        if (timer) {
            clearInterval(timer)
            timer = null
        }
        lockoutSeconds.value = 0
        errorMsg.value = ''
    }

    onUnmounted(() => {
        if (timer) clearInterval(timer)
    })

    return { lockoutSeconds, isLocked, errorMsg, handle429, clear }
}
