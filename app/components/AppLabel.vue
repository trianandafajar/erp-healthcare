<script setup lang="ts">
import { VLabel } from 'vuetify/components'

defineProps<{
  required?: boolean
  optional?: boolean
}>()

const attrs = useAttrs()
</script>

<template>
  <VLabel v-bind="attrs">
    <slot />
    <span v-if="required" class="text-error ml-0.5">*</span>
    <span v-else-if="optional" class="text-medium-emphasis font-weight-regular">&nbsp;(optional)</span>
  </VLabel>
</template>
