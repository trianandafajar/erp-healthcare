<template>
  <section class="section pb-[50px]">
    <div class="container">
      <div class="row text-center">
        <div class="mx-auto lg:col-10">
          <h1 class="font-primary font-bold">{{ banner.title }}</h1>
          <p class="mt-4" v-html="bannerContentMd"></p>
          <NuxtLink
            v-if="banner.button.enable"
            class="btn btn-primary mt-4"
            :to="banner.button.link"
            :rel="banner.button.rel"
          >
            {{ banner.button.label }}
          </NuxtLink>
          <img
            class="mx-auto mt-12"
            :src="banner.image"
            width="750"
            height="390"
            alt="banner image"
          />
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
import { markdownify } from "~/utils/textConverter";

const props = defineProps({
  banner: { type: Object, required: true },
});
const bannerContentMd = computed(() => markdownify(props.banner.content));
</script>
