<template>
  <section id="pricing" class="py-20 md:py-28 bg-white">
    <div class="container mx-auto px-4">
      <div class="text-center max-w-2xl mx-auto mb-12">
        <h2 class="text-3xl md:text-4xl font-bold text-gray-900">Simple, Transparent Pricing</h2>
        <p class="mt-4 text-gray-500 leading-relaxed">Choose the plan that fits your healthcare facility. No hidden fees, no surprises.</p>
      </div>

      <div class="flex justify-center mb-10">
        <div class="inline-flex items-center bg-gray-100 rounded-full p-1">
          <button
            :class="['px-6 py-2 rounded-full text-sm font-medium transition-all duration-200', billing === 'monthly' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700']"
            @click="billing = 'monthly'"
          >
            Monthly
          </button>
          <button
            :class="['px-6 py-2 rounded-full text-sm font-medium transition-all duration-200', billing === 'yearly' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700']"
            @click="billing = 'yearly'"
          >
            Yearly
            <span class="text-[#089695] ml-1 text-xs font-semibold">Save 15%</span>
          </button>
        </div>
      </div>

      <div class="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
        <div
          v-for="(plan, i) in plans"
          :key="i"
          :class="[
            'relative rounded-2xl border p-6 lg:p-8 flex flex-col transition-all duration-300 hover:-translate-y-1',
            plan.is_recommended
              ? 'border-[#176D37] bg-white shadow-xl shadow-[#176D37]/10 ring-2 ring-[#176D37]'
              : 'border-[#176D37] bg-white hover:shadow-lg ring-1 ring-[#176D37] hover:border-gray-300'
          ]"
        >
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
            <p v-if="billing === 'yearly' && plan.yearly_price && plan.price > 0" class="text-xs text-[#089695] font-semibold mt-0.5">
              Save {{ savingsPercent(plan) }}%
            </p>
          </div>

          <ul class="space-y-3 mb-8 flex-1">
            <li v-for="(feature, fi) in plan.features.slice(0, 4)" :key="fi" class="flex items-start gap-3 text-sm text-gray-600">
              <svg class="w-5 h-5 text-[#176D37] flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7" />
              </svg>
              {{ feature }}
            </li>
            <li v-if="plan.features.length > 4" class="text-center pt-2">
              <button class="text-sm text-[#089695] font-medium hover:underline" @click="openFeatureModal(plan)">
                View All ({{ plan.features.length }} features)
              </button>
            </li>
          </ul>

          <NuxtLink
            :to="plan.id && plan.button_link === '/register' ? `/register?plan=${plan.id}&billing=${billing}` : plan.button_link"
            :class="[
              'w-full text-center py-3 rounded-xl text-sm font-semibold transition-all duration-200',
              plan.is_recommended
                ? 'bg-[#176D37] text-white hover:bg-[#145a2e] shadow-md shadow-[#176D37]/20'
                : 'bg-gray-50 text-gray-900 border border-gray-200 hover:bg-gray-100 hover:border-gray-300'
            ]"
          >
            {{ plan.button_label }}
          </NuxtLink>
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
              <svg class="w-5 h-5 text-[#176D37] flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
  </section>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'

const billing = ref('monthly')

const showFeatureModal = ref(false)
const selectedPlan = ref<any>(null)

function openFeatureModal(plan: any) {
  selectedPlan.value = plan
  showFeatureModal.value = true
}

const { data: pricingData, error: pricingError } = await useFetch('/api/landingpage/pricing')

const fallbackPlans = [
  {
    title: 'Starter', subtitle: 'Best for small clinics getting started',
    price: 29, yearly_price: 299,
    features: ['Up to 5 users', 'Basic patient registration', 'Medical records management', 'Email support'],
    button_label: 'Start Free Trial', button_link: '/register',
    is_recommended: false, badge_text: '',
  },
  {
    title: 'Basic', subtitle: 'Perfect for growing practices',
    price: 59, yearly_price: 599,
    features: ['Up to 15 users', 'Everything in Starter', 'Pharmacy integration', 'Appointment scheduling', 'Billing & invoicing', 'Priority email support'],
    button_label: 'Get Started', button_link: '/register',
    is_recommended: false, badge_text: '',
  },
  {
    title: 'Professional', subtitle: 'For established healthcare providers',
    price: 99, yearly_price: 999,
    features: ['Unlimited users', 'Everything in Basic', 'Advanced analytics dashboard', 'Multi-branch management', 'Lab integration', 'API access', 'Phone & chat support'],
    button_label: 'Get Started', button_link: '/register',
    is_recommended: true, badge_text: 'Most Popular',
  },
  {
    title: 'Enterprise', subtitle: 'For large hospital networks',
    price: 199, yearly_price: 1999,
    features: ['Unlimited everything', 'All Professional features', 'Custom integrations', 'Dedicated account manager', 'On-premise option', '24/7 priority support', 'SLA guarantee'],
    button_label: 'Contact Sales', button_link: '/contact',
    is_recommended: false, badge_text: '',
  },
]

const plans = computed(() =>
  pricingError.value || !pricingData.value?.plans?.length ? fallbackPlans : pricingData.value.plans
)

function formatNumber(n: number) {
  return Number(n).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })
}

function displayPrice(plan :any) {
  if (billing.value === 'yearly' && plan.yearly_price) {
    return formatNumber(plan.yearly_price / 12)
  }
  return formatNumber(plan.price)
}

function savingsPercent(plan: any) {
  if (!plan.yearly_price || !plan.price) return 0
  const monthlyTotal = plan.price * 12
  return Math.round((1 - plan.yearly_price / monthlyTotal) * 100)
}
</script>
