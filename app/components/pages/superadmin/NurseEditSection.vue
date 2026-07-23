<script setup lang="ts">
const props = defineProps<{
  tenantSlug?: string
}>()

const route = useRoute()
const entityId = route.query.entityId as string

const { data, pending } = await useFetch(`/api/nurses/${entityId}`, {
  key: `superadmin-nurse-edit-${entityId}`,
})

const nurse = computed(() => data.value)
const profile = computed(() => data.value?.profiles)

const { data: deptData } = await useFetch('/api/departments')
const departments = computed(() => deptData.value?.departments ?? [])

const saving = ref(false)
const snackbar = ref({ show: false, message: '', color: 'success' })

const form = reactive({
  phone: '',
  department_id: null as string | null,
  experience_years: null as number | null,
  is_available: true,
})

watch(data, (val) => {
  if (!val) return
  form.phone = val.phone ?? ''
  form.department_id = val.departments?.id ?? null
  form.experience_years = val.experience_years ?? null
  form.is_available = val.is_available ?? true
}, { immediate: true })

function getInitials(name?: string | null) {
  if (!name) return '?'
  return name.split(' ').map((n: string) => n[0]).slice(0, 2).join('').toUpperCase()
}

function notify(message: string, color = 'success') {
  snackbar.value = { show: true, message, color }
}

async function save() {
  saving.value = true
  try {
    await $fetch(`/api/nurses/${entityId}`, {
      method: 'PATCH' as any,
      body: {
        phone: form.phone || null,
        department_id: form.department_id || null,
        experience_years: form.experience_years,
        is_available: form.is_available,
      },
    })
    notify('Nurse profile updated')
  } catch (e: any) {
    notify(e?.data?.message ?? 'Failed to save', 'error')
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <div v-if="pending" class="d-flex justify-center py-12">
    <v-progress-circular indeterminate color="primary" />
  </div>

  <div v-else-if="!nurse" class="text-center py-12 text-medium-emphasis">
    Nurse not found
  </div>

  <template v-else>
    <v-card variant="flat" class="mb-4">
      <v-card-item class="pa-5">
        <div class="d-flex align-center ga-4">
          <v-btn icon="mdi-arrow-left" variant="text" @click="navigateTo({ query: { section: 'nurse-detail', entityId } })" />
          <v-avatar size="48" color="primary" variant="tonal">
            <v-img v-if="profile?.avatar_url" :src="profile.avatar_url" cover />
            <span v-else class="text-body-1 font-weight-bold">{{ getInitials(profile?.full_name) }}</span>
          </v-avatar>
          <div>
            <div class="text-h6 font-weight-bold">{{ profile?.full_name ?? '-' }}</div>
            <div class="text-caption text-medium-emphasis">Edit nurse profile</div>
          </div>
        </div>
      </v-card-item>
    </v-card>

    <v-row>
      <v-col cols="12" md="8">
        <v-card variant="flat">
          <v-card-item>
            <template #prepend>
              <v-avatar color="primary" variant="tonal" size="36">
                <v-icon icon="mdi-account-heart" size="20" />
              </v-avatar>
            </template>
            <v-card-title class="text-body-1">Professional Information</v-card-title>
          </v-card-item>
          <v-divider />
          <v-card-text class="pa-5">
            <v-row>
              <v-col cols="12" sm="6">
                <v-text-field v-model="form.phone" label="Phone" variant="outlined" density="comfortable" prepend-inner-icon="mdi-phone" />
              </v-col>
              <v-col cols="12" sm="6">
                <v-select v-model="form.department_id" :items="departments" item-title="name" item-value="id" label="Department" variant="outlined" density="comfortable" prepend-inner-icon="mdi-hospital-building" clearable />
              </v-col>
              <v-col cols="12" sm="6">
                <v-text-field v-model.number="form.experience_years" label="Experience (years)" type="number" variant="outlined" density="comfortable" prepend-inner-icon="mdi-briefcase" min="0" :rules="[v => v >= 0 || 'Must be non-negative']" @keydown="e => { if (e.key === '-') e.preventDefault() }" @update:model-value="val => { if (Number(val) < 0) form.experience_years = 0 }" />
              </v-col>
            </v-row>
          </v-card-text>
        </v-card>
      </v-col>
      <v-col cols="12" md="4">
        <v-card variant="flat">
          <v-card-item>
            <template #prepend>
              <v-avatar color="success" variant="tonal" size="36">
                <v-icon icon="mdi-check-circle" size="20" />
              </v-avatar>
            </template>
            <v-card-title class="text-body-1">Availability</v-card-title>
          </v-card-item>
          <v-divider />
          <v-card-text class="pa-5">
            <v-switch v-model="form.is_available" color="success" label="Nurse is available" hide-details inset />
            <div class="text-caption text-medium-emphasis mt-2">When turned off, the nurse won't be assignable to new tasks.</div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <div class="d-flex justify-end ga-2 mt-4">
      <v-btn variant="tonal" @click="navigateTo({ query: { section: 'nurse-detail', entityId } })">Cancel</v-btn>
      <v-btn color="primary" variant="flat" :loading="saving" prepend-icon="mdi-content-save" @click="save">Save Changes</v-btn>
    </div>

    <v-snackbar v-model="snackbar.show" :color="snackbar.color" location="bottom right" :timeout="3000">
      {{ snackbar.message }}
    </v-snackbar>
  </template>
</template>
