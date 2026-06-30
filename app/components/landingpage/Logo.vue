<template>
  <NuxtLink
    :to="baseUrl"
    class="navbar-brand block py-1"
    :style="{ height: logoHeightPx + 'px', width: logoWidthPx + 'px' }"
  >
    <img
      v-if="src || logo"
      :src="src || logo"
      :alt="title"
      :width="logoWidthPx * 2"
      :height="logoHeightPx * 2"
    />
    <template v-else-if="logoText">{{ logoText }}</template>
    <template v-else>{{ title }}</template>
  </NuxtLink>
</template>

<script setup>
import config from "~/config/config.json";

const { base_url, logo, logo_width, logo_height, logo_text, title } = config.site;
const logoWidthPx = parseInt(logo_width);
const logoHeightPx = parseInt(logo_height);
const baseUrl = base_url;

defineProps({
  src: { type: String, default: null },
});
</script>
