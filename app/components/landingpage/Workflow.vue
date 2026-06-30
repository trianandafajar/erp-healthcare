<template>
  <section class="section pb-0">
    <div class="mb-8 text-center">
      <h2 class="mx-auto max-w-[400px] font-bold leading-[44px]" v-html="titleMd"></h2>
      <p class="mt-3" v-html="descMd"></p>
    </div>
    <img
      :src="workflow.image"
      alt="workflow image"
      width="1920"
      height="296"
    />
  </section>
</template>

<script setup>
import { markdownify } from "~/utils/textConverter";

const props = defineProps({
  workflow: { type: Object, required: true },
});
const titleMd = computed(() => markdownify(props.workflow.title));
const descMd = computed(() => markdownify(props.workflow.description));
</script>
