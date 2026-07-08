<template>
  <Header always-shadow />
  <div class="min-h-screen bg-gray-50 pt-20 md:pt-28 flex items-center justify-center px-4">
    <div class="max-w-lg mx-auto text-center">
      <div class="w-16 h-16 rounded-full bg-amber-100 flex items-center justify-center mx-auto mb-6">
        <v-icon icon="mdi-lock-outline" size="28" color="#d97706" />
      </div>
      <h1 class="text-2xl md:text-3xl font-bold text-gray-900">Upgrade Required</h1>
      <p class="mt-3 text-gray-500 leading-relaxed">
        Your current <strong>{{ currentPlan }}</strong> plan does not include this feature.
        Upgrade to unlock it and more.
      </p>

      <div class="mt-8 p-6 bg-white border border-gray-200 rounded-2xl text-left">
        <div v-for="(feat, i) in missingFeatures" :key="i" class="flex items-center gap-3 py-2">
          <svg class="w-5 h-5 text-[#176D37] flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7" />
          </svg>
          <span class="text-sm text-gray-700">{{ feat }}</span>
        </div>
      </div>

      <NuxtLink to="/#pricing"
        class="mt-6 inline-flex items-center px-8 py-3.5 text-sm font-bold text-white bg-[#176D37] rounded-full hover:bg-[#176D37]/90 transition-all">
        View Pricing Plans
      </NuxtLink>
      <br />
      <NuxtLink to="/" class="mt-4 inline-block text-sm text-gray-500 hover:text-gray-700 underline">
        Back to Home
      </NuxtLink>
    </div>
  </div>
  <Footer />
</template>

<script setup lang="ts">
import Header from '~/components/landingpage/Header.vue'
import Footer from '~/components/landingpage/Footer.vue'

definePageMeta({
  layout: 'blank',
})

const { plan } = usePlan()

const route = useRoute()
const feature = (route.query.feature as string) ?? ''
const featureLabel = (route.query.label as string) ?? 'this feature'

const currentPlan = computed(() => {
  const p = plan.value
  return p.charAt(0).toUpperCase() + p.slice(1)
})

const missingFeatures = computed(() => {
  if (!feature) return []
  if (feature === 'pharmacy_module') return ['Pharmacy Module (Prescriptions, Stock)']
  if (feature === 'reports') return ['Reports & Data Export']
  if (feature === 'api_access') return ['API Access']
  if (feature === 'nurse_module') return ['Nurse Module (Care Notes, Vitals, Procedures)']
  if (feature === 'multi_branch') return ['Multi-Branch Management']
  return [featureLabel]
})
</script>
