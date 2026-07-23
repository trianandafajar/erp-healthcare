<script setup lang="ts">
import { ref } from 'vue'
import {
  LogoutOutlined,
  EditOutlined,
  QuestionCircleOutlined,
  WalletOutlined,
} from '@ant-design/icons-vue'
import { useAuthStore } from '@/stores/auth'
import { useProfileStore } from '@/stores/profile'

const dialog = ref(false)
const isLoggingOut = ref(false)

const props = defineProps<{
  profile?: { full_name?: string; avatar_url?: string } | null
  roles?: { id: string; label: string }[]
}>()

const isSuperAdmin = computed(() =>
  (props.roles ?? []).some(role => role.label === 'Super Administrator')
)

const emit = defineEmits<{
  'open-profile': [mode: 'view' | 'edit']
}>()

const authStore = useAuthStore()
const profileStore = useProfileStore()

function getInitials(name: string) {
  return name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()
}

async function confirmLogout() {
  isLoggingOut.value = true
  try {
    const { isImpersonating, exitImpersonation } = useImpersonation()
    if (isImpersonating.value) {
      await exitImpersonation()
      return
    }

    await $fetch('/api/auth/logout', { method: 'POST' })
    authStore.clearUser()
    profileStore.clearProfile()
    await navigateTo('/login')
  } finally {
    isLoggingOut.value = false
    dialog.value = false
  }
}
</script>

<template>
  <div>
    <div class="d-flex align-center pa-5">
      <v-avatar class="mr-2" size="32" color="primary" variant="tonal">
        <v-img v-if="profile?.avatar_url" :src="profile?.avatar_url" cover />
        <span v-else class="text-caption font-weight-bold">
          {{ getInitials(profile?.full_name ?? '-') }}
        </span>
      </v-avatar>
      <div>
        <h6 class="text-body-2 mb-0">{{ profile?.full_name ?? '-' }}</h6>
        <p class="text-caption mb-0">{{(roles ?? []).map(r => r.label).join(', ')}}</p>
      </div>
    </div>

    <v-divider />

    <v-list class="py-0" aria-label="profile list">
      <v-list-item to="/profile" color="primary" rounded="0">
        <template v-slot:prepend>
          <EditOutlined :style="{ fontSize: '14px' }" class="mr-4" />
        </template>
        <v-list-item-title class="text-h6text-body-2">Edit Profile</v-list-item-title>
      </v-list-item>

      <v-list-item color="primary" rounded="0" v-if="!isSuperAdmin">
        <template v-slot:prepend>
          <WalletOutlined :style="{ fontSize: '14px' }" class="mr-4" />
        </template>
        <v-list-item-title class="text-body-2">Billing</v-list-item-title>
      </v-list-item>

      <v-list-item to="/legal?page=help" color="primary" rounded="0">
        <template v-slot:prepend>
          <QuestionCircleOutlined :style="{ fontSize: '14px' }" class="mr-4" />
        </template>
        <v-list-item-title class="text-body-2">Support</v-list-item-title>
      </v-list-item>

      <v-divider color="error" />

      <v-list-item @click="dialog = true" color="error" rounded="0" class="text-error">
        <template v-slot:prepend>
          <LogoutOutlined :style="{ fontSize: '14px', color: 'rgb(var(--v-theme-error))' }" class="mr-4" />
        </template>
        <v-list-item-title class="text-body-2 text-error">Logout</v-list-item-title>
      </v-list-item>
    </v-list>
  </div>

  <v-dialog v-model="dialog" max-width="400" persistent>
    <v-card rounded="lg">
      <v-card-title class="d-flex align-center justify-space-between pa-4 pb-2">
        <div class="d-flex align-center ga-2">
          <v-icon icon="mdi-logout" color="error" />
          <span class="text-h6 font-weight-bold">Logout</span>
        </div>
        <v-btn icon="mdi-close" variant="text" density="compact" @click="dialog = false" />
      </v-card-title>

      <v-divider />

      <v-card-text class="pa-5 text-center">
        <v-avatar color="error" variant="tonal" size="52">
          <v-icon icon="mdi-logout" size="26" />
        </v-avatar>
        <p class="mt-4 text-body-1 font-weight-medium">Are you sure you want to logout?</p>
        <p class="text-body-2 text-medium-emphasis mt-1">
          You will need to login again to access the application.
        </p>
      </v-card-text>

      <v-divider />

      <v-card-actions class="pa-4">
        <v-spacer />
        <v-btn variant="tonal" color="secondary" @click="dialog = false">Cancel</v-btn>
        <v-btn variant="flat" color="error" :loading="isLoggingOut" @click="confirmLogout">
          Logout
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>