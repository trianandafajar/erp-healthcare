<script setup lang="ts">
import { ref } from 'vue';
import {
  LogoutOutlined,
  UserOutlined,
  SettingOutlined,
  QuestionCircleOutlined,
  LockOutlined,
  CommentOutlined,
  UnorderedListOutlined,
  EditOutlined,
  ProfileOutlined,
  WalletOutlined
} from '@ant-design/icons-vue';

const tab = ref(null);
const dialog = ref(false)
const isLoggingOut = ref(false)

const props = defineProps<{
  profile?: {
    full_name?: string
    avatar_url?: string
  } | null
  roles?: { id: string; label: string }[]
}>()

function getInitials(name: string) {
  return name
    .split(' ')
    .map(n => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

async function confirmLogout() {
  isLoggingOut.value = true
  try {
    await $fetch('/api/auth/logout', { method: 'POST' })
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
      <v-avatar size="32" class="mr-2" color="primary" variant="tonal">
        <span class="text-caption font-weight-bold">
          {{ getInitials(profile?.full_name ?? '-') }}
        </span>
      </v-avatar>
      <div>
        <h6 class="text-h6 mb-0">{{ profile?.full_name ?? '-' }}</h6>
        <p class="text-caption mb-0">{{(roles ?? []).map(r => r.label).join(', ')}}</p>
      </div>
      <div class="ml-auto">
        <v-btn variant="text" color="primary" rounded="sm" icon size="large" @click="dialog = true">
          <LogoutOutlined :style="{ fontSize: '20px' }" />
        </v-btn>
      </div>
    </div>

    <v-tabs v-model="tab" color="primary" grow>
      <v-tab value="111">
        <UserOutlined class="v-icon--start" /> Profile
      </v-tab>
      <v-tab value="222">
        <SettingOutlined class="v-icon--start" /> Setting
      </v-tab>
    </v-tabs>

    <perfect-scrollbar style="height: calc(100vh - 300px); max-height: 240px">
      <v-window v-model="tab">
        <v-window-item value="111">
          <v-list class="py-0" aria-label="profile list" aria-busy="true">
            <v-list-item color="primary" rounded="0" value="Edit profile">
              <template v-slot:prepend>
                <EditOutlined :style="{ fontSize: '14px' }" class="mr-4" />
              </template>
              <v-list-item-title class="text-h6">Edit Profile</v-list-item-title>
            </v-list-item>

            <v-list-item color="primary" rounded="0" value="View Profile">
              <template v-slot:prepend>
                <UserOutlined :style="{ fontSize: '14px' }" class="mr-4" />
              </template>
              <v-list-item-title class="text-h6">View Profile</v-list-item-title>
            </v-list-item>

            <v-list-item color="primary" rounded="0" value="Social Profile">
              <template v-slot:prepend>
                <ProfileOutlined :style="{ fontSize: '14px' }" class="mr-4" />
              </template>
              <v-list-item-title class="text-h6">Social Profile</v-list-item-title>
            </v-list-item>

            <v-list-item color="primary" rounded="0" value="Billing">
              <template v-slot:prepend>
                <WalletOutlined :style="{ fontSize: '14px' }" class="mr-4" />
              </template>
              <v-list-item-title class="text-h6">Billing</v-list-item-title>
            </v-list-item>

            <v-list-item @click="dialog = true" color="secondary" rounded="0">
              <template v-slot:prepend>
                <LogoutOutlined :style="{ fontSize: '14px' }" class="mr-4" />
              </template>
              <v-list-item-title class="text-subtitle-2">Logout</v-list-item-title>
            </v-list-item>
          </v-list>
        </v-window-item>

        <v-window-item value="222">
          <v-list class="py-0" aria-label="profile list" aria-busy="true">
            <v-list-item color="primary" rounded="0" value="Support">
              <template v-slot:prepend>
                <QuestionCircleOutlined :style="{ fontSize: '14px' }" class="mr-4" />
              </template>
              <v-list-item-title class="text-h6">Support</v-list-item-title>
            </v-list-item>

            <v-list-item color="primary" rounded="0" value="Account">
              <template v-slot:prepend>
                <UserOutlined :style="{ fontSize: '14px' }" class="mr-4" />
              </template>
              <v-list-item-title class="text-h6">Account settings</v-list-item-title>
            </v-list-item>

            <v-list-item color="primary" rounded="0" value="Privacy">
              <template v-slot:prepend>
                <LockOutlined :style="{ fontSize: '14px' }" class="mr-4" />
              </template>
              <v-list-item-title class="text-h6">Privacy center</v-list-item-title>
            </v-list-item>

            <v-list-item color="primary" rounded="0" value="Feedback">
              <template v-slot:prepend>
                <CommentOutlined :style="{ fontSize: '14px' }" class="mr-4" />
              </template>
              <v-list-item-title class="text-h6">Feedback</v-list-item-title>
            </v-list-item>

            <v-list-item color="primary" rounded="0" value="History">
              <template v-slot:prepend>
                <UnorderedListOutlined :style="{ fontSize: '14px' }" class="mr-4" />
              </template>
              <v-list-item-title class="text-h6">History</v-list-item-title>
            </v-list-item>
          </v-list>
        </v-window-item>
      </v-window>
    </perfect-scrollbar>
  </div>

  <v-dialog v-model="dialog" max-width="500" persistent>
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
        <v-avatar color="error" variant="tonal" size="56">
          <v-icon icon="mdi-logout" size="28" />
        </v-avatar>
        <p class="mt-4 text-body-1 font-weight-medium">
          Are you sure you want to logout?
        </p>
        <p class="text-body-2 text-medium-emphasis mt-2">
          You will need to login again to access the application.
        </p>
      </v-card-text>

      <v-divider />

      <v-card-actions class="pa-4">
        <v-spacer />
        <v-btn variant="tonal" color="secondary" @click="dialog = false">
          Cancel
        </v-btn>
        <v-btn variant="flat" color="error" :loading="isLoggingOut" @click="confirmLogout">
          Logout
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>