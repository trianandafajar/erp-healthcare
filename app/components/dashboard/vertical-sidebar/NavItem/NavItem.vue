<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'

const props = defineProps({ item: Object, level: Number })
const route = useRoute()

const isActive = computed(() => {
  if (!props.item?.to || props.item.type === 'external') return false
  return route.path.startsWith(props.item.to)
})
</script>

<template>
  <v-list-item :to="item.type === 'external' ? '' : item.to" :href="item.type === 'external' ? item.to : ''" rounded
    class="mb-1" color="primary" :disabled="item.disabled" :target="item.type === 'external' ? '_blank' : ''"
    :class="{ 'v-list-item--active': isActive }">
    <template v-slot:prepend>
      <v-icon v-if="typeof props.item.icon === 'string'" :icon="props.item.icon" class="iconClass" />
      <component v-else :is="props.item.icon" class="iconClass" :level="props.level"></component>
    </template>
    <v-list-item-title>{{ item.title }}</v-list-item-title>
    <v-list-item-subtitle v-if="item.subCaption" class="text-caption mt-n1 hide-menu">
      {{ item.subCaption }}
    </v-list-item-subtitle>
    <template v-slot:append v-if="item.chip">
      <v-chip label :color="item.chipColor" class="sidebarchip hide-menu" size="small" :variant="item.chipVariant"
        :prepend-icon="item.chipIcon">
        {{ item.chip }}
      </v-chip>
    </template>
  </v-list-item>
</template>