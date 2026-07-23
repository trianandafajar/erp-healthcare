<script setup lang="ts">
const props = defineProps<{
  tenantSlug?: string
}>()

const route = useRoute()
const entityId = route.query.entityId as string

const { data, pending } = await useFetch(`/api/departments/${entityId}`, {
  key: `superadmin-dept-edit-${entityId}`,
})

const department = computed(() => data.value)

const saving = ref(false)
const snackbar = ref({ show: false, message: '', color: 'success' })

const form = reactive({
  name: '',
  code: '',
  description: '',
})

watch(data, (val) => {
  if (!val) return
  form.name = val.name ?? ''
  form.code = val.code ?? ''
  form.description = val.description ?? ''
}, { immediate: true })

function notify(message: string, color = 'success') {
  snackbar.value = { show: true, message, color }
}

async function save() {
  saving.value = true
  try {
    await $fetch(`/api/departments/${entityId}`, {
      method: 'PATCH' as any,
      body: {
        name: form.name,
        code: form.code || null,
        description: form.description || null,
      },
    })
    notify('Department updated')
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

  <div v-else-if="!department" class="text-center py-12 text-medium-emphasis">
    Department not found
  </div>

  <template v-else>
    <v-card variant="flat" class="mb-4">
      <v-card-item class="pa-5">
        <div class="d-flex align-center ga-4">
          <v-btn icon="mdi-arrow-left" variant="text" @click="navigateTo({ query: { section: 'department-detail', entityId } })" />
          <v-avatar size="48" color="primary" variant="tonal">
            <v-icon icon="mdi-hospital-building" size="24" />
          </v-avatar>
          <div>
            <div class="text-h6 font-weight-bold">{{ department.name }}</div>
            <div class="text-caption text-medium-emphasis">Edit department</div>
          </div>
        </div>
      </v-card-item>
    </v-card>

    <v-card variant="flat">
      <v-card-item>
        <template #prepend>
          <v-avatar color="primary" variant="tonal" size="36">
            <v-icon icon="mdi-hospital-building" size="20" />
          </v-avatar>
        </template>
        <v-card-title class="text-body-1">Department Information</v-card-title>
      </v-card-item>
      <v-divider />
      <v-card-text class="pa-5">
        <v-row>
          <v-col cols="12" sm="6">
            <v-text-field v-model="form.name" label="Department Name" variant="outlined" density="comfortable" prepend-inner-icon="mdi-hospital-building" />
          </v-col>
          <v-col cols="12" sm="6">
            <v-text-field v-model="form.code" label="Code" variant="outlined" density="comfortable" prepend-inner-icon="mdi-tag" />
          </v-col>
          <v-col cols="12">
            <v-textarea v-model="form.description" label="Description" variant="outlined" density="comfortable" rows="4" prepend-inner-icon="mdi-text-account" auto-grow />
          </v-col>
        </v-row>
      </v-card-text>
    </v-card>

    <div class="d-flex justify-end ga-2 mt-4">
      <v-btn variant="tonal" @click="navigateTo({ query: { section: 'department-detail', entityId } })">Cancel</v-btn>
      <v-btn color="primary" variant="flat" :loading="saving" prepend-icon="mdi-content-save" @click="save">Save Changes</v-btn>
    </div>

    <v-snackbar v-model="snackbar.show" :color="snackbar.color" location="bottom right" :timeout="3000">
      {{ snackbar.message }}
    </v-snackbar>
  </template>
</template>
