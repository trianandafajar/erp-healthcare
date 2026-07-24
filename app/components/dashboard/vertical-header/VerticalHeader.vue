<script setup lang="ts">
import { useCustomizerStore } from '../../../stores/customizer';
import { useDisplay } from 'vuetify';
// icons
import { MenuFoldOutlined, SearchOutlined, GithubOutlined } from '@ant-design/icons-vue';

// dropdown imports
import NotificationDD from './NotificationDD.vue';
import ProfileDD from './ProfileDD.vue';

const customizer = useCustomizerStore();
const profileStore = useProfileStore()
const display = useDisplay()

onMounted(() => {
  if (display.smAndDown.value && customizer.Sidebar_drawer) {
    customizer.SET_SIDEBAR_DRAWER()
  }
  profileStore.fetchProfile().catch(() => { })
})

onBeforeMount(() => {
  if (display.smAndDown.value && customizer.Sidebar_drawer) {
    customizer.SET_SIDEBAR_DRAWER()
  }
})

const profile = computed(() => profileStore.profile)
const roles = computed(() => profileStore.roles)

function refresh() {
  return profileStore.refreshProfile().catch(() => null)
}

const profileSidebarOpen = ref(false)
const profileSidebarMode = ref<'view' | 'edit'>('view')

const profileMenuOpen = ref(false)

function openProfileSidebar(mode: 'view' | 'edit') {
  profileMenuOpen.value = false
  profileSidebarMode.value = mode
  profileSidebarOpen.value = true
}

function getInitials(name: string) {
  if (!name) return '?'
  return name
    .split(' ')
    .map(n => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

const { isImpersonating, impersonatedName, impersonatedRole, exitImpersonation } = useImpersonation()
const isExiting = ref(false)

async function handleExit() {
  isExiting.value = true
  try {
    await exitImpersonation()
  } catch {
    isExiting.value = false
  }
}
</script>

<template>
  <v-app-bar v-if="isImpersonating" flat :height="display.smAndDown.value ? 56 : 44" :order="-1"
    color="orange-darken-2" style="z-index: 1005;">
    <v-icon icon="mdi-shield-account" size="18" class="ml-3 ml-sm-4 mr-2 flex-shrink-0" />

    <div class="d-flex align-center min-w-0 flex-grow-1">
      <span class="text-body-2 text-truncate">
        <span class="d-none d-sm-inline">You are currently logged in as </span>
        <span class="d-inline d-sm-none">Impersonating </span>
        <strong>{{ impersonatedName }}</strong>
      </span>

      <v-chip v-if="!display.xs.value" size="x-small" variant="tonal" color="white" label
        class="ml-2 text-capitalize flex-shrink-0">
        {{ impersonatedRole }}
      </v-chip>
    </div>

    <v-spacer class="d-none d-sm-flex" />

    <v-btn v-if="display.mdAndUp.value" size="small" variant="outlined" color="white" :loading="isExiting"
      prepend-icon="mdi-logout-variant" class="mr-4 flex-shrink-0" style="border-color: rgba(255,255,255,0.6);"
      @click="handleExit">
      Return to Admin Account
    </v-btn>

    <v-tooltip v-else text="Return to Admin Account" location="bottom">
      <template #activator="{ props }">
        <v-btn v-bind="props" icon size="small" variant="outlined" color="white" :loading="isExiting"
          class="mr-2 flex-shrink-0" style="border-color: rgba(255,255,255,0.6);" @click="handleExit">
          <v-icon icon="mdi-logout-variant" size="18" />
        </v-btn>
      </template>
    </v-tooltip>
  </v-app-bar>

  <v-app-bar elevation="0" height="60">
    <v-btn class="hidden-md-and-down text-secondary mr-3" color="darkText" icon rounded="sm" variant="text"
      @click.stop="customizer.SET_MINI_SIDEBAR(!customizer.mini_sidebar)" size="small">
      <MenuFoldOutlined :style="{ fontSize: '16px' }" />
    </v-btn>
    <v-btn class="hidden-lg-and-up text-secondary ms-3" color="darkText" icon rounded="sm" variant="text"
      @click.stop="customizer.SET_SIDEBAR_DRAWER" size="small">
      <MenuFoldOutlined :style="{ fontSize: '16px' }" />
    </v-btn>

    <v-spacer />

    <!-- Notification -->
    <NotificationDD />

    <!-- User Profile -->
    <v-menu v-model="profileMenuOpen" :close-on-content-click="false" offset="8, 0">
      <template v-slot:activator="{ props }">
        <v-btn class="profileBtn" variant="text" rounded="sm" v-bind="props">
          <div class="d-flex align-center">
            <v-avatar class="mr-sm-2 mr-0" size="34" color="primary" variant="tonal">
              <v-img v-if="profile?.avatar_url" :src="profile?.avatar_url" cover />
              <span v-else class="text-caption font-weight-bold">
                {{ getInitials(profile?.full_name) }}
              </span>
            </v-avatar>
            <h6 class="text-subtitle-1 mb-0 d-sm-block d-none">{{ profile?.full_name ?? '-' }}</h6>
          </div>
        </v-btn>
      </template>
      <v-sheet rounded="md" width="290">
        <ProfileDD :profile="profile" :roles="roles" @open-profile="openProfileSidebar" />
      </v-sheet>
    </v-menu>
  </v-app-bar>
</template>
