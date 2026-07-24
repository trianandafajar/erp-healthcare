<script setup lang="ts">
const props = defineProps({
    title: String,
    className: String
});
</script>

<template>
    <v-card elevation="0" variant="outlined" :style="{ borderColor: '#e0e0e0' }" rounded="md" class="bg-surface">
        <v-card-item class="pb-2 px-0 pt-0">
            <v-card-title class="text-h5">{{ props.title }}</v-card-title>
        </v-card-item>
        <v-card-text :class="`${props.className}`">
            <slot />
        </v-card-text>
    </v-card>
</template>
