<script setup lang="ts">
import { useTheme } from 'vuetify'

definePageMeta({
    layout: 'default',
    middleware: ['auth'],
})

useSeoMeta({
    title: 'Settings',
})

const profileStore = useProfileStore()
const theme = useTheme()

const tab = ref('appearance')

const brandColor = ref(profileStore.data?.tenant?.brand_color || '#176D37')
const saving = ref(false)
const snackbar = ref(false)
const snackbarMsg = ref('')
const snackbarColor = ref('success')

watch(() => profileStore.data?.tenant?.brand_color, (color) => {
    if (color) brandColor.value = color
})

const previewColor = computed(() => {
    return /^#[0-9a-fA-F]{6}$/.test(brandColor.value) ? brandColor.value : '#176D37'
})

async function saveBrandColor() {
    if (!/^#[0-9a-fA-F]{6}$/.test(brandColor.value)) return
    saving.value = true
    try {
        await $fetch('/api/tenant/brand-color', {
            method: 'PUT',
            body: { brand_color: brandColor.value },
        })
        profileStore.refreshProfile()
        snackbarMsg.value = 'Brand color updated successfully'
        snackbarColor.value = 'success'
        snackbar.value = true
    } catch (e: any) {
        snackbarMsg.value = e?.data?.message || 'Failed to update brand color'
        snackbarColor.value = 'error'
        snackbar.value = true
    } finally {
        saving.value = false
    }
}

const presets = ['#176D37', '#1976d2', '#1565c0', '#7b1fa2', '#c62828', '#e65100', '#2e7d32', '#00838f', '#4e342e', '#37474f']
</script>

<template>
    <div class="d-flex align-center ga-2 mb-1">
        <v-icon icon="mdi-cog-outline" size="24" color="primary" />
        <div class="text-h5 font-weight-bold">Settings</div>
    </div>
    <div class="text-caption text-medium-emphasis mb-5">Manage your tenant preferences and appearance</div>

    <v-card elevation="0" class="rounded-md">
        <v-tabs v-model="tab" color="primary" class="px-4 pt-2">
            <v-tab value="appearance" class="text-none">
                <v-icon start icon="mdi-palette" size="18" />
                Appearance
            </v-tab>
            <v-tab value="general" class="text-none" disabled>
                <v-icon start icon="mdi-information-outline" size="18" />
                General
            </v-tab>
        </v-tabs>
        <v-divider />

        <v-card-text class="pa-6">
            <v-window v-model="tab">
                <v-window-item value="appearance">
                    <div class="d-flex flex-column flex-lg-row ga-8">
                        <div class="flex-grow-1">
                            <h3 class="text-h6 font-weight-bold mb-1">Brand Color</h3>
                            <p class="text-body-2 text-medium-emphasis mb-5">
                                Set the primary color for your tenant's dashboard. This will be applied across all
                                pages.
                            </p>

                            <div class="mb-5">
                                <v-label class="text-caption font-weight-medium mb-2">Color presets</v-label>
                                <div class="d-flex flex-wrap ga-2">
                                    <button v-for="color in presets" :key="color" class="rounded-lg cursor-pointer"
                                        :style="{
                                            width: '36px', height: '36px', backgroundColor: color,
                                            borderRadius: '8px', border: brandColor === color ? '3px solid #333' : '2px solid #e0e0e0',
                                            cursor: 'pointer', outline: 'none',
                                        }" @click="brandColor = color" />
                                </div>
                            </div>

                            <div class="d-flex align-end ga-4 mb-6">
                                <div>
                                    <v-label class="text-caption font-weight-medium mb-2">Custom color</v-label>
                                    <div class="d-flex align-center ga-2">
                                        <input type="color" v-model="brandColor"
                                            style="width: 44px; height: 44px; border: 2px solid #e0e0e0; border-radius: 8px; cursor: pointer; padding: 2px; background: none;" />
                                        <v-text-field v-model="brandColor" variant="outlined" density="compact"
                                            hide-details placeholder="#176D37" style="max-width: 160px;"
                                            :rules="[(v: string) => /^#[0-9a-fA-F]{6}$/.test(v) || 'Invalid hex']" />
                                    </div>
                                </div>
                                <v-btn variant="tonal" color="grey" size="small" @click="brandColor = '#176D37'"
                                    :disabled="brandColor === '#176D37'">
                                    Reset
                                </v-btn>
                            </div>

                            <v-divider class="mb-4" />

                            <div class="d-flex align-center ga-3">
                                <v-btn variant="flat" color="primary" :loading="saving" @click="saveBrandColor"
                                    :style="saving || brandColor === profileStore.data?.tenant?.brand_color ? 'cursor: not-allowed; pointer-events: auto;' : ''"
                                    :disabled="brandColor === profileStore.data?.tenant?.brand_color || saving ">
                                    <v-icon start icon="mdi-content-save" size="18" />
                                    Save Changes
                                </v-btn>
                                <v-btn variant="tonal" color="secondary"
                                    @click="brandColor = profileStore.data?.tenant?.brand_color || '#176D37'"
                                    :disabled="brandColor === (profileStore.data?.tenant?.brand_color || '#176D37')">
                                    Cancel
                                </v-btn>
                            </div>
                        </div>

                        <div class="flex-shrink-0">
                            <v-card variant="outlined" class="rounded-lg" max-width="220">
                                <v-card-item class="pb-2">
                                    <v-card-title class="text-subtitle-2 font-weight-bold">Preview</v-card-title>
                                </v-card-item>
                                <v-divider />
                                <v-card-text class="d-flex flex-column align-center py-5">
                                    <div class="rounded-xl mb-3 d-flex align-center justify-center"
                                        :style="{ backgroundColor: previewColor, width: '80px', height: '80px', borderRadius: '16px' }">
                                        <v-icon icon="mdi-hospital-building" size="32" color="white" />
                                    </div>
                                    <div class="text-body-2 font-weight-medium mb-1">Primary Color</div>
                                    <div class="text-caption font-mono" style="font-family: monospace;">{{ previewColor
                                        }}</div>
                                    <div class="d-flex ga-1 mt-2">
                                        <v-chip size="x-small" :color="previewColor" variant="flat">Button</v-chip>
                                        <v-chip size="x-small" :color="previewColor" variant="tonal">Chip</v-chip>
                                    </div>
                                </v-card-text>
                            </v-card>
                        </div>
                    </div>
                </v-window-item>

                <v-window-item value="general">
                    <div class="text-center py-12 text-medium-emphasis">
                        <v-icon icon="mdi-cog-outline" size="40" class="mb-2" />
                        <div class="text-body-1">General settings coming soon</div>
                        <div class="text-caption mt-1">Manage tenant name, timezone, and more.</div>
                    </div>
                </v-window-item>
            </v-window>
        </v-card-text>
    </v-card>

    <v-snackbar v-model="snackbar" :color="snackbarColor" location="bottom right" timeout="3000">
        {{ snackbarMsg }}
        <template #actions>
            <v-btn variant="text" icon="mdi-close" @click="snackbar = false" />
        </template>
    </v-snackbar>
</template>
