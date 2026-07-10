<script setup lang="ts">
definePageMeta({
  layout: 'blank',
  middleware: ['auth'],
})

const route = useRoute()
const authStore = useAuthStore()
const profileStore = useProfileStore()

const brandColor = ref<string>('#176D37')
const displayName = ref('')
const logoPreview = ref<string | null>(null)
const logoFile = ref<File | null>(null)
const submitting = ref(false)
const errorMsg = ref('')
const successMsg = ref('')

const tenantSlug = computed(() => (route.params.slug as string) || authStore.tenantSlug)

onMounted(async () => {
  if (profileStore.settings?.display_name) {
    displayName.value = profileStore.settings.display_name
  }
  if (profileStore.tenant?.brand_color) {
    brandColor.value = profileStore.tenant.brand_color
  }
  if (profileStore.settings?.logo_url) {
    logoPreview.value = profileStore.settings.logo_url
  }
})

function onLogoSelected(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return

  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp']
  if (!allowedTypes.includes(file.type)) {
    errorMsg.value = 'Invalid file type. Only JPG, PNG, or WebP are allowed.'
    return
  }

  if (file.size > 2 * 1024 * 1024) {
    errorMsg.value = 'File too large. Maximum size is 2 MB.'
    return
  }

  logoFile.value = file
  const reader = new FileReader()
  reader.onload = (e) => {
    logoPreview.value = e.target?.result as string
  }
  reader.readAsDataURL(file)
  errorMsg.value = ''
}

async function save() {
  submitting.value = true
  errorMsg.value = ''
  successMsg.value = ''

  try {
    const formData = new FormData()
    formData.append('tenant_slug', tenantSlug.value)
    formData.append('brand_color', brandColor.value)
    if (displayName.value) {
      formData.append('display_name', displayName.value)
    }
    if (logoFile.value) {
      formData.append('logo', logoFile.value)
    }

    await $fetch('/api/tenant/configure', {
      method: 'PATCH',
      body: formData,
    })

    successMsg.value = 'Configuration saved!'
    await profileStore.refreshProfile()
    authStore.settings = profileStore.settings
    await navigateTo(`/${tenantSlug.value}/dashboard`)
  } catch (err: any) {
    errorMsg.value = err?.data?.message || err.message || 'Failed to save configuration'
  } finally {
    submitting.value = false
  }
}

function resetLogo() {
  logoPreview.value = null
  logoFile.value = null
}
</script>

<template>
  <div class="configure-page">
    <div class="text-center mb-8">
      <h1 class="text-h3 font-weight-bold">Configure Your Clinic</h1>
      <p class="text-body-1 text-medium-emphasis mt-2">Set up your brand colors and logo to personalize your workspace</p>
    </div>

    <v-alert v-if="errorMsg" type="error" class="mb-4" closable @update:model-value="errorMsg = ''">{{ errorMsg }}</v-alert>
    <v-alert v-if="successMsg" type="success" class="mb-4">{{ successMsg }}</v-alert>

    <v-card max-width="600" class="mx-auto" :elevation="2">
      <v-card-text class="pa-6">
        <v-row>
          <v-col cols="12">
            <label class="text-subtitle-2 font-weight-bold mb-2 d-block">Brand Color</label>
            <div class="d-flex align-center ga-4">
              <v-color-picker v-model="brandColor" mode="hex" hide-canvas hide-inputs :swatches="[
                ['#176D37', '#1976d2', '#7b1fa2', '#c62828', '#e65100'],
                ['#00838f', '#37474f', '#2e7d32', '#4a148c', '#01579b'],
                ['#bf360c', '#1b5e20', '#311b92', '#00695c', '#b71c1c'],
                ['#283593', '#827717', '#4e342e', '#5d4037', '#1565c0'],
              ]" class="flex-shrink-0" />
              <div class="d-flex flex-column align-center ga-2">
                <div class="color-preview" :style="{ backgroundColor: brandColor }"></div>
                <span class="text-caption font-weight-mono">{{ brandColor }}</span>
              </div>
            </div>
          </v-col>

          <v-col cols="12">
            <label class="text-subtitle-2 font-weight-bold mb-2 d-block">Display Name</label>
            <v-text-field
              v-model="displayName"
              placeholder="Your clinic or hospital name"
              variant="outlined"
              hide-details="auto"
            />
          </v-col>

          <v-col cols="12">
            <label class="text-subtitle-2 font-weight-bold mb-2 d-block">Company Logo</label>
            <div class="d-flex align-center ga-4">
              <div class="logo-upload-area" @click="$refs.logoInput.click()">
                <img v-if="logoPreview" :src="logoPreview" alt="Logo preview" class="logo-preview" />
                <div v-else class="logo-placeholder">
                  <v-icon size="48" color="grey">mdi-camera-plus</v-icon>
                  <span class="text-caption text-grey mt-1">Click to upload</span>
                </div>
              </div>
              <div>
                <v-btn variant="outlined" size="small" @click="$refs.logoInput.click()">Choose File</v-btn>
                <v-btn v-if="logoPreview" variant="text" size="small" color="error" @click="resetLogo" class="ml-2">Remove</v-btn>
                <input
                  ref="logoInput"
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  class="d-none"
                  @change="onLogoSelected"
                />
                <p class="text-caption text-grey mt-1">JPG, PNG or WebP. Max 2 MB.</p>
              </div>
            </div>
          </v-col>
        </v-row>
      </v-card-text>

      <v-divider></v-divider>

      <v-card-actions class="pa-6">
        <v-spacer />
        <v-btn
          color="primary"
          variant="flat"
          size="large"
          :loading="submitting"
          @click="save"
        >
          Save & Continue
        </v-btn>
      </v-card-actions>
    </v-card>
  </div>
</template>

<style scoped>
.configure-page {
  max-width: 900px;
  margin: 0 auto;
  padding: 48px 24px;
}

.color-preview {
  width: 48px;
  height: 48px;
  border-radius: 8px;
  border: 2px solid #e0e0e0;
}

.logo-upload-area {
  width: 120px;
  height: 120px;
  border: 2px dashed #ccc;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  overflow: hidden;
  transition: border-color 0.2s;
}

.logo-upload-area:hover {
  border-color: rgb(var(--v-theme-primary));
}

.logo-preview {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
}

.logo-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}
</style>
