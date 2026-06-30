<template>
  <section class="section">
    <div class="container">
      <h1 class="h2 mb-8 text-center" v-html="titleMd"></h1>
      <MarkdownContent :content="data.content" />
    </div>
  </section>
</template>

<script setup>
import { markdownify } from "~/utils/textConverter";

const props = defineProps({
  data: { type: Object, required: true },
});
const titleMd = computed(() => markdownify(props.data.frontmatter.title));
</script>
