<script setup lang="ts">
import { SaveOutlined, LockOutlined, MailOutlined, UserOutlined } from '@ant-design/icons-vue'

definePageMeta({
    middleware: ['authorize', 'profile-layout'],
})

useSeoMeta({ title: 'My Profile' })

const profileStore = useProfileStore()
const authStore = useAuthStore()

const profile = computed(() => profileStore.profile)
const roles = computed(() => profileStore.roles)

const avatarCacheBust = ref(Date.now())
const avatarUrl = computed(() => {
    const url = profile.value?.avatar_url
    if (!url) return null
    return `${url}?t=${avatarCacheBust.value}`
})

// form
const isSaving = ref(false)
const saveSuccess = ref(false)
const form = ref({ full_name: profile.value?.full_name ?? '' })

watch(() => profile.value?.full_name, (name) => {
    form.value.full_name = name ?? ''
})

async function saveProfile() {
    if (!form.value.full_name.trim()) return
    isSaving.value = true
    saveSuccess.value = false
    try {
        await $fetch('/api/profile', { method: 'PATCH', body: { full_name: form.value.full_name } })
        await profileStore.fetchProfile(true)
        saveSuccess.value = true
        setTimeout(() => saveSuccess.value = false, 3000)
    } catch (e) {
        console.error(e)
    } finally {
        isSaving.value = false
    }
}

function getInitials(name: string) {
    return (name || '-').split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase()
}

// avatar upload
const avatarInput = ref<HTMLInputElement | null>(null)
const isUploadingAvatar = ref(false)

function triggerAvatarUpload() {
    avatarInput.value?.click()
}

async function onAvatarChange(e: Event) {
    const file = (e.target as HTMLInputElement).files?.[0]
    if (!file) return
    isUploadingAvatar.value = true
    try {
        const formData = new FormData()
        formData.append('file', file)

        const res = await fetch('/api/profile/avatar', {
            method: 'POST',
            body: formData,
        })

        if (!res.ok) throw await res.json()

        await profileStore.fetchProfile(true)
        avatarCacheBust.value = Date.now()
    } catch (err) {
        console.error(err)
    } finally {
        isUploadingAvatar.value = false
        if (avatarInput.value) avatarInput.value.value = ''
    }
}

// password
const showPasswordPanel = ref(false)
const isChangingPassword = ref(false)
const passwordSuccess = ref(false)
const passwordError = ref('')
const passwordForm = ref({ currentPassword: '', newPassword: '', confirmPassword: '' })

function togglePasswordPanel() {
    if (!showPasswordPanel.value) {
        passwordForm.value = { currentPassword: '', newPassword: '', confirmPassword: '' }
        passwordError.value = ''
        passwordSuccess.value = false
    }
    showPasswordPanel.value = !showPasswordPanel.value
}

async function submitPasswordChange() {
    passwordError.value = ''
    const { currentPassword, newPassword, confirmPassword } = passwordForm.value
    if (!currentPassword || !newPassword) { passwordError.value = 'All fields are required'; return }
    if (newPassword !== confirmPassword) { passwordError.value = 'Passwords do not match'; return }
    if (newPassword.length < 6) { passwordError.value = 'Minimum 6 characters'; return }

    isChangingPassword.value = true
    try {
        await $fetch('/api/profile/change-password', { method: 'POST', body: { currentPassword, newPassword } })
        passwordForm.value = { currentPassword: '', newPassword: '', confirmPassword: '' }
        passwordSuccess.value = true
        setTimeout(() => { passwordSuccess.value = false; showPasswordPanel.value = false }, 2000)
    } catch (e: any) {
        passwordError.value = e?.data?.message ?? 'Failed to change password'
    } finally {
        isChangingPassword.value = false
    }
}
</script>

<template>
    <input ref="avatarInput" type="file" accept="image/*" class="d-none" @change="onAvatarChange" />

    <!-- Page header -->
    <v-card-item class="pb-2 px-0 pt-0">
        <v-card-title class="text-h3">My Profile</v-card-title>
        <v-card-subtitle class="mt-1">Manage your personal information and account settings</v-card-subtitle>
    </v-card-item>

    <v-row>
        <!-- Left: Avatar card -->
        <v-col cols="12" md="4">
            <v-card rounded="md" variant="outlined" :style="{ borderColor: '#e0e0e0' }">
                <v-card elevation="0" class="text-center pa-6">
                    <div class="d-flex justify-center mb-4">
                        <v-hover v-slot="{ isHovering, props: hoverProps }">
                            <v-avatar v-bind="hoverProps" size="96" :color="profile?.avatar_url ? undefined : 'primary'"
                                variant="tonal" style="cursor: pointer; position: relative"
                                @click="triggerAvatarUpload">
                                <v-img v-if="profile?.avatar_url" :src="avatarUrl" cover />
                                <span v-else class="text-h5 font-weight-bold">
                                    {{ getInitials(profile?.full_name ?? '') }}
                                </span>

                                <v-overlay :model-value="isHovering || isUploadingAvatar" contained
                                    class="align-center justify-center">
                                    <v-progress-circular v-if="isUploadingAvatar" indeterminate size="24"
                                        color="white" />
                                    <v-icon v-else icon="mdi-camera" color="white" size="28" />
                                </v-overlay>
                            </v-avatar>
                        </v-hover>
                    </div>

                    <p class="text-h6 font-weight-medium mb-1">{{ profile?.full_name ?? '-' }}</p>
                    <p class="text-caption text-medium-emphasis mb-3">{{ profile?.email }}</p>

                    <div class="d-flex justify-center flex-wrap ga-1 mb-2">
                        <v-chip size="small" :color="profile?.status === 'active' ? 'success' : 'secondary'"
                            variant="tonal">
                            {{ profile?.status ?? 'inactive' }}
                        </v-chip>
                        <v-chip v-for="role in roles" :key="role.id" size="small" variant="outlined">
                            {{ role.label }}
                        </v-chip>
                    </div>

                    <p class="text-caption text-medium-emphasis mt-2">Click photo to change</p>
                </v-card>
            </v-card>
        </v-col>

        <!-- Right: Forms -->
        <v-col cols="12" md="8">
            <!-- Profile info -->
            <v-card rounded="md" class="mb-4" variant="outlined" :style="{ borderColor: '#e0e0e0' }">
                <v-card elevation="0">
                    <v-card-item>
                        <v-card-title class="text-subtitle-1 font-weight-medium">
                            <UserOutlined class="mr-2" style="font-size: 14px" />
                            Profile Information
                        </v-card-title>
                    </v-card-item>

                    <v-divider />

                    <div class="pa-4">
                        <v-alert v-if="saveSuccess" type="success" variant="tonal" density="compact" class="mb-4">
                            Profile updated successfully
                        </v-alert>

                        <v-text-field v-model="form.full_name" label="Full Name" variant="outlined"
                            density="comfortable" hide-details="auto" class="mb-3" />

                        <v-text-field :model-value="profile?.email" label="Email" variant="outlined"
                            density="comfortable" hide-details="auto" readonly :prepend-inner-icon="MailOutlined">
                            <template #append-inner>
                                <v-chip size="x-small" variant="tonal" color="secondary">Read only</v-chip>
                            </template>
                        </v-text-field>
                    </div>

                    <v-divider />
                    <div class="pa-4 d-flex justify-end">
                        <v-btn variant="flat" color="primary" :loading="isSaving" @click="saveProfile">
                            <SaveOutlined class="v-icon--start" /> Save changes
                        </v-btn>
                    </div>
                </v-card>
            </v-card>

            <!-- Change password -->
            <v-card rounded="md" variant="outlined" :style="{ borderColor: '#e0e0e0' }">
                <v-card elevation="0">
                    <div class="d-flex align-center justify-space-between pa-4" style="cursor: pointer"
                        @click="togglePasswordPanel">
                        <div class="d-flex align-center ga-2">
                            <LockOutlined style="font-size: 16px" />
                            <span class="text-subtitle-1 font-weight-medium">Change Password</span>
                        </div>
                        <v-icon :icon="showPasswordPanel ? 'mdi-chevron-up' : 'mdi-chevron-down'" size="18" />
                    </div>

                    <v-expand-transition>
                        <div v-if="showPasswordPanel">
                            <v-divider />

                            <div class="pa-4">
                                <v-alert v-if="passwordError" type="error" variant="tonal" density="compact"
                                    class="mb-3">
                                    {{ passwordError }}
                                </v-alert>
                                <v-alert v-if="passwordSuccess" type="success" variant="tonal" density="compact"
                                    class="mb-3">
                                    Password changed successfully
                                </v-alert>

                                <v-text-field v-model="passwordForm.currentPassword" label="Current Password"
                                    type="password" variant="outlined" density="comfortable" class="mb-2" />
                                <v-row dense>
                                    <v-col cols="12" sm="6">
                                        <v-text-field v-model="passwordForm.newPassword" label="New Password"
                                            type="password" variant="outlined" density="comfortable" />
                                    </v-col>
                                    <v-col cols="12" sm="6">
                                        <v-text-field v-model="passwordForm.confirmPassword"
                                            label="Confirm New Password" type="password" variant="outlined"
                                            density="comfortable" />
                                    </v-col>
                                </v-row>
                            </div>

                            <v-divider />
                            <div class="pa-4 d-flex justify-end">
                                <v-btn variant="flat" color="primary" :loading="isChangingPassword"
                                    @click="submitPasswordChange">
                                    <SaveOutlined class="v-icon--start" /> Update Password
                                </v-btn>
                            </div>
                        </div>
                    </v-expand-transition>
                </v-card>
            </v-card>
        </v-col>
    </v-row>
</template>