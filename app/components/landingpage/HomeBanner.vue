<template>
  <section class="relative pt-28 md:pt-36 pb-16 md:pb-24 overflow-hidden">
    <div class="absolute inset-0 bg-gradient-to-br from-[#edf6f5] via-white to-white pointer-events-none" />
    <div class="absolute top-0 right-0 h-full opacity-[0.04]"
      style="background-image: radial-gradient(circle at 25% 25%, #176D37 0%, transparent 70%)" />

    <div class="container mx-auto relative z-10">
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
          <div class="mt-8 flex items-center gap-6 justify-center lg:!justify-start text-sm text-gray-400">
            <span class="flex items-center gap-1.5">
              <svg class="w-4 h-4 text-[#176D37]" fill="none" viewBox="0 0 24 24" stroke="currentColor"
                stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round"
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              No credit card
            </span>
            <span class="flex items-center gap-1.5">
              <svg class="w-4 h-4 text-[#176D37]" fill="none" viewBox="0 0 24 24" stroke="currentColor"
                stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round"
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              HIPAA Compliant
            </span>
            <span class="flex items-center gap-1.5">
              <svg class="w-4 h-4 text-[#176D37]" fill="none" viewBox="0 0 24 24" stroke="currentColor"
                stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              99.9% Uptime
            </span>
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
