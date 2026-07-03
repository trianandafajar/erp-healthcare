<template>
  <section class="py-14 bg-white border-b border-gray-100">
    <div class="container mx-auto">
      <p class="text-center text-xs font-semibold uppercase tracking-widest text-gray-400 mb-8">Trusted by Leading Healthcare Institutions</p>
      <div v-if="logos.length" class="overflow-hidden">
        <div class="flex gap-16 items-center animate-scroll" style="animation-duration: 30s;">
          <img v-for="(logo, i) in logos" :key="i" :src="logo.image_url" :alt="logo.title" class="h-8 md:h-10 opacity-40 grayscale hover:opacity-70 hover:grayscale-0 transition-all duration-300" onerror="this.style.display='none'" />
          <img v-for="(logo, i) in logos" :key="'dup-' + i" :src="logo.image_url" :alt="logo.title" class="h-8 md:h-10 opacity-40 grayscale hover:opacity-70 hover:grayscale-0 transition-all duration-300" onerror="this.style.display='none'" />
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
const fallbackLogos = [
  { id: '1', title: 'Calendly', image_url: '/landingpage/sponsors/calenly.png' },
  { id: '2', title: 'Contena', image_url: '/landingpage/sponsors/contena.png' },
  { id: '3', title: 'Mentora', image_url: '/landingpage/sponsors/mentora.png' },
  { id: '4', title: 'Schedullin', image_url: '/landingpage/sponsors/schedullin.png' },
  { id: '5', title: 'Stockita', image_url: '/landingpage/sponsors/stockita.png' },
  { id: '6', title: 'Invoice', image_url: '/landingpage/sponsors/invoice.png' },
]

const { data, error } = await useFetch('/api/landingpage/logos')

const logos = computed(() => {
  if (error.value || !data.value?.logos?.length) return fallbackLogos
  return data.value.logos
})
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
