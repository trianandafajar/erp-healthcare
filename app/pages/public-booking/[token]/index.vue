<script setup lang="ts">
import { computed, ref } from 'vue'
import { useTheme } from 'vuetify'
import { getContrastText, isValidHex } from '@/utils/color'
import BookingWizard from '@/components/public-booking/BookingWizard.vue'

definePageMeta({
    skipTenantCheck: true,
    layout: 'blank',
})

const route = useRoute()
const token = route.params.token as string

const theme = useTheme()

const config = ref<{
    tenant: {
        id: string
        name: string
        brand_color: string
        display_name: string
        logo_url: string | null
    }
    opening_hours: { day_of_week: number; start_time: string; end_time: string; is_active: boolean }[]
    holidays: { id: string; holiday_date: string; name: string | null }[]
    doctors: {
        id: string
        full_name: string
        specialization: string | null
        department_id: string | null
        department_name: string | null
        photo_url: string | null
    }[]
} | null>(null)

const pending = ref(true)
const errorMsg = ref('')
const wizardKey = ref(0)

const booked = ref(false)
const bookedSummary = ref<{ date: string; time: string; doctor: string } | null>(null)

async function loadConfig() {
    pending.value = true
    try {
        const data = await $fetch(`/api/public-booking/${token}`)
        config.value = data
        if (isValidHex(data.tenant?.brand_color)) {
            theme.themes.value.light.colors.primary = data.tenant.brand_color
            theme.themes.value.light.colors['on-primary'] = getContrastText(data.tenant.brand_color)
        }
    } catch (e: any) {
        errorMsg.value = e?.data?.statusMessage ?? e?.data?.message ?? 'Booking page not found'
    } finally {
        pending.value = false
    }
}

onMounted(loadConfig)

const brandColor = computed(() => config.value?.tenant?.brand_color ?? '#176D37')

const DAY_NAMES_FULL = [
    'Sunday', 'Monday', 'Tuesday', 'Wednesday',
    'Thursday', 'Friday', 'Saturday',
]

function formatTime(t: string) {
    const parts = t.split(':')
    const h = Number(parts[0])
    const m = Number(parts[1])
    const period = h < 12 ? 'AM' : 'PM'
    const hour12 = h % 12 || 12
    return `${hour12}:${String(m).padStart(2, '0')} ${period}`
}

function getOpeningLabel(day: number) {
    const h = (config.value?.opening_hours ?? []).find(x => x.day_of_week === day && x.is_active)
    if (!h) return null
    return `${DAY_NAMES_FULL[day]}: ${formatTime(h.start_time.slice(0, 5))} – ${formatTime(h.end_time.slice(0, 5))}`
}

const openingLabels = computed(() => {
    const labels: string[] = []
    for (let i = 0; i < 7; i++) {
        const label = getOpeningLabel(i)
        if (label) labels.push(label)
    }
    return labels
})

function onBooked(summary: { date: string; time: string; doctor: string }) {
    bookedSummary.value = summary
    booked.value = true
}

function reset() {
    booked.value = false
    bookedSummary.value = null
    wizardKey.value++
}
</script>

<template>
    <div class="d-flex flex-column booking-shell" style="min-height: 100vh;">
        <header class="border-bottom bg-surface">
            <div class="mx-auto d-flex align-center justify-space-between ga-4 px-4 py-4" style="max-width: 900px;">
                <div class="d-flex align-center ga-3" style="min-width: 0;">
                    <img v-if="config?.tenant.logo_url" :src="config.tenant.logo_url" :alt="config.tenant.name"
                        class="rounded-lg object-cover" style="width: 40px; height: 40px;" />
                    <div style="min-width: 0;">
                        <div class="text-truncate text-subtitle-1 font-weight-bold text-grey-darken-3">
                            {{ config?.tenant.display_name || config?.tenant.name || 'Healthcare' }}
                        </div>
                        <div class="text-caption text-grey">Online Booking</div>
                    </div>
                </div>
            </div>
        </header>

        <main class="mx-auto w-100 flex-1 px-4 py-8" style="max-width: 900px;">
            <div v-if="pending" class="d-flex align-center justify-center" style="min-height: 60vh;">
                <v-progress-circular indeterminate color="primary" size="48" />
            </div>

            <div v-else-if="errorMsg" class="d-flex flex-column align-center text-center" style="padding: 64px;">
                <v-icon icon="mdi-calendar-remove" size="48" color="error" class="mb-3" />
                <h2 class="text-h6 font-weight-bold text-grey-darken-3">Booking Unavailable</h2>
                <p class="mt-2 text-body-2 text-grey">{{ errorMsg }}</p>
            </div>

            <div v-else-if="booked" class="mx-auto text-center" style="max-width: 460px;">
                <v-card elevation="0" variant="outlined" rounded="md" class="bg-surface"
                    :style="{ borderColor: '#e0e0e0' }">
                    <v-card-text class="pa-8">
                        <div class="mx-auto mb-5 d-flex align-center justify-center rounded-circle"
                            :style="{ backgroundColor: brandColor + '1a', width: '64px', height: '64px' }">
                            <v-icon icon="mdi-check-circle-outline" size="36" :color="brandColor" />
                        </div>
                        <div class="text-h5 font-weight-bold text-grey-darken-3">Booking Confirmed</div>
                        <p class="mt-3 text-body-2 text-grey">
                            Your appointment has been scheduled with <strong>{{ bookedSummary?.doctor }}</strong>
                            on <strong>{{ bookedSummary?.date }}</strong> at
                            <strong>{{ formatTime(bookedSummary?.time || '') }}</strong>.
                        </p>
                        <p class="mt-2 text-caption text-grey-lighten-1">
                            Please arrive on time. Our team will contact you to confirm.
                        </p>
                        <v-btn color="primary" variant="flat" size="large" class="mt-8" @click="reset">
                            Make Another Booking
                        </v-btn>
                    </v-card-text>
                </v-card>
            </div>

            <div v-else>
                <BookingWizard v-if="config" :key="wizardKey" :token="token" :holidays="config.holidays"
                    :doctors="config.doctors" :opening-hours="config.opening_hours" @booked="onBooked" />
            </div>
        </main>

        <footer class="border-top bg-surface py-4">
            <div class="mx-auto px-4 text-center text-caption text-grey" style="max-width: 900px;">
                Powered by Healthcare • {{ config?.tenant.display_name || config?.tenant.name }}
            </div>
        </footer>
    </div>
</template>
