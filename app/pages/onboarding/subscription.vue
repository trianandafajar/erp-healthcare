<script setup lang="ts">
import AppLogo from '~/components/AppLogo.vue'
import AuthFooter from '~/components/auth/AuthFooter.vue'

definePageMeta({
  layout: false,
  middleware: ['auth'],
  skipTenantCheck: true,
})

useSeoMeta({
  title: 'Onboarding Page',
  ogTitle: 'My Amazing Site',
  description: 'This is my amazing site, let me tell you all about it.',
  ogDescription: 'This is my amazing site, let me tell you all about it.',
  ogImage: 'https://example.com/image.png',
  twitterCard: 'summary_large_image',
})

const router = useRouter()
const authStore = useAuthStore()
const profileStore = useProfileStore()

const clinicName = ref('')
const billing = ref<'monthly' | 'yearly'>('monthly')
const plans = ref<any[]>([])
const loading = ref(false)
const submitting = ref(false)
const selectedPlanId = ref<string | number | null>(null)
const errorMsg = ref('')

const showFeatureModal = ref(false)
const selectedPlan = ref<any>(null)

function openFeatureModal(plan: any) {
  selectedPlan.value = plan
  showFeatureModal.value = true
}

async function loadPlans() {
  loading.value = true
  try {
    const data = await $fetch('/api/landingpage/pricing')
    plans.value = (data as any).plans?.filter((p: any) => p.button_link === '/register') ?? []
  } catch {
    errorMsg.value = 'Failed to load plans.'
  } finally {
    loading.value = false
  }
}

loadPlans()

async function selectPlan(plan: any) {
  if (!clinicName.value.trim()) {
    errorMsg.value = 'Please enter your clinic or hospital name.'
    return
  }
  if (!plan?.id) return

  submitting.value = true
  selectedPlanId.value = plan.id
  errorMsg.value = ''

  try {
    const planName = plan.title?.toLowerCase()

    const data: any = await $fetch('/api/subscription/select', {
      method: 'POST',
      body: {
        tenant_name: clinicName.value.trim(),
        plan_name: planName,
        billing_cycle: billing.value,
      },
    })

    if (data.url) {
      window.location.href = data.url
    } else if (data.slug) {
      await profileStore.refreshProfile()
      await navigateTo(`/${data.slug}/configure`)
    }
  } catch (err: any) {
    errorMsg.value = err?.data?.message || err.message || 'Failed to set up subscription.'
  } finally {
    submitting.value = false
  }
}

function displayPrice(plan: any) {
  const p = billing.value === 'yearly' && plan.yearly_price ? plan.yearly_price / 12 : plan.price
  return formatNumber(p)
}

function formatNumber(n: number) {
  return Number(n).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })
}

function savingsPercent(plan: any) {
  if (!plan.yearly_price || !plan.price) return 0
  const monthlyTotal = plan.price * 12
  return Math.round((1 - plan.yearly_price / monthlyTotal) * 100)
}
</script>

<template>
  <v-row class="bg-containerBg position-relative" no-gutters>

    <div class="blur-logo">
      <img src="/logo.png" alt="" style="width: 700px; height: auto; opacity: 0.4;" />
    </div>

    <v-col cols="12">
      <div class="pt-6 pl-6">
        <AppLogo />
      </div>
    </v-col>

    <v-col cols="12" lg="12" class="d-flex align-center">
      <v-container>
        <div class="d-flex align-center justify-center" style="min-height: calc(100vh - 148px)">
          <div class="container mx-auto px-4">
            <p class="text-center text-xs font-semibold tracking-wide text-gray-400 uppercase mb-3">
              Step 1 of 2 &middot; Clinic details
            </p>

            <div class="text-center max-w-2xl mx-auto mb-10">
              <h1 class="text-3xl md:text-4xl font-bold text-gray-900">Set Up Your Clinic</h1>
              <p class="mt-4 text-gray-500 leading-relaxed">
                Tell us about your clinic, then choose the plan that fits how you work. No hidden fees, no surprises.
              </p>
            </div>

            <div v-if="errorMsg"
              class="max-w-xl mx-auto mb-8 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 flex items-start justify-between gap-3">
              <span>{{ errorMsg }}</span>
              <button class="text-red-400 hover:text-red-600" @click="errorMsg = ''">✕</button>
            </div>

            <div class="max-w-xl mx-auto mb-12 rounded-2xl border bg-white border-gray-200 p-6 lg:p-8">
              <AppLabel required class="block text-sm font-semibold text-gray-900 mb-2">Clinic or hospital name
              </AppLabel>
              <input v-model="clinicName" type="text" placeholder="e.g. Hospital Medika"
                class="w-full rounded-xl !border-2 !border-gray-500 px-4 py-3 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#176D37]/20 focus:border-[#176D37] transition-colors duration-200">
              <p class="text-xs text-gray-400 mt-2">This name shows up on invoices, appointments, and patient-facing
                pages.
              </p>
            </div>

            <div class="flex justify-center mb-10">
              <div class="inline-flex items-center bg-gray-100 rounded-full p-1">
                <button
                  :class="['px-6 py-2 rounded-full text-sm font-medium transition-all duration-200', billing === 'monthly' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700']"
                  @click="billing = 'monthly'">
                  Monthly
                </button>
                <button
                  :class="['px-6 py-2 rounded-full text-sm font-medium transition-all duration-200', billing === 'yearly' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700']"
                  @click="billing = 'yearly'">
                  Yearly
                  <span class="text-[#089695] ml-1 text-xs font-semibold">Save 15%</span>
                </button>
              </div>
            </div>

            <div v-if="loading" class="flex justify-center py-16">
              <svg class="animate-spin h-8 w-8 text-[#176D37]" viewBox="0 0 24 24" fill="none">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            </div>

            <div v-else class="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
              <div v-for="(plan, i) in plans" :key="i" :class="[
                'relative rounded-2xl border p-6 lg:p-8 flex flex-col transition-all duration-300 hover:-translate-y-1',
                plan.is_recommended
                  ? 'border-[#176D37] bg-white shadow-xl shadow-[#176D37]/10 ring-2 ring-[#176D37]'
                  : 'border-[#176D37] bg-white hover:shadow-lg ring-1 ring-[#176D37] hover:border-gray-300'
              ]">
                <div v-if="plan.is_recommended" class="absolute -top-3.5 left-1/2 -translate-x-1/2">
                  <span class="bg-[#176D37] text-white text-xs font-bold px-4 py-1 rounded-full">
                    {{ plan.badge_text || 'Most Popular' }}
                  </span>
                </div>

                <div class="mb-6">
                  <h3 class="text-lg font-bold text-gray-900">{{ plan.title }}</h3>
                  <p class="text-sm text-gray-500 mt-1">{{ plan.subtitle }}</p>
                </div>

                <div class="mb-6">
                  <div class="flex items-baseline gap-1">
                    <span class="text-sm text-gray-500">{{ plan.currency === 'IDR' ? 'Rp' : '$' }}</span>
                    <span class="text-4xl lg:text-5xl font-bold text-gray-900 tracking-tight">
                      {{ displayPrice(plan) }}
                    </span>
                    <span class="text-gray-500 text-sm">/mo</span>
                  </div>
                  <p v-if="billing === 'yearly' && plan.yearly_price" class="text-xs text-gray-400 mt-1">
                    ${{ formatNumber(plan.yearly_price) }} billed annually
                  </p>
                  <p v-if="billing === 'yearly' && plan.yearly_price && plan.price > 0"
                    class="text-xs text-[#089695] font-semibold mt-0.5">
                    Save {{ savingsPercent(plan) }}%
                  </p>
                </div>

                <ul class="space-y-3 mb-8 flex-1">
                  <li v-for="(feature, fi) in (plan.features || []).slice(0, 4)" :key="fi"
                    class="flex items-start gap-3 text-sm text-gray-600">
                    <svg class="w-5 h-5 text-[#176D37] flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24"
                      stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7" />
                    </svg>
                    {{ feature }}
                  </li>
                  <li v-if="(plan.features || []).length > 4" class="pt-1 list-none">
                    <button
                      class="w-full flex items-center justify-center gap-1.5 text-sm font-medium text-gray-700 border border-gray-200 hover:border-[#176D37] hover:text-[#176D37] py-2 rounded-lg transition-colors duration-200 group"
                      @click="openFeatureModal(plan)">
                      +{{ plan.features.length - 4 }} more features
                      <svg class="w-4 h-4 transition-transform duration-200 group-hover:translate-x-0.5" fill="none"
                        viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  </li>
                </ul>

                <button type="button" :class="[
                  'w-full text-center py-3 rounded-xl text-sm font-semibold transition-all duration-200',
                  plan.is_recommended
                    ? 'bg-[#176D37] text-white hover:bg-[#145a2e] shadow-md shadow-[#176D37]/20'
                    : 'bg-gray-50 text-gray-900 border border-gray-200 hover:bg-gray-100 hover:border-gray-300'
                ]" :disabled="submitting && selectedPlanId === plan.id" @click="selectPlan(plan)">
                  <span v-if="submitting && selectedPlanId === plan.id" class="inline-flex items-center gap-2">
                    <svg class="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                      <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
                      <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Please wait
                  </span>
                  <span v-else>{{ plan.button_label || 'Select Plan' }}</span>
                </button>
              </div>
            </div>
          </div>

          <v-dialog v-model="showFeatureModal" max-width="480" class="landingpage-modal">
            <v-card v-if="selectedPlan" class="rounded-2xl">
              <v-card-title class="text-h6 font-bold px-6 pt-6">{{ selectedPlan.title }} Features</v-card-title>
              <v-card-text class="px-6 pb-6">
                <ul class="space-y-3">
                  <li v-for="(feat, i) in selectedPlan.features" :key="i"
                    class="flex items-start gap-3 text-sm text-gray-600">
                    <svg class="w-5 h-5 text-[#176D37] flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24"
                      stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7" />
                    </svg>
                    {{ feat }}
                  </li>
                </ul>
              </v-card-text>
              <v-card-actions class="px-6 pb-6">
                <v-spacer />
                <v-btn variant="tonal" @click="showFeatureModal = false">Close</v-btn>
              </v-card-actions>
            </v-card>
          </v-dialog>
        </div>
      </v-container>
    </v-col>

    <v-col cols="12">
      <v-container class="pt-0 pb-4">
        <AuthFooter />
      </v-container>
    </v-col>

  </v-row>
</template>

<style lang="scss">
.blur-logo {
  position: absolute;
  filter: blur(15px);
  top: 50%;
  left: 10%;
  transform: translate(-50%, -50%);
  pointer-events: none;
}
</style>