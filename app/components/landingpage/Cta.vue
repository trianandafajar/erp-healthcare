<template>
  <section class="py-20 md:py-28">
    <div class="container mx-auto">
      <div
        class="relative rounded-3xl overflow-hidden bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 px-8 py-16 md:py-20 text-center">
        <div class="absolute inset-0 opacity-[0.03]"
          style="background-image: radial-gradient(circle at 30% 50%, #176D37 0%, transparent 60%)" />
        <div class="relative z-10 max-w-2xl mx-auto">
          <h2 class="text-3xl md:text-4xl font-bold text-white">Ready to Transform Your<br class="hidden sm:block" />
            Healthcare Operations?</h2>
          <p class="mt-4 text-gray-400 leading-relaxed">Join hundreds of healthcare facilities across Indonesia that
            trust our platform to deliver better patient care.</p>
          <div class="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <NuxtLink to="/login"
              class="inline-flex items-center px-7 py-3.5 text-sm font-bold text-gray-900 bg-white rounded-full hover:bg-gray-100 transition-all hover:shadow-xl">
              Get Free Demo
            </NuxtLink>
            <a href="#features"
              class="inline-flex items-center px-7 py-3.5 text-sm font-bold text-white border border-[#176D37] rounded-full hover:bg-white/10 transition-all">
              Schedule a Call
            </a>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
const props = defineProps({
  cta: { type: Object, default: null },
});
</script>
