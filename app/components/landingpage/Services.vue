<template>
  <section v-for="(service, index) in services" :key="'service-' + index"
    :class="['section', index % 2 > 0 && 'bg-theme-light']">
    <div class="container">
      <div class="items-center gap-8 md:grid md:grid-cols-2">
        <div :class="['service-carousel', (index % 2 === 0) && 'md:order-2']">
          <Swiper :modules="swiperModules" :pagination="service.images.length > 1 ? { clickable: true } : false"
            :autoplay="{ delay: 5000, disableOnInteraction: false }">
            <SwiperSlide v-for="(slide, si) in service.images" :key="si">
              <img :src="slide" alt="" width="600" height="500" />
            </SwiperSlide>
          </Swiper>
        </div>
        <div :class="['service-content mt-5 md:mt-0', (index % 2 === 0) && 'md:order-1']">
          <h2 class="font-bold leading-[40px]">{{ service.title }}</h2>
          <p class="mb-2 mt-4">{{ service.content }}</p>
          <NuxtLink v-if="service.button.enable" :href="service.button.link"
            class="cta-link inline-flex items-center text-primary">
            {{ service.button.label }}
            <img class="ml-1" src="/landingpage/arrow-right.svg" width="18" height="14" alt="arrow" />
          </NuxtLink>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
import { Swiper, SwiperSlide } from "swiper/vue";
import { Autoplay, Pagination } from "swiper/modules";

import "swiper/css";
import "swiper/css/pagination";

defineProps({
  services: {
    type: Array,
    required: true,
  },
});

const swiperModules = [Autoplay, Pagination];
</script>
