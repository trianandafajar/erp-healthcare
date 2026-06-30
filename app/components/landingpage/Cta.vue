<template>
  <section class="section px-4">
    <div class="section container rounded-xl shadow">
      <div class="row mx-auto items-center justify-center">
        <div class="md:col-5 lg:col-4">
          <img
            class="w-full"
            :src="cta?.image"
            alt="call to action image"
            width="325"
            height="206"
          />
        </div>
        <div class="mt-5 text-center md:col-6 lg:col-5 md:mt-0 md:text-left">
          <h2>{{ cta?.title }}</h2>
          <p class="mt-6" v-html="ctaContentMd"></p>
          <NuxtLink
            v-if="cta.button.enable"
            class="btn btn-primary mt-4"
            :to="cta.button.link"
            :rel="cta.button.rel"
          >
            {{ cta.button.label }}
          </NuxtLink>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
import { markdownify } from "~/utils/textConverter";

const props = defineProps({
  cta: { type: Object, required: true },
});
const ctaContentMd = computed(() => markdownify(props.cta?.content));
</script>
