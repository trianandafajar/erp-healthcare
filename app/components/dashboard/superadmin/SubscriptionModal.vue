<script setup lang="ts">
import { computed, ref, watch } from 'vue'

interface Subscription {
  id: string
  tenant_id: string
  tenant_name: string
  tenant_slug: string
  plan: string
  status: string
  billing_cycle: string
  amount: number
  start_date: string
  next_billing: string
  trial_ends: string | null
  payment_method: string
}

interface TenantOption {
  id: string
  name: string
  slug: string
}

const props = defineProps<{
  mode: 'add' | 'edit' | 'delete'
  subscription?: Subscription | null
  availableTenants?: TenantOption[]
  loading?: boolean
}>()

const emit = defineEmits<{
  (e: 'submit', data: any): void
  (e: 'cancel'): void
}>()

const form = ref({
  tenant_id: '',
  plan: 'Starter',
  status: 'active',
  billing_cycle: 'monthly',
  amount: 0,
  start_date: new Date().toISOString().split('T')[0],
  payment_method: '',
})

const planDefaults: Record<string, number> = {
  Starter: 29,
  Basic: 59,
  Professional: 99,
  Enterprise: 199,
}

watch(
  () => props.subscription,
  (sub) => {
    if (props.mode === 'edit' && sub) {
      form.value = {
        tenant_id: sub.tenant_id,
        plan: sub.plan,
        status: sub.status,
        billing_cycle: sub.billing_cycle,
        amount: sub.amount,
        start_date: sub.start_date.split('T')[0],
        payment_method: sub.payment_method,
      }
    } else if (props.mode === 'add') {
      form.value = {
        tenant_id: '',
        plan: 'Starter',
        status: 'active',
        billing_cycle: 'monthly',
        amount: 29,
        start_date: new Date().toISOString().split('T')[0],
        payment_method: '',
      }
    }
  },
  { immediate: true }
)

function onPlanChange(plan: string) {
  const base = planDefaults[plan] ?? 0
  form.value.amount = form.value.billing_cycle === 'yearly' ? base * 10 : base
}

function onCycleChange(cycle: string) {
  const base = planDefaults[form.value.plan] ?? 0
  form.value.amount = cycle === 'yearly' ? base * 10 : base
}

const config = computed(() => ({
  add: {
    title: 'Add Subscription',
    icon: 'mdi-credit-card-plus-outline',
    confirmColor: 'primary',
    confirmLabel: 'Create Subscription',
  },
  edit: {
    title: 'Edit Subscription',
    icon: 'mdi-credit-card-edit-outline',
    confirmColor: 'primary',
    confirmLabel: 'Save Changes',
  },
  delete: {
    title: 'Remove Subscription',
    icon: 'mdi-delete-outline',
    confirmColor: 'error',
    confirmLabel: 'Remove',
  },
}[props.mode]))

function onSubmit() {
  if (props.mode === 'delete') {
    emit('submit', { id: props.subscription?.id })
    return
  }

  emit('submit', {
    id: props.subscription?.id,
    tenant_id: form.value.tenant_id,
    plan: form.value.plan.toLowerCase(),
    status: form.value.status,
    billing_cycle: form.value.billing_cycle,
    amount: form.value.amount,
    start_date: form.value.start_date,
    payment_method: form.value.payment_method,
  })
}
</script>

<template>
  <v-card rounded="lg" max-width="540" width="100%">
    <v-card-title class="d-flex align-center justify-space-between pa-4 pb-2">
      <div class="d-flex align-center ga-2">
        <v-icon :icon="config.icon" size="20" />
        <span class="text-h6 font-weight-bold">{{ config.title }}</span>
      </div>
      <v-btn icon="mdi-close" variant="text" density="compact" @click="emit('cancel')" />
    </v-card-title>

    <v-divider />

    <template v-if="mode === 'delete'">
      <v-card-text class="pa-5">
        <div class="d-flex flex-column align-center text-center ga-3">
          <v-avatar color="error" variant="tonal" size="56">
            <v-icon icon="mdi-delete-outline" size="28" />
          </v-avatar>
          <div>
            <p class="text-body-1 font-weight-medium">
              Are you sure you want to remove this subscription?
            </p>
            <p class="text-body-2 text-medium-emphasis mt-1">
              <strong>{{ subscription?.tenant_name }}</strong>'s {{ subscription?.plan }} plan will be terminated.
            </p>
          </div>
        </div>
      </v-card-text>
    </template>

    <template v-else>
      <v-card-text class="pa-4" style="max-height: 440px; overflow-y: auto;">
        <v-row dense>
          <v-col cols="12">
            <v-label class="text-caption font-weight-medium mb-1">Tenant</v-label>
            <v-select
              v-if="mode === 'add'"
              v-model="form.tenant_id"
              :items="availableTenants"
              item-title="name"
              item-value="id"
              placeholder="Select a tenant"
              variant="outlined"
              density="compact"
              hide-details
            />
            <v-text-field v-else :model-value="subscription?.tenant_name" variant="outlined"
              density="compact" hide-details disabled />
          </v-col>

          <v-col cols="12" sm="6" class="mt-3">
            <v-label class="text-caption font-weight-medium mb-1">Plan</v-label>
            <v-select v-model="form.plan" :items="['Starter', 'Basic', 'Professional', 'Enterprise']"
              variant="outlined" density="compact" hide-details @update:model-value="onPlanChange" />
          </v-col>

          <v-col cols="12" sm="6" class="mt-3">
            <v-label class="text-caption font-weight-medium mb-1">Status</v-label>
            <v-select v-model="form.status" :items="['active', 'suspended', 'trial', 'cancelled']"
              variant="outlined" density="compact" hide-details />
          </v-col>

          <v-col cols="12" sm="6" class="mt-3">
            <v-label class="text-caption font-weight-medium mb-1">Billing Cycle</v-label>
            <v-select v-model="form.billing_cycle" :items="['monthly', 'yearly']"
              variant="outlined" density="compact" hide-details @update:model-value="onCycleChange" />
          </v-col>

          <v-col cols="12" sm="6" class="mt-3">
            <v-label class="text-caption font-weight-medium mb-1">Amount ($)</v-label>
            <v-text-field v-model.number="form.amount" type="number" min="0" prefix="$"
              variant="outlined" density="compact" hide-details
              @keydown="e => { if (e.key === '-' || e.key === 'e' || e.key === 'E') e.preventDefault() }" />
          </v-col>

          <v-col cols="12" sm="6" class="mt-3">
            <v-label class="text-caption font-weight-medium mb-1">Start Date</v-label>
            <v-text-field v-model="form.start_date" type="date" variant="outlined"
              density="compact" hide-details />
          </v-col>

          <v-col cols="12" sm="6" class="mt-3">
            <v-label class="text-caption font-weight-medium mb-1">Payment Method</v-label>
            <v-text-field v-model="form.payment_method" placeholder="e.g. Visa, Bank Transfer"
              variant="outlined" density="compact" hide-details />
          </v-col>
        </v-row>
      </v-card-text>
    </template>

    <v-divider />

    <v-card-actions class="pa-4 pt-3">
      <v-spacer />
      <v-btn variant="tonal" color="secondary" :disabled="loading" @click="emit('cancel')">
        Cancel
      </v-btn>
      <v-btn variant="flat" :color="config.confirmColor" :loading="loading" :disabled="loading"
        :style="loading ? 'cursor: not-allowed; pointer-events: auto;' : ''" @click="onSubmit">
        {{ config.confirmLabel }}
      </v-btn>
    </v-card-actions>
  </v-card>
</template>
