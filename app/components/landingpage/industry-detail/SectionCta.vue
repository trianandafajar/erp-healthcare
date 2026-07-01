<template>
  <section class="py-20 md:py-28">
    <div class="container mx-auto">
      <div
        class="relative rounded-3xl overflow-hidden bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 px-8 py-16 md:py-20 text-center">
        <div class="absolute inset-0 opacity-[0.03]"
          style="background-image: radial-gradient(circle at 30% 50%, #176D37 0%, transparent 60%)" />
        <div class="relative z-10 max-w-2xl mx-auto">
          <h2 class="text-3xl md:text-4xl font-bold text-white"> {{ cta.title }}</h2>
          <div class="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <NuxtLink :to="cta.button_link || '/'"
              class="inline-flex items-center px-7 py-3.5 text-sm font-bold text-gray-900 bg-white rounded-full hover:bg-gray-100 transition-all hover:shadow-xl">
              {{ cta.button_text || 'Get Started' }}
            </NuxtLink>
          </div>
        </div>
      </div>
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
