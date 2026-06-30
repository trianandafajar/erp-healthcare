<template>
  <section class="section">
    <div class="container">
      <div class="flex h-[40vh] items-center justify-center">
        <div class="text-center">
          <h1 class="mb-4">{{ frontmatter.title }}</h1>
          <div class="content" v-html="contentMd"></div>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
import { markdownify } from "~/utils/textConverter";

const props = defineProps({
  data: { type: Object, required: true },
});

const { frontmatter, content } = props.data;
const contentMd = computed(() => markdownify(content));
</script>
