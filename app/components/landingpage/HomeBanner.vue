<template>
  <section class="relative pt-28 md:pt-36 pb-16 md:pb-24 overflow-hidden">
    <div class="absolute inset-0 bg-gradient-to-br from-[#edf6f5] via-white to-white pointer-events-none" />
    <div class="absolute top-0 right-0 h-full opacity-[0.04]"
      style="background-image: radial-gradient(circle at 25% 25%, #176D37 0%, transparent 70%)" />

    <div class="container mx-auto relative z-10 py-8">
      <div class="grid lg:grid-cols-2 gap-12 items-center">
        <div class="text-center lg:!text-left">
          <div
            class="inline-flex items-center gap-2 px-4 py-2 bg-[#176D37]/5 border border-[#176D37]/10 rounded-full text-xs font-semibold text-[#176D37] mb-6">
            <span class="w-2 h-2 rounded-full bg-[#176D37] animate-pulse" />
            Healthcare ERP Platform
          </div>
          <h1 class="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 leading-[1.1] tracking-tight">
            All-in-One Healthcare<br class="hidden sm:block" />
            <span class="text-[#176D37]">Management System</span>
          </h1>
          <p class="mt-5 text-lg text-gray-500 max-w-[540px] lg:!mx-0 mx-auto leading-relaxed">
            Streamline patient registration, medical records, pharmacy, and billing in one integrated platform designed
            for hospitals, clinics, and laboratories.
          </p>
          <div class="mt-8 flex flex-col sm:flex-row items-center gap-4 justify-center lg:!justify-start">
            <NuxtLink to="/login"
              class="inline-flex items-center px-7 py-3.5 text-sm font-bold text-white bg-[#176D37] rounded-full hover:bg-[#089695] transition-all">
              Get Free Demo
            </NuxtLink>
            <a href="#features"
              class="inline-flex items-center px-7 py-3.5 text-sm font-bold text-gray-700 bg-gray-100 rounded-full hover:bg-gray-200 transition-all">
              Learn More
            </a>
          </div>
        </div>

        <div class="relative hidden lg:flex items-center justify-center">
          <div class="relative z-10 rounded-2xl overflow-hidden">
            <img src="/landingpage/banner-art.svg" alt="Healthcare Dashboard" class="w-full" />
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
const props = defineProps({
  banner: { type: Object, required: true },
});
</script>
