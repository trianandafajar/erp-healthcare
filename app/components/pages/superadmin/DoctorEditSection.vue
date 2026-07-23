<script setup lang="ts">
const props = defineProps<{
  tenantSlug?: string
}>()

const route = useRoute()
const entityId = route.query.entityId as string

const { data, pending } = await useFetch(`/api/doctors/${entityId}`, {
  key: `superadmin-doctor-edit-${entityId}`,
})

const doctor = computed(() => data.value)
const profile = computed(() => data.value?.profiles)

const { data: departmentsData } = await useFetch('/api/departments')
const departments = computed(() => departmentsData.value?.departments ?? [])

const saving = ref(false)
const snackbar = ref({ show: false, message: '', color: 'success' })

const form = reactive({
  specialization: '',
  sip_number: '',
  str_number: '',
  phone: '',
  department_id: '',
  biography: '',
  experience_years: null as number | null,
  consultation_fee: null as number | null,
  is_available: true,
})

watch(data, (val) => {
  if (!val) return
  form.specialization = val.specialization ?? ''
  form.sip_number = val.sip_number ?? ''
  form.str_number = val.str_number ?? ''
  form.phone = val.phone ?? ''
  form.department_id = val.departments?.id ?? ''
  form.biography = val.biography ?? ''
  form.experience_years = val.experience_years ?? null
  form.consultation_fee = val.consultation_fee ?? null
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
    await $fetch(`/api/doctors/${entityId}`, {
      method: 'PATCH' as any,
      body: {
        specialization: form.specialization || null,
        sip_number: form.sip_number || null,
        str_number: form.str_number || null,
        phone: form.phone || null,
        department_id: form.department_id || null,
        biography: form.biography || null,
        experience_years: form.experience_years,
        consultation_fee: form.consultation_fee,
        is_available: form.is_available,
      },
    })
    notify('Doctor profile updated')
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

  <div v-else-if="!doctor" class="text-center py-12 text-medium-emphasis">
    Doctor not found
  </div>

  <template v-else>
    <v-card variant="flat" class="mb-4">
      <v-card-item class="pa-5">
        <div class="d-flex align-center ga-4">
          <v-btn icon="mdi-arrow-left" variant="text" @click="navigateTo({ query: { section: 'doctor-detail', entityId } })" />
          <v-avatar size="48" color="primary" variant="tonal">
            <v-img v-if="profile?.avatar_url" :src="profile.avatar_url" cover />
            <span v-else class="text-body-1 font-weight-bold">{{ getInitials(profile?.full_name) }}</span>
          </v-avatar>
          <div>
            <div class="text-h6 font-weight-bold">{{ profile?.full_name ?? '-' }}</div>
            <div class="text-caption text-medium-emphasis">Edit doctor profile</div>
          </div>
        </div>
      </v-card-item>
    </v-card>

    <v-row>
      <v-col cols="12" md="8">
        <v-card variant="flat" class="mb-4">
          <v-card-item>
            <template #prepend>
              <v-avatar color="primary" variant="tonal" size="36">
                <v-icon icon="mdi-stethoscope" size="20" />
              </v-avatar>
            </template>
            <v-card-title class="text-body-1">Professional Information</v-card-title>
          </v-card-item>
          <v-divider />
          <v-card-text class="pa-5">
            <v-row>
              <v-col cols="12" sm="6">
                <v-text-field v-model="form.specialization" label="Specialization" variant="outlined" density="comfortable" prepend-inner-icon="mdi-medical-bag" />
              </v-col>
              <v-col cols="12" sm="6">
                <v-select v-model="form.department_id" :items="departments" item-title="name" item-value="id" label="Department" variant="outlined" density="comfortable" prepend-inner-icon="mdi-hospital-building" clearable />
              </v-col>
              <v-col cols="12" sm="6">
                <v-text-field v-model="form.sip_number" label="SIP Number" variant="outlined" density="comfortable" prepend-inner-icon="mdi-card-account-details" />
              </v-col>
              <v-col cols="12" sm="6">
                <v-text-field v-model="form.phone" label="Phone" variant="outlined" density="comfortable" prepend-inner-icon="mdi-phone" />
              </v-col>
              <v-col cols="12" sm="6">
                <v-text-field v-model.number="form.experience_years" label="Experience (years)" type="number" variant="outlined" density="comfortable" prepend-inner-icon="mdi-briefcase" min="0" />
              </v-col>
              <v-col cols="12" sm="6">
                <v-text-field v-model.number="form.consultation_fee" label="Consultation Fee (USD)" type="number" variant="outlined" density="comfortable" prepend-inner-icon="mdi-cash" min="0" />
              </v-col>
              <v-col cols="12">
                <v-textarea v-model="form.biography" label="Biography" variant="outlined" density="comfortable" rows="4" prepend-inner-icon="mdi-text-account" auto-grow />
              </v-col>
              <v-col cols="12" sm="6">
                <v-text-field v-model="form.str_number" label="STR Number" variant="outlined" density="comfortable" prepend-inner-icon="mdi-shield-check" />
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
            <v-switch v-model="form.is_available" color="success" label="Doctor is available" hide-details inset />
            <div class="text-caption text-medium-emphasis mt-2">When turned off, the doctor won't appear in appointment booking.</div>
          </v-card-text>
        </v-card>

        <v-card variant="flat" class="mt-4">
          <v-card-text class="pa-5">
            <v-btn block color="primary" size="large" prepend-icon="mdi-content-save" :loading="saving" @click="save">Save Changes</v-btn>
            <v-btn block variant="tonal" class="mt-2" @click="navigateTo({ query: { section: 'doctor-detail', entityId } })">Cancel</v-btn>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <v-snackbar v-model="snackbar.show" :color="snackbar.color" location="bottom right" :timeout="3000">
      {{ snackbar.message }}
    </v-snackbar>
  </template>
</template>
