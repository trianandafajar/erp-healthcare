<script setup lang="ts">
const props = defineProps<{
  modelValue: boolean
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', val: boolean): void
}>()

const profileStore = useProfileStore()
const subscription = computed(() => profileStore.data?.subscription)
const tenant = computed(() => profileStore.data?.tenant)
const currentPlan = computed(() => subscription.value?.plan?.toLowerCase() || 'starter')

const billingCycle = ref<'monthly' | 'yearly'>(
  (subscription.value?.billing_cycle as 'monthly' | 'yearly') || 'monthly'
)
const loading = ref(false)
const plans = ref<any[]>([])
const submitting = ref(false)
const selectedPlan = ref<string | null>(null)
const errorMsg = ref('')

const snackbar = ref(false)
const snackbarMsg = ref('')
const snackbarColor = ref('success')

const planDisplayNames: Record<string, string> = {
  starter: 'Starter',
  basic: 'Basic',
  professional: 'Professional',
  enterprise: 'Enterprise',
}

const planColors: Record<string, string> = {
  starter: 'grey',
  basic: 'primary',
  professional: 'success',
  enterprise: 'purple',
}

const planOrder = ['starter', 'basic', 'professional', 'enterprise']

const availablePlans = computed(() => {
  const currentIdx = planOrder.indexOf(currentPlan.value)
  return plans.value.filter((p: any) => {
    const idx = planOrder.indexOf(p.title?.toLowerCase())
    return idx >= currentIdx
  })
})

const sortedPlans = computed(() => {
  return [...availablePlans.value].sort((a: any, b: any) => {
    return planOrder.indexOf(a.title?.toLowerCase()) - planOrder.indexOf(b.title?.toLowerCase())
  })
})

function displayPrice(plan: any) {
  const p = billingCycle.value === 'yearly' && plan.yearly_price ? plan.yearly_price / 12 : plan.price
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

async function loadPlans() {
  loading.value = true
  try {
    const data = await $fetch('/api/landingpage/pricing')
    plans.value = (data as any).plans ?? []
  } catch {
    plans.value = []
  } finally {
    loading.value = false
  }
}

watch(() => props.modelValue, (val) => {
  if (val) loadPlans()
})

async function doUpgrade(plan: any) {
  const planName = plan.title?.toLowerCase()
  if (planName === currentPlan.value) return

  submitting.value = true
  selectedPlan.value = planName
  errorMsg.value = ''

  try {
    const data: any = await $fetch('/api/subscription/upgrade', {
      method: 'POST',
      body: {
        plan_name: planName,
        billing_cycle: billingCycle.value,
      },
    })

    if (data.url) {
      window.location.href = data.url
    } else {
      await profileStore.refreshProfile()
      snackbarMsg.value = `Upgraded to ${planDisplayNames[planName] || plan.title} successfully!`
      snackbarColor.value = 'success'
      snackbar.value = true
      emit('update:modelValue', false)
    }
  } catch (e: any) {
    errorMsg.value = e?.data?.message || e.message || 'Upgrade failed'
    snackbarMsg.value = errorMsg.value
    snackbarColor.value = 'error'
    snackbar.value = true
  } finally {
    submitting.value = false
    selectedPlan.value = null
  }
}
</script>

<template>
  <v-dialog :model-value="modelValue" @update:model-value="$emit('update:modelValue', $event)" max-width="900" persistent>
    <v-card rounded="xl" class="pa-2">
      <v-card-title class="d-flex align-center justify-space-between pa-4 pb-2">
        <div class="d-flex align-center ga-2">
          <v-icon icon="mdi-arrow-up-bold-circle-outline" size="22" color="primary" />
          <span class="text-h6 font-weight-bold">Upgrade Plan</span>
        </div>
        <v-btn icon="mdi-close" variant="text" density="compact" @click="$emit('update:modelValue', false)" />
      </v-card-title>

      <v-divider />

      <v-card-text class="pa-4">
        <div v-if="errorMsg" class="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {{ errorMsg }}
        </div>

        <div class="text-body-2 text-medium-emphasis mb-4">
          Current plan: <strong class="text-capitalize">{{ currentPlan }}</strong>
        </div>

        <div class="d-flex justify-center mb-6">
          <div class="inline-flex items-center bg-gray-100 rounded-full p-1" style="background-color: rgb(var(--v-theme-surface-variant));">
            <button
              :class="['px-5 py-1.5 rounded-full text-sm font-medium transition-all duration-200', billingCycle === 'monthly' ? 'bg-white text-gray-900 shadow-sm' : 'text-medium-emphasis hover:text-gray-700']"
              style="border: none; cursor: pointer;"
              @click="billingCycle = 'monthly'">
              Monthly
            </button>
            <button
              :class="['px-5 py-1.5 rounded-full text-sm font-medium transition-all duration-200', billingCycle === 'yearly' ? 'bg-white text-gray-900 shadow-sm' : 'text-medium-emphasis hover:text-gray-700']"
              style="border: none; cursor: pointer;"
              @click="billingCycle = 'yearly'">
              Yearly
              <span class="text-success ml-1 text-xs font-semibold">Save 15%</span>
            </button>
          </div>
        </div>

        <v-skeleton-loader v-if="loading" type="card, card, card" class="mt-4" />

        <div v-else-if="sortedPlans.length === 0" class="text-center py-8 text-medium-emphasis">
          <v-icon icon="mdi-credit-card-off-outline" size="40" class="mb-2" />
          <div>No plans available</div>
        </div>

        <div v-else class="grid-layout">
          <div v-for="plan in sortedPlans" :key="plan.id"
            :class="[
              'relative rounded-xl border p-5 flex flex-col transition-all duration-200',
              plan.title?.toLowerCase() === currentPlan
                ? 'border-medium-emphasis opacity-70 cursor-not-allowed'
                : 'hover:-translate-y-1 hover:shadow-md cursor-pointer',
              plan.is_recommended && plan.title?.toLowerCase() !== currentPlan
                ? 'border-primary bg-white shadow-lg'
                : 'border'
            ]"
            @click="plan.title?.toLowerCase() !== currentPlan && doUpgrade(plan)">

            <div v-if="plan.is_recommended && plan.title?.toLowerCase() !== currentPlan"
              class="absolute -top-3 left-1/2 -translate-x-1/2">
              <span class="bg-primary text-white text-xs font-bold px-3 py-0.5 rounded-full">
                {{ plan.badge_text || 'Most Popular' }}
              </span>
            </div>

            <div v-if="plan.title?.toLowerCase() === currentPlan"
              class="absolute top-3 right-3">
              <v-chip color="success" variant="tonal" size="x-small">Current</v-chip>
            </div>

            <div class="mb-4">
              <h3 class="text-lg font-bold">{{ plan.title }}</h3>
              <p class="text-caption text-medium-emphasis mt-1">{{ plan.subtitle }}</p>
            </div>

            <div class="mb-4">
              <div class="d-flex align-baseline gap-1">
                <span class="text-caption text-medium-emphasis">{{ plan.currency === 'IDR' ? 'Rp' : '$' }}</span>
                <span class="text-3xl lg:text-4xl font-bold tracking-tight">{{ displayPrice(plan) }}</span>
                <span class="text-caption text-medium-emphasis">/mo</span>
              </div>
              <p v-if="billingCycle === 'yearly' && plan.yearly_price" class="text-caption text-medium-emphasis mt-1">
                ${{ formatNumber(plan.yearly_price) }} billed annually
              </p>
              <p v-if="billingCycle === 'yearly' && plan.yearly_price && plan.price > 0"
                class="text-caption text-success font-semibold mt-0.5">
                Save {{ savingsPercent(plan) }}%
              </p>
            </div>

            <ul class="space-y-2 mb-5 flex-1">
              <li v-for="(feature, fi) in (plan.features || []).slice(0, 5)" :key="fi"
                class="d-flex align-start ga-2 text-body-2 text-medium-emphasis">
                <v-icon icon="mdi-check-circle" size="16" color="success" class="flex-shrink-0 mt-0.5" />
                {{ feature }}
              </li>
            </ul>

            <v-btn
              v-if="plan.title?.toLowerCase() !== currentPlan"
              variant="flat"
              :color="plan.is_recommended ? 'primary' : 'secondary'"
              :loading="submitting && selectedPlan === plan.title?.toLowerCase()"
              :disabled="submitting"
              block
              @click.stop="doUpgrade(plan)">
              <span v-if="submitting && selectedPlan === plan.title?.toLowerCase()">
                <v-icon icon="mdi-loading mdi-spin" size="18" class="mr-1" />
                Processing...
              </span>
              <span v-else>Upgrade to {{ plan.title }}</span>
            </v-btn>

            <v-btn v-else variant="tonal" color="grey" block disabled>
              Current Plan
            </v-btn>
          </div>
        </div>
      </v-card-text>

      <v-divider />

      <v-card-actions class="pa-4 pt-3">
        <v-spacer />
        <v-btn variant="tonal" color="secondary" @click="$emit('update:modelValue', false)">
          Close
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>

  <v-snackbar v-model="snackbar" :color="snackbarColor" location="bottom right" timeout="3000">
    {{ snackbarMsg }}
    <template #actions>
      <v-btn variant="text" icon="mdi-close" @click="snackbar = false" />
    </template>
  </v-snackbar>
</template>

<style scoped>
.grid-layout {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 16px;
}

.inline-flex {
  display: inline-flex;
}

.items-center {
  align-items: center;
}
</style>
