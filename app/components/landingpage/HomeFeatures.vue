<template>
  <section class="section bg-theme-light">
    <div class="container">
      <div class="text-center">
        <h2 v-html="featureTitleMd"></h2>
      </div>
      <div class="mt-8 grid gap-x-8 gap-y-6 sm:grid-cols-2 lg:grid-cols-3">
        <div
          v-for="(item, i) in feature.features"
          :key="'feature-' + i"
          class="feature-card rounded-xl bg-white p-5 pb-8 text-center"
        >
          <img
            v-if="item.icon"
            class="mx-auto"
            :src="item.icon"
            width="30"
            height="30"
            alt=""
          />
          <div class="mt-4">
            <h3 class="h5" v-html="itemNameMd(item.name)"></h3>
            <p class="mt-3">{{ item.content }}</p>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
import { markdownify } from "~/utils/textConverter";

const props = defineProps({
  feature: { type: Object, required: true },
});
const featureTitleMd = computed(() => markdownify(props.feature.title));
const itemNameMd = (name) => markdownify(name);
</script>
