<script setup lang="ts">
definePageMeta({
  layout: 'blank',
  middleware: ['auth'],
  skipTenantCheck: true,
})

const router = useRouter()
const authStore = useAuthStore()
const profileStore = useProfileStore()

const clinicName = ref('')
const billing = ref<'monthly' | 'yearly'>('monthly')
const plans = ref<any[]>([])
const loading = ref(false)
const submitting = ref(false)
const errorMsg = ref('')

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
</script>

<template>
  <div class="onboarding-page">
    <div class="text-center mb-8">
      <h1 class="text-h3 font-weight-bold">Welcome to Healthcare</h1>
      <p class="text-body-1 text-medium-emphasis mt-2">Set up your clinic and choose a plan to get started</p>
    </div>

    <v-alert v-if="errorMsg" type="error" class="mb-4" closable>{{ errorMsg }}</v-alert>

    <v-card max-width="720" class="mx-auto mb-8" :elevation="2">
      <v-card-text class="pa-6">
        <label class="text-subtitle-2 font-weight-bold mb-2 d-block">Clinic / Hospital Name</label>
        <v-text-field
          v-model="clinicName"
          placeholder="Enter your clinic or hospital name"
          variant="outlined"
          hide-details="auto"
          :rules="[(v: string) => !!v.trim() || 'Clinic name is required']"
        />
      </v-card-text>
    </v-card>

    <div class="d-flex justify-center mb-8">
      <v-btn-toggle v-model="billing" color="primary" mandatory divided>
        <v-btn :value="'monthly'" size="large">Monthly</v-btn>
        <v-btn :value="'yearly'" size="large">Yearly <span class="text-success text-caption ml-1">Save 15%</span></v-btn>
      </v-btn-toggle>
    </div>

    <v-row v-if="!loading" class="justify-center">
      <v-col v-for="plan in plans" :key="plan.id" cols="12" sm="6" md="3">
        <v-card
          :class="['plan-card', { 'plan-card--recommended': plan.is_recommended }]"
          :elevation="plan.is_recommended ? 4 : 1"
          @click="selectPlan(plan)"
        >
          <v-card-item>
            <template v-slot:prepend>
              <v-chip v-if="plan.is_recommended" color="primary" size="small" class="mb-2">Most Popular</v-chip>
            </template>
            <v-card-title class="text-h5 font-weight-bold">{{ plan.title }}</v-card-title>
            <v-card-subtitle class="text-body-2 mt-1">{{ plan.subtitle }}</v-card-subtitle>
          </v-card-item>

          <v-card-text>
            <div class="d-flex align-baseline ga-1 mb-4">
              <span class="text-h3 font-weight-bold">{{ plan.currency === 'IDR' ? 'Rp' : '$' }}{{ displayPrice(plan) }}</span>
              <span class="text-body-2 text-medium-emphasis">/mo</span>
            </div>

            <v-divider class="mb-4"></v-divider>

            <ul class="feature-list">
              <li v-for="(feature, fi) in plan.features?.slice(0, 6) || []" :key="fi" class="d-flex align-center ga-2 mb-2 text-body-2">
                <v-icon color="success" size="small">mdi-check-circle</v-icon>
                {{ feature }}
              </li>
            </ul>
          </v-card-text>

          <v-card-actions class="pa-4 pt-0">
            <v-btn
              :block="true"
              :color="plan.is_recommended ? 'primary' : 'default'"
              :variant="plan.is_recommended ? 'flat' : 'outlined'"
              size="large"
              :loading="submitting && selected === plan.id"
              @click.stop="selectPlan(plan)"
            >
              {{ plan.button_label || 'Select Plan' }}
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-col>
    </v-row>

    <div v-if="loading" class="d-flex justify-center mt-8">
      <v-progress-circular indeterminate color="primary"></v-progress-circular>
    </div>
  </div>
</template>

<style scoped>
.onboarding-page {
  max-width: 1200px;
  margin: 0 auto;
  padding: 48px 24px;
}

.plan-card {
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.plan-card:hover {
  transform: translateY(-4px);
}

.plan-card--recommended {
  border: 2px solid rgb(var(--v-theme-primary));
}

.feature-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.v-card-text {
  flex: 1;
}
</style>
