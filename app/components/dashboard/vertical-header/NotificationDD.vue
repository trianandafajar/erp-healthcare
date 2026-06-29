<script setup lang="ts">
import { BellOutlined, CheckCircleOutlined } from '@ant-design/icons-vue'

const { items, unreadCount, loading, refreshing, connectionStatus, markAllAsRead, readNotification, refresh } = useNotifications()

function handleItemClick(id: string) {
  readNotification(id)
}

const statusLabel = computed(() => {
  switch (connectionStatus.value) {
    case 'connected':
      return 'Live'
    case 'polling':
      return 'Syncing'
    case 'connecting':
      return 'Connecting'
    case 'error':
      return 'Offline'
    default:
      return 'Idle'
  }
})

const unreadLabel = computed(() => {
  if (unreadCount.value <= 0) return '0'
  if (unreadCount.value > 99) return '99+'
  return String(unreadCount.value)
})
</script>

<template>
  <v-menu :close-on-content-click="false" offset="6, 0">
    <template v-slot:activator="{ props }">
      <v-btn icon class="text-secondary ml-sm-2 ml-1" color="darkText" rounded="sm" size="small" v-bind="props">
        <v-badge :content="unreadLabel" color="primary" offset-x="-4" offset-y="-5">
          <BellOutlined :style="{ fontSize: '16px' }" />
        </v-badge>
      </v-btn>
    </template>

    <v-sheet rounded="md" width="387" class="notification-dropdown">
      <div class="pa-4 pb-3">
        <div class="d-flex align-center justify-space-between gap-3">
          <div>
            <h6 class="text-subtitle-1 mb-0">Notifications</h6>
            <p class="text-caption text-medium-emphasis mb-0">{{ statusLabel }}</p>
          </div>
          <div class="d-flex align-center ga-2">
            <v-btn variant="text" color="secondary" icon rounded="sm" size="small" :loading="refreshing" @click="refresh">
              <v-icon icon="mdi-refresh" size="18" />
            </v-btn>
            <v-btn
              variant="text"
              color="success"
              icon
              rounded
              size="small"
              :disabled="unreadCount === 0"
              @click="markAllAsRead"
            >
              <CheckCircleOutlined :style="{ fontSize: '16px' }" />
            </v-btn>
          </div>
        </div>
      </div>

      <v-divider />

      <div class="scroll-shell" style="height: calc(100vh - 300px); max-height: 265px; overflow-y: auto;">
        <div v-if="loading" class="pa-4 text-center text-caption text-medium-emphasis">
          Loading notifications...
        </div>

        <v-list v-else class="py-0" lines="two" aria-label="notification list">
          <template v-if="items.length > 0">
            <template v-for="item in items" :key="item.id">
              <v-list-item
                class="notification-item no-spacer py-1"
                :class="{ 'notification-item--read': item.is_read }"
                :active="!item.is_read"
                @click="handleItemClick(item.id)"
              >
                <template v-slot:prepend>
                  <v-avatar size="40" variant="tonal" :color="item.color" class="mr-3 py-2" :class="`text-${item.color}`">
                    <v-icon :icon="item.icon" />
                  </v-avatar>
                </template>

                <div class="d-inline-flex justify-space-between w-100 align-start">
                  <div class="pr-2">
                    <h6 class="text-subtitle-1 font-weight-regular mb-1" :class="{ 'font-weight-semibold': !item.is_read }">
                      {{ item.title }}
                    </h6>
                    <p class="text-caption text-medium-emphasis my-0">{{ item.summary }}</p>
                    <p class="text-caption text-medium-emphasis my-0">{{ item.relativeTime }}</p>
                  </div>
                  <span class="text-caption text-no-wrap text-medium-emphasis">{{ item.shortTime }}</span>
                </div>
              </v-list-item>
              <v-divider />
            </template>
          </template>

          <div v-else class="pa-4 text-center text-caption text-medium-emphasis">
            No notifications yet.
          </div>
        </v-list>
      </div>

      <v-divider />

      <div class="pa-2 text-center">
        <v-btn color="primary" variant="text" :loading="refreshing" @click="refresh">Refresh</v-btn>
      </div>
    </v-sheet>
  </v-menu>
</template>

<style lang="scss">
.v-tooltip {
  > .v-overlay__content.custom-tooltip {
    padding: 2px 6px;
  }
}

.notification-item {
  cursor: pointer;
  transition: background-color 0.15s ease, opacity 0.15s ease;
}

.notification-item:hover {
  background-color: rgba(var(--v-theme-primary), 0.06);
}

.notification-item--read {
  opacity: 0.72;
}
</style>
