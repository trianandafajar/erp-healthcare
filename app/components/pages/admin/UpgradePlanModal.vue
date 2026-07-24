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

function uniqueFeatures(plan: any): string[] {
  const list: string[] = plan.features || []
  return Array.from(new Set(list)).slice(0, 5)
}

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
  <v-dialog :model-value="modelValue" @update:model-value="$emit('update:modelValue', $event)" max-width="1000">
    <v-card rounded="sm" class="pa-2">
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
          <div class="billing-toggle">
            <button :class="['toggle-btn', billingCycle === 'monthly' ? 'toggle-btn--active' : '']" type="button"
              @click="billingCycle = 'monthly'">
              Monthly
            </button>
            <button :class="['toggle-btn', billingCycle === 'yearly' ? 'toggle-btn--active' : '']" type="button"
              @click="billingCycle = 'yearly'">
              Yearly
              <span class="toggle-badge">Save 15%</span>
            </button>
          </div>
        </div>

        <v-skeleton-loader v-if="loading" type="card, card, card" class="mt-4" />

        <div v-else-if="sortedPlans.length === 0" class="text-center py-8 text-medium-emphasis">
          <v-icon icon="mdi-credit-card-off-outline" size="40" class="mb-2" />
          <div>No plans available</div>
        </div>

        <div v-else class="grid-layout">
          <div v-for="plan in sortedPlans" :key="plan.id" :class="[
            'plan-card',
            plan.title?.toLowerCase() === currentPlan ? 'plan-card--current' : 'plan-card--selectable',
            plan.is_recommended && plan.title?.toLowerCase() !== currentPlan ? 'plan-card--recommended' : ''
          ]" @click="plan.title?.toLowerCase() !== currentPlan && doUpgrade(plan)">

            <div v-if="plan.is_recommended && plan.title?.toLowerCase() !== currentPlan" class="plan-badge">
              <span class="plan-badge__text">
                {{ plan.badge_text || 'Most Popular' }}
              </span>
            </div>

            <div v-if="plan.title?.toLowerCase() === currentPlan" class="plan-current-chip">
              <v-chip color="success" variant="tonal" size="x-small">Current</v-chip>
            </div>

            <div class="mb-4">
              <h3 class="text-lg font-weight-bold">{{ plan.title }}</h3>
              <p class="text-caption text-medium-emphasis mt-1">{{ plan.subtitle }}</p>
            </div>

            <div class="mb-4">
              <div class="d-flex align-baseline ga-1">
                <span class="text-caption text-medium-emphasis">{{ plan.currency === 'IDR' ? 'Rp' : '$' }}</span>
                <span class="plan-price">{{ displayPrice(plan) }}</span>
                <span class="text-caption text-medium-emphasis">/mo</span>
              </div>
              <p v-if="billingCycle === 'yearly' && plan.yearly_price" class="text-caption text-medium-emphasis mt-1">
                ${{ formatNumber(plan.yearly_price) }} billed annually
              </p>
              <p v-if="billingCycle === 'yearly' && plan.yearly_price && plan.price > 0"
                class="text-caption text-success font-weight-bold mt-0.5">
                Save {{ savingsPercent(plan) }}%
              </p>
            </div>

            <ul class="plan-feature-list mb-5">
              <li v-for="(feature, fi) in uniqueFeatures(plan)" :key="fi" class="plan-feature-item">
                <v-icon icon="mdi-check-circle" size="16" color="success" class="flex-shrink-0 mt-0.5" />
                {{ feature }}
              </li>
            </ul>

            <v-btn v-if="plan.title?.toLowerCase() !== currentPlan" variant="flat" rounded="sm"
              :color="plan.is_recommended ? 'primary' : 'secondary'"
              :loading="submitting && selectedPlan === plan.title?.toLowerCase()" :disabled="submitting" block
              @click.stop="doUpgrade(plan)">
              <span v-if="submitting && selectedPlan === plan.title?.toLowerCase()">
                <v-icon icon="mdi-loading mdi-spin" size="18" class="mr-1" />
                Processing...
              </span>
              <span v-else>Upgrade to {{ plan.title }}</span>
            </v-btn>

            <v-btn v-else variant="tonal" color="grey" rounded="sm" block disabled>
              Current Plan
            </v-btn>
          </div>
        </div>
      </v-card-text>

      <v-divider />

      <v-card-actions class="pa-4 pt-3">
        <v-spacer />
        <v-btn variant="outlined" color="primary" rounded="xl" @click="$emit('update:modelValue', false)">
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

.billing-toggle {
  display: inline-flex;
  align-items: center;
  background-color: rgba(var(--v-theme-on-surface), 0.06);
  border-radius: 5px;
  padding: 4px;
}

.toggle-btn {
  border: none;
  cursor: pointer;
  background: transparent;
  padding: 8px 24px;
  border-radius: 5px;
  font-size: 0.875rem;
  font-weight: 600;
  line-height: 1;
  white-space: nowrap;
  color: rgba(var(--v-theme-on-surface), 0.6);
  transition: background-color 0.2s ease, color 0.2s ease, box-shadow 0.2s ease;
}

.toggle-btn:hover {
  color: rgb(var(--v-theme-on-surface));
}

.toggle-btn--active {
  background-color: rgb(var(--v-theme-surface));
  color: rgb(var(--v-theme-on-surface));
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.12);
}

.toggle-badge {
  margin-left: 6px;
  font-size: 0.75rem;
  font-weight: 700;
  color: rgb(var(--v-theme-success));
}

/* Plan cards */
.plan-card {
  position: relative;
  display: flex;
  flex-direction: column;
  border: 1px solid rgba(var(--v-theme-on-surface), 0.12);
  border-radius: 5px;
  padding: 20px;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.plan-card--selectable {
  cursor: pointer;
}

.plan-card--selectable:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.08);
}

.plan-card--current {
  opacity: 0.7;
  cursor: not-allowed;
}

.plan-card--recommended {
  border-color: rgb(var(--v-theme-primary));
  background-color: rgb(var(--v-theme-surface));
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
}

.plan-badge {
  position: absolute;
  top: -12px;
  left: 50%;
  transform: translateX(-50%);
}

.plan-badge__text {
  background-color: rgb(var(--v-theme-primary));
  color: rgb(var(--v-theme-on-primary));
  font-size: 0.75rem;
  font-weight: 700;
  padding: 2px 12px;
  border-radius: 999px;
}

.plan-current-chip {
  position: absolute;
  top: 12px;
  right: 12px;
}

.plan-price {
  font-size: 2rem;
  font-weight: 700;
  letter-spacing: -0.02em;
  line-height: 1;
}

.plan-feature-list {
  list-style: none;
  padding: 0;
  margin: 0;
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.plan-feature-item {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  font-size: 0.875rem;
  color: rgba(var(--v-theme-on-surface), 0.7);
}
</style>