<script setup lang="ts">
import { ref, watch } from 'vue'

interface Tenant {
  id: string
  name: string
  plan: string
  status: string
}

const props = defineProps<{
  tenant: Tenant | null
}>()

const emit = defineEmits<{
  (e: 'submit', data: { plan: string; status: string }): void
  (e: 'cancel'): void
}>()

const form = ref({
  plan: 'Free',
  status: 'active',
})

watch(
  () => props.tenant,
  (tenant) => {
    if (tenant) {
      form.value = { plan: tenant.plan, status: tenant.status }
    }
  },
  { immediate: true }
)

const planOptions = ['Free', 'Basic', 'Pro', 'Enterprise']
const statusOptions = ['active', 'suspended']

function onSubmit() {
  emit('submit', { plan: form.value.plan, status: form.value.status })
}
</script>

<template>
  <v-card rounded="lg" max-width="480" width="100%">
    <v-card-title class="d-flex align-center justify-space-between pa-4 pb-2">
      <div class="d-flex align-center ga-2">
        <v-icon icon="mdi-credit-card-edit-outline" size="20" />
        <span class="text-h6 font-weight-bold">Edit Subscription</span>
      </div>
      <v-btn icon="mdi-close" variant="text" density="compact" @click="emit('cancel')" />
    </v-card-title>

    <v-divider />

    <v-card-text class="pa-4">
      <div class="text-body-2 text-medium-emphasis mb-4">
        Updating subscription for <strong>{{ tenant?.name }}</strong>
      </div>
      <v-row dense>
        <v-col cols="12">
          <v-label class="text-caption font-weight-medium mb-1">Plan</v-label>
          <v-select v-model="form.plan" :items="planOptions" variant="outlined" density="compact"
            hide-details />
        </v-col>
        <v-col cols="12" class="mt-3">
          <v-label class="text-caption font-weight-medium mb-1">Status</v-label>
          <v-select v-model="form.status" :items="statusOptions" variant="outlined" density="compact"
            hide-details />
        </v-col>
      </v-row>
    </v-card-text>

    <v-divider />

    <v-card-actions class="pa-4 pt-3">
      <v-spacer />
      <v-btn variant="tonal" color="secondary" @click="emit('cancel')">Cancel</v-btn>
      <v-btn variant="flat" color="primary" @click="onSubmit">Save Changes</v-btn>
    </v-card-actions>
  </v-card>
</template>
