<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { EditOutlined, CloseOutlined, SaveOutlined, LockOutlined, MailOutlined } from '@ant-design/icons-vue'

const props = defineProps<{
    modelValue: boolean
    mode: 'view' | 'edit'
    profile?: { full_name?: string; email?: string; status?: string } | null
    roles?: { id: string; label: string }[]
}>()

const emit = defineEmits<{
    'update:modelValue': [value: boolean]
    refresh: []
}>()

const isOpen = computed({
    get: () => props.modelValue,
    set: (v) => emit('update:modelValue', v),
})

const isEditing = ref(props.mode === 'edit')
const isSaving = ref(false)
const form = ref({ full_name: '' })

watch(() => props.modelValue, (open) => {
    if (open) {
        isEditing.value = props.mode === 'edit'
        form.value.full_name = props.profile?.full_name ?? ''
        showPasswordPanel.value = false
    }
})

function cancelEdit() {
    form.value.full_name = props.profile?.full_name ?? ''
    isEditing.value = false
}

async function saveProfile() {
    if (!form.value.full_name.trim()) return
    isSaving.value = true
    try {
        await $fetch('/api/profile', { method: 'PATCH', body: { full_name: form.value.full_name } })
        emit('refresh')
        isEditing.value = false
    } catch (e) {
        console.error(e)
    } finally {
        isSaving.value = false
    }
}

function getInitials(name: string) {
    return (name || '-').split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase()
}

const showPasswordPanel = ref(false)
const isChangingPassword = ref(false)
const passwordError = ref('')
const passwordForm = ref({ currentPassword: '', newPassword: '', confirmPassword: '' })

function togglePasswordPanel() {
    if (!showPasswordPanel.value) {
        passwordForm.value = { currentPassword: '', newPassword: '', confirmPassword: '' }
        passwordError.value = ''
    }
    showPasswordPanel.value = !showPasswordPanel.value
}

async function submitPasswordChange() {
    passwordError.value = ''
    const { currentPassword, newPassword, confirmPassword } = passwordForm.value

    if (!currentPassword || !newPassword) {
        passwordError.value = 'All fields are required'
        return
    }
    if (newPassword !== confirmPassword) {
        passwordError.value = 'New password and confirmation do not match'
        return
    }
    if (newPassword.length < 6) {
        passwordError.value = 'New password must be at least 6 characters'
        return
    }

    isChangingPassword.value = true
    try {
        await $fetch('/api/profile/change-password', {
            method: 'POST',
            body: { currentPassword, newPassword },
        })
        showPasswordPanel.value = false
    } catch (e: any) {
        passwordError.value = e?.data?.message ?? 'Failed to change password'
    } finally {
        isChangingPassword.value = false
    }
}
</script>

<template>
    <v-navigation-drawer v-model="isOpen" location="right" temporary width="500" style="z-index: 3000">
        <div class="d-flex align-center justify-space-between pa-4 border-b">
            <span class="text-h6 font-weight-bold">My Profile</span>
            <v-btn icon="mdi-close" variant="text" density="comfortable" @click="isOpen = false" />
        </div>

        <div class="scroll-shell" style="height: calc(100vh - 64px); overflow-y: auto;">
            <div class="pa-4 text-center border-b">
                <v-avatar size="72" color="primary" variant="tonal" class="mb-3">
                    <span class="text-h6 font-weight-bold">{{ getInitials(profile?.full_name ?? '') }}</span>
                </v-avatar>
                <h6 class="text-h6 mb-1">{{ profile?.full_name ?? '-' }}</h6>
                <p class="text-caption text-medium-emphasis mb-2">{{ profile?.email }}</p>
                <v-chip size="small" :color="profile?.status === 'active' ? 'success' : 'secondary'" variant="tonal"
                    class="mr-1">
                    {{ profile?.status }}
                </v-chip>
                <v-chip v-for="role in roles" :key="role.id" size="small" variant="outlined" class="mr-1 mt-1">
                    {{ role.label }}
                </v-chip>
            </div>

            <div class="pa-4">
                <div class="d-flex align-center justify-space-between mb-3">
                    <span class="text-subtitle-1 font-weight-medium">Profile Information</span>
                    <v-btn v-if="!isEditing" variant="tonal" color="primary" size="small" @click="isEditing = true">
                        <EditOutlined class="v-icon--start" /> Edit
                    </v-btn>
                    <div v-else class="d-flex ga-2">
                        <v-btn variant="text" size="small" @click="cancelEdit">
                            <CloseOutlined class="v-icon" />
                        </v-btn>
                        <v-btn variant="flat" color="primary" size="small" :loading="isSaving" @click="saveProfile">
                            <SaveOutlined class="v-icon--start" /> Save
                        </v-btn>
                    </div>
                </div>

                <label class="text-caption text-medium-emphasis">Full Name</label>
                <v-text-field v-if="isEditing" v-model="form.full_name" variant="outlined" density="comfortable"
                    hide-details="auto" class="mb-3" />
                <p v-else class="text-body-1 mt-1 mb-3">{{ profile?.full_name ?? '-' }}</p>

                <label class="text-caption text-medium-emphasis">Email</label>
                <p class="text-body-1 mt-1 d-flex align-center ga-1">
                    <MailOutlined :style="{ fontSize: '14px' }" />
                    {{ profile?.email ?? '-' }}
                </p>
            </div>

            <v-divider />

            <div class="pa-4">
                <div class="d-flex align-center justify-space-between" style="cursor: pointer"
                    @click="togglePasswordPanel">
                    <div class="d-flex align-center ga-2">
                        <LockOutlined :style="{ fontSize: '16px' }" />
                        <span class="text-subtitle-1 font-weight-medium">Change Password</span>
                    </div>
                    <v-icon :icon="showPasswordPanel ? 'mdi-chevron-up' : 'mdi-chevron-down'" size="16" />
                </div>

                <v-expand-transition>
                    <div v-if="showPasswordPanel" class="mt-4">
                        <v-alert v-if="passwordError" type="error" variant="tonal" density="compact" class="mb-3">
                            {{ passwordError }}
                        </v-alert>
                        <v-text-field v-model="passwordForm.currentPassword" label="Current Password" type="password"
                            variant="outlined" density="comfortable" class="mb-2" />
                        <v-text-field v-model="passwordForm.newPassword" label="New Password" type="password"
                            variant="outlined" density="comfortable" class="mb-2" />
                        <v-text-field v-model="passwordForm.confirmPassword" label="Confirm New Password"
                            type="password" variant="outlined" density="comfortable" class="mb-3" />
                        <v-btn block variant="flat" color="primary" :loading="isChangingPassword"
                            @click="submitPasswordChange">
                            Update Password
                        </v-btn>
                    </div>
                </v-expand-transition>
            </div>
        </div>
    </v-navigation-drawer>
</template>
