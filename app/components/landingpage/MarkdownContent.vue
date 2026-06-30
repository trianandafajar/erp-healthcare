<template>
  <div class="content" v-html="rendered"></div>
</template>

<script setup>
import { renderMarkdown } from "~/utils/textConverter";

const props = defineProps({
  content: { type: String, default: "" },
});
const rendered = computed(() => renderMarkdown(props.content));
</script>

<style>
.content pre {
  overflow-x: auto;
}
</style>
