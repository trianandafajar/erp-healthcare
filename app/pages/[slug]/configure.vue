<script setup lang="ts">
import AppLogo from '~/components/AppLogo.vue'
import AuthFooter from '~/components/auth/AuthFooter.vue'

definePageMeta({
  layout: false,
  middleware: ['authorize'],
})

const route = useRoute()
const authStore = useAuthStore()
const profileStore = useProfileStore()

const brandColorInput = ref<string>('#176D37')
const displayName = ref('')
const submitting = ref(false)
const errorMsg = ref('')
const successMsg = ref('')

const tenantSlug = computed(() => (route.params.slug as string) || authStore.tenantSlug)

const previewColor = computed(() =>
  /^#[0-9a-fA-F]{6}$/.test(brandColorInput.value) ? brandColorInput.value : '#176D37'
)

// --- Logo upload (dropzone) ---
const logoFile = ref<File | null>(null)
const logoPreview = ref<string>('')
const logoError = ref('')
const logoInputRef = ref<HTMLInputElement | null>(null)
const isDragging = ref(false)

function validateFile(file: File): string | null {
  const allowed = ['image/jpeg', 'image/png', 'image/webp']
  if (!allowed.includes(file.type)) return 'Only JPG, PNG, or WebP images are allowed.'
  if (file.size > 2 * 1024 * 1024) return 'Image must be smaller than 2 MB.'
  return null
}

function applyLogoFile(file: File) {
  const err = validateFile(file)
  if (err) {
    logoError.value = err
    return
  }
  logoError.value = ''
  logoFile.value = file
  if (logoPreview.value.startsWith('blob:')) URL.revokeObjectURL(logoPreview.value)
  logoPreview.value = URL.createObjectURL(file)
}

function onLogoFileInputChange(event: Event) {
  const file = (event.target as HTMLInputElement).files?.[0]
  if (file) applyLogoFile(file)
}
function onLogoDragOver(event: DragEvent) {
  event.preventDefault()
  isDragging.value = true
}
function onLogoDragLeave() {
  isDragging.value = false
}
function onLogoDrop(event: DragEvent) {
  event.preventDefault()
  isDragging.value = false
  const file = event.dataTransfer?.files?.[0]
  if (file) applyLogoFile(file)
}
function removeLogo() {
  if (logoPreview.value.startsWith('blob:')) URL.revokeObjectURL(logoPreview.value)
  logoFile.value = null
  logoPreview.value = ''
  logoError.value = ''
  if (logoInputRef.value) logoInputRef.value.value = ''
}

onMounted(async () => {
  if (profileStore.settings?.display_name) {
    displayName.value = profileStore.settings.display_name
  }
  if (profileStore.tenant?.brand_color) {
    brandColorInput.value = profileStore.tenant.brand_color
  }
  if (profileStore.settings?.logo_url) {
    logoPreview.value = profileStore.settings.logo_url
  }
})

async function save() {
  submitting.value = true
  errorMsg.value = ''
  successMsg.value = ''

  try {
    const formData = new FormData()
    formData.append('tenant_slug', tenantSlug.value)
    formData.append('brand_color', brandColorInput.value)
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
    authStore.tenantId = profileStore.tenant?.id ?? null
    authStore.settings = profileStore.settings
    authStore.clearOnboarding()
    await navigateTo(`/${tenantSlug.value}/dashboard`)
  } catch (err: any) {
    errorMsg.value = err?.data?.message || err.message || 'Failed to save configuration'
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <v-row class="bg-containerBg position-relative" no-gutters>

    <div class="blur-logo">
      <img src="/logo.png" alt="" style="width: 700px; height: auto; opacity: 0.4;" />
    </div>

    <v-col cols="12">
      <div class="pt-6 pl-6">
        <AppLogo />
      </div>
    </v-col>

    <v-col cols="12" lg="12" class="d-flex align-center">
      <v-container>
        <div class="d-flex align-center justify-center" style="min-height: calc(100vh - 148px)">
          <v-row justify="center">
            <div class="configure-page">
              <div class="text-center mb-8">
                <h1 class="text-h3 font-weight-bold">Configure Your Clinic</h1>
                <p class="text-body-1 text-medium-emphasis mt-2">
                  Set up your brand colors and logo to personalize your workspace
                </p>
              </div>

              <v-alert v-if="errorMsg" type="error" class="mb-4" closable @update:model-value="errorMsg = ''">
                {{ errorMsg }}
              </v-alert>
              <v-alert v-if="successMsg" type="success" class="mb-4">{{ successMsg }}</v-alert>

              <v-row>
                <v-col cols="12" md="7">
                  <v-card elevation="0" variant="outlined" :style="{ borderColor: '#e0e0e0' }" class="rounded-md h-100">
                    <v-card elevation="0">
                      <v-card-item>
                        <v-card-title class="text-subtitle-1 font-weight-bold">Display Name & Logo</v-card-title>
                        <v-card-subtitle>How your clinic's app appears to your staff and patients</v-card-subtitle>
                      </v-card-item>
                      <v-divider />
                      <v-card-text>
                        <v-label class="text-caption font-weight-medium mb-1">Display Name</v-label>
                        <v-text-field v-model="displayName" placeholder="e.g. My Hospital" variant="outlined"
                          density="compact" hide-details class="mb-4" />

                        <v-label class="text-caption font-weight-medium mb-1">Logo</v-label>
                        <div class="d-flex ga-3 align-stretch">
                          <v-avatar size="72" rounded="lg" color="grey-lighten-3" class="flex-shrink-0">
                            <v-img v-if="logoPreview" :src="logoPreview" cover />
                            <v-icon v-else icon="mdi-hospital-building-outline" size="36" color="grey-lighten-1" />
                          </v-avatar>

                          <div
                            class="photo-dropzone flex-grow-1 d-flex flex-column align-center justify-center ga-1 rounded-lg"
                            style="min-height: 72px; height: 72px;"
                            :class="{ 'photo-dropzone--dragging': isDragging, 'photo-dropzone--error': !!logoError }"
                            @dragover="onLogoDragOver" @dragleave="onLogoDragLeave" @drop="onLogoDrop"
                            @click="logoInputRef?.click()">
                            <v-icon :icon="isDragging ? 'mdi-cloud-download-outline' : 'mdi-image-plus-outline'"
                              size="22" :color="isDragging ? 'primary' : 'grey'" />
                            <span class="text-caption font-weight-medium">
                              {{ isDragging ? 'Drop to upload' : 'Click or drag & drop' }}
                            </span>
                            <span class="text-caption text-medium-emphasis">JPG, PNG, WebP · Max 2 MB</span>
                          </div>

                          <input ref="logoInputRef" type="file" accept="image/jpeg,image/png,image/webp"
                            style="display: none" @change="onLogoFileInputChange" />
                        </div>

                        <div v-if="logoError" class="text-caption text-error mt-2 d-flex align-center ga-1">
                          <v-icon icon="mdi-alert-circle-outline" size="14" />
                          {{ logoError }}
                        </div>
                        <v-btn v-if="logoPreview" variant="text" color="error" size="x-small"
                          prepend-icon="mdi-delete-outline" class="mt-2" @click="removeLogo">
                          Remove image
                        </v-btn>
                      </v-card-text>
                    </v-card>
                  </v-card>
                </v-col>

                <v-col cols="12" md="5">
                  <v-card elevation="0" variant="outlined" :style="{ borderColor: '#e0e0e0' }" class="rounded-md h-100">
                    <v-card elevation="0" class="rounded-md h-100">
                      <v-card-item>
                        <v-card-title class="text-subtitle-1 font-weight-bold">Brand Color</v-card-title>
                        <v-card-subtitle>Primary accent color used across your clinic's app</v-card-subtitle>
                      </v-card-item>
                      <v-divider />
                      <v-card-text>
                        <div class="d-flex align-center ga-4 mb-4">
                          <div class="rounded-lg d-flex align-center justify-center"
                            :style="{ backgroundColor: previewColor, width: '56px', height: '56px', borderRadius: '12px', border: '2px solid #e0e0e0' }" />
                          <div>
                            <div class="text-body-2 font-weight-medium">Preview</div>
                            <div class="text-caption text-medium-emphasis" style="font-family: monospace;">{{
                              previewColor
                            }}</div>
                            <v-chip v-if="previewColor === '#176D37'" size="x-small" color="grey" variant="tonal"
                              class="mt-1">
                              Default
                            </v-chip>
                          </div>
                        </div>
                        <div class="d-flex align-center ga-2">
                          <input v-model="brandColorInput" type="color"
                            style="width: 40px; height: 40px; border: 2px solid #e0e0e0; border-radius: 8px; cursor: pointer; padding: 2px; background: none;" />
                          <v-text-field v-model="brandColorInput" variant="outlined" density="compact" hide-details
                            placeholder="#176D37" class="flex-grow-1" />
                          <v-btn variant="tonal" color="grey" size="small" :disabled="brandColorInput === '#176D37'"
                            @click="brandColorInput = '#176D37'">
                            Reset
                          </v-btn>
                        </div>
                      </v-card-text>
                    </v-card>
                  </v-card>
                </v-col>
              </v-row>

              <div class="d-flex justify-end mt-4">
                <v-btn color="primary" variant="flat" size="large" :loading="submitting" :disabled="!displayName.trim()" @click="save" :style="submitting || !displayName.trim() ? 'cursor: not-allowed; pointer-events: auto;' : ''">
                  Save & Continue
                </v-btn>
              </div>
            </div>
          </v-row>
        </div>
      </v-container>
    </v-col>

    <v-col cols="12">
      <v-container class="pt-0 pb-4">
        <AuthFooter />
      </v-container>
    </v-col>

  </v-row>
</template>

<style lang="scss">
.blur-logo {
  position: absolute;
  filter: blur(15px);
  top: 50%;
  left: 10%;
  transform: translate(-50%, -50%);
  pointer-events: none;
}

.configure-page {
  max-width: 900px;
  margin: 0 auto;
  padding: 48px 24px;
}

.photo-dropzone {
  border: 2px dashed rgba(var(--v-border-color), 0.4);
  cursor: pointer;
  transition: border-color 0.2s, background-color 0.2s;
  text-align: center;
  overflow: hidden;
}

.photo-dropzone:hover {
  border-color: rgb(var(--v-theme-primary));
  background-color: rgba(var(--v-theme-primary), 0.04);
}

.photo-dropzone--dragging {
  border-color: rgb(var(--v-theme-primary));
  background-color: rgba(var(--v-theme-primary), 0.08);
}

.photo-dropzone--error {
  border-color: rgb(var(--v-theme-error));
}
</style>