<template>
  <section class="py-12 md:py-24 bg-[#0a0a0a]">
    <div class="mx-6 max-w-3xl mx-auto text-center">
      <h2 class="text-3xl md:text-4xl font-bold text-white mb-6">
        {{ cta.title }}
      </h2>
      <NuxtLink :to="cta.button_link || '/'" 
        class="inline-flex items-center gap-2 px-8 py-4 rounded-full bg-[#0aa8a7] text-white font-semibold hover:bg-[#16d5d4] transition-colors no-underline">
        {{ cta.button_text || 'Get Started' }}
        <v-icon icon="mdi-arrow-right" />
      </NuxtLink>
    </div>
  </section>
</template>

<script setup>
defineProps({
  cta: {
    type: Object,
    required: true
  }
})
</script>
