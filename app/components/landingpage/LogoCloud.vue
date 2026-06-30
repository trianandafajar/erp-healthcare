<template>
  <section class="py-14 bg-white border-b border-gray-100">
    <div class="container mx-auto">
      <p class="text-center text-xs font-semibold uppercase tracking-widest text-gray-400 mb-8">Trusted by Leading Healthcare Institutions</p>
      <div class="overflow-hidden">
        <div class="flex gap-16 items-center animate-scroll" style="animation-duration: 30s;">
          <img v-for="logo in logos" :key="logo" :src="logo" :alt="'Client logo'" class="h-8 md:h-10 opacity-40 grayscale hover:opacity-70 hover:grayscale-0 transition-all duration-300" onerror="this.style.display='none'" />
          <img v-for="logo in logos" :key="logo + '-dup'" :src="logo" :alt="'Client logo'" class="h-8 md:h-10 opacity-40 grayscale hover:opacity-70 hover:grayscale-0 transition-all duration-300" onerror="this.style.display='none'" />
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
const logos = [
  '/landingpage/logo.png',
  '/landingpage/logo.png',
  '/landingpage/logo.png',
  '/landingpage/logo.png',
  '/landingpage/logo.png',
  '/landingpage/logo.png',
];
</script>

<style scoped>
@keyframes scroll {
  0% { transform: translateX(0); }
  100% { transform: translateX(-50%); }
}
.animate-scroll {
  animation: scroll 30s linear infinite;
  width: fit-content;
}
@media (prefers-reduced-motion: reduce) {
  .animate-scroll {
    animation: none;
  }
}
</style>
