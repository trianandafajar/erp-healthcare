<script setup lang="ts">
import { computed, ref, onMounted, onUnmounted } from 'vue'
import { getSidebarItems } from '../vertical-sidebar/sidebarItem'

const sidebarLeft = ref(256)
const sidebarTop = ref(60)
const sidebarHeight = ref('calc(100vh - 60px)')

let observer: ResizeObserver | null = null

function updateHeight() {
  sidebarHeight.value = `calc(100vh - ${sidebarTop.value}px)`
}

onMounted(() => {
  const el = document.querySelector('.page-wrapper') as HTMLElement | null
  if (!el) return
  const update = () => {
    const styles = getComputedStyle(el)
    const left = parseInt(styles.paddingLeft, 10)
    if (!isNaN(left) && left > 0) sidebarLeft.value = left
    const top = parseInt(styles.paddingTop, 10)
    if (!isNaN(top) && top > 0) sidebarTop.value = top
    updateHeight()
  }
  update()
  observer = new ResizeObserver(update)
  observer.observe(el)
  window.addEventListener('resize', updateHeight)
})

onUnmounted(() => {
  observer?.disconnect()
  window.removeEventListener('resize', updateHeight)
})

const props = defineProps<{
  slug: string
  activeSection: string
  modelValue: boolean
}>()

const isSubSection = computed(() => props.activeSection !== 'detail')

const emit = defineEmits<{
  navigate: [section: string]
  'update:modelValue': [value: boolean]
}>()

const sidebarMenu = computed(() => getSidebarItems(props.slug))

function sectionFromPath(path: string): string {
  const parts = path.split('/')
  return parts[parts.length - 1] ?? ''
}

function isActive(item: any): boolean {
  if (item.header || item.divider) return false
  return sectionFromPath(item.to) === props.activeSection
}

function handleClick(item: any) {
  if (item.header || item.divider) return
  emit('navigate', sectionFromPath(item.to))
  emit('update:modelValue', false)
}

function toggle() {
  emit('update:modelValue', !props.modelValue)
}
</script>

<template>
  <div class="tenant-detail-sidebar" :class="{ expanded: modelValue }"
    :style="{ left: sidebarLeft + 'px', top: sidebarTop + 'px', height: sidebarHeight }">
    <div class="sidebar-trigger" @click="toggle" :title="modelValue ? 'Close admin menu' : 'Open the admin menu'">
      <v-icon :icon="modelValue ? 'mdi-chevron-left' : 'mdi-chevron-right'" size="20" />
    </div>

    <div class="sidebar-panel">
      <div class="sidebar-header">
        <div class="pa-4 d-flex align-center justify-space-between"
          style="border-bottom: 1px solid rgb(var(--v-theme-borderLight));">
          <div>
            <div class="text-caption font-weight-bold text-medium-emphasis text-uppercase"
              style="letter-spacing: 1px; font-size: 11px;">
              Admin Menu
            </div>
            <div class="text-body-2 font-weight-medium mt-1">{{ slug }}</div>
          </div>
          <v-btn icon="mdi-close" variant="text" size="small" density="comfortable" @click="toggle" />
        </div>
      </div>

      <div class="sidebar-scroll">
        <v-list density="compact" nav>
          <v-list-item v-if="isSubSection" color="primary" class="mb-1 gap-1.5"
            @click="emit('navigate', 'detail'); emit('update:modelValue', false)" style="cursor: pointer;">
            <template v-slot:prepend>
              <v-icon icon="mdi-arrow-left" size="18" />
            </template>
            <v-list-item-title class="text-body-2 font-weight-medium">Back to Detail</v-list-item-title>
          </v-list-item>

          <v-divider v-if="isSubSection" class="my-2" />

          <template v-for="(item, i) in sidebarMenu" :key="i">
            <v-list-subheader v-if="item.header" class="text-caption text-medium-emphasis text-uppercase mt-2 mb-1"
              style="letter-spacing: 0.5px; font-weight: 600; font-size: 11px; padding: 0 16px;">
              {{ item.header }}
            </v-list-subheader>

            <v-divider v-else-if="item.divider" class="my-2" />

            <v-list-item v-else :active="isActive(item)" color="primary" :disabled="item.disabled" class="mb-1 gap-1.5"
              @click="handleClick(item)" style="cursor: pointer;">
              <template v-slot:prepend>
                <component :is="item.icon" class="iconClass" style="font-size: 18px;" />
              </template>
              <v-list-item-title class="text-body-2">{{ item.title }}</v-list-item-title>
            </v-list-item>
          </template>
        </v-list>
      </div>
    </div>
  </div>
</template>

<style scoped>
.tenant-detail-sidebar {
  position: fixed;
  z-index: 100;
  pointer-events: none;
  max-height: 100vh;
}

.sidebar-trigger {
  position: absolute;
  left: 0;
  top: 16px;
  width: 24px;
  height: 48px;
  background-color: rgb(var(--v-theme-primary));
  color: white;
  border-radius: 0 8px 8px 0;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  z-index: 101;
  pointer-events: auto;
  transition: left 0.2s ease;
}

.expanded .sidebar-trigger {
  left: 260px;
}

.sidebar-panel {
  position: absolute;
  left: -260px;
  top: 0;
  width: 260px;
  height: 100%;
  background-color: rgb(var(--v-theme-containerBg));
  border-right: 1px solid rgb(var(--v-theme-borderLight));
  transition: left 0.2s ease;
  pointer-events: auto;
  display: flex;
  flex-direction: column;
}

.expanded .sidebar-panel {
  left: 0;
  box-shadow: 4px 0 12px rgba(0, 0, 0, 0.1);
}

.sidebar-header {
  height: 80px;
  flex-shrink: 0;
}

.sidebar-scroll {
  flex: 1 1 auto;
  overflow-y: auto;
  min-height: 0;
  scrollbar-width: thin;
  scrollbar-color: rgba(var(--v-theme-primary), 0.2) transparent;
}

.sidebar-scroll::-webkit-scrollbar {
  width: 1px;
}

.sidebar-scroll::-webkit-scrollbar-track {
  background: transparent;
}

.sidebar-scroll::-webkit-scrollbar-thumb {
  background: rgba(var(--v-theme-primary), 0.3);
  border-radius: 0;
}

.sidebar-scroll::-webkit-scrollbar-button {
  display: none;
}

.v-list-item--active {
  background-color: rgb(var(--v-theme-primary)) !important;
  color: white !important;
}

.v-list-item--active .iconClass {
  color: white !important;
}
</style>