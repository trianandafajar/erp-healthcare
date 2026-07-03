<template>
  <div class="flex min-h-screen flex-col">
    <Header :dark-hero="!!industry" />

    <main class="flex-1">
      <div v-if="pending" class="d-flex justify-center items-center py-16 pt-32 md:pt-40">
        <v-progress-circular indeterminate color="primary" />
      </div>
      <div v-else-if="!industry" class="d-flex justify-center items-center py-16 pt-32 md:pt-40 text-medium-emphasis">
        Industry not found
      </div>
      <template v-else>
        <section class="relative min-h-screen w-full overflow-hidden bg-[#0a0a0a] flex items-center py-20 md:py-0">
          <div class="relative z-10 max-w-6xl w-full mx-auto px-6">
            <div class="grid md:grid-cols-2 gap-12 md:gap-8 items-center">
              <div class="min-w-0">
                <h1
                  class="text-4xl md:text-5xl lg:text-6xl font-extrabold leading-[1.12] bg-gradient-to-r from-emerald-500 via-green-400 to-[#176D37] bg-clip-text text-transparent break-words">
                  {{ industry.detail?.hero?.title || industry.title }}
                </h1>

                <p class="mt-6 text-gray-400 text-base md:text-lg leading-relaxed max-w-xl [overflow-wrap:anywhere]">
                  {{ industry.detail?.hero?.description || industry.description }}
                </p>

                <div class="mt-9 flex flex-wrap items-center gap-4">
                  <NuxtLink :to="`${route.path}#faq`" @click.prevent="scrollToFaq"
                    class="inline-flex items-center justify-center rounded-lg bg-[#176D37] px-7 py-3.5 text-sm md:text-base font-bold text-white shadow-lg shadow-[#176D37]/25 transition-colors hover:bg-emerald-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0a0a0a]">
                    Find Your Solution
                  </NuxtLink>
                  <NuxtLink to="/login"
                    class="inline-flex items-center justify-center rounded-lg bg-[#0f4326] px-7 py-3.5 text-sm md:text-base font-bold text-white transition-colors hover:bg-[#176D37] focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0a0a0a]">
                    Try Free
                  </NuxtLink>
                </div>
              </div>
              <div class="relative mx-auto w-full max-w-md md:max-w-none min-w-0">
                <img :src="industry.detail?.hero?.image_url || industry.image_url" :alt="industry.title"
                  class="relative w-full object-contain rounded-md max-h-[420px]" />
              </div>
            </div>

            <div class="mt-32 pt-10 border-t border-white/10">
              <div class="flex flex-wrap items-center gap-x-12 gap-y-6">
                <p class="text-sm font-bold text-white shrink-0">Trusted by:</p>
                <div class="flex-1 overflow-hidden min-w-[200px]">
                  <div class="flex gap-16 items-center animate-scroll" style="animation-duration: 30s;">
                    <img v-for="(logo, i) in logos" :key="i" :src="logo.image_url" :alt="logo.title"
                      class="h-7 md:h-9 opacity-70 grayscale hover:grayscale-0 hover:opacity-100 transition-all duration-300"
                      onerror="this.style.display='none'" />
                    <img v-for="(logo, i) in logos" :key="'dup-' + i" :src="logo.image_url" :alt="logo.title"
                      class="h-7 md:h-9 opacity-70 grayscale hover:grayscale-0 hover:opacity-100 transition-all duration-300"
                      onerror="this.style.display='none'" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <SectionRenderer :content="industry.detail" />

        <div class="text-center py-8">
          <NuxtLink to="/" class="text-[#0aa8a7] hover:text-[#16d5d4] font-semibold no-underline">
            Back to Home
          </NuxtLink>
        </div>
      </template>
    </main>

    <Footer />
  </div>
</template>

<script setup>
import SectionRenderer from '~/components/landingpage/industry-detail/SectionRenderer.vue'
import Header from '~/components/landingpage/Header.vue'
import Footer from '~/components/landingpage/Footer.vue'
const route = useRoute()
const slug = route.params.slug

const { data: industry, pending } = await useFetch(`/api/landingpage/industries/${slug}`)

const heroTitle = computed(() => industry.value?.detail?.hero?.title || industry.value?.title)

useSeoMeta({
  title: heroTitle.value ?? 'Industry',
})

definePageMeta({
  layout: 'blank',
  skipTenantCheck: true,
})

const fallbackLogos = [
  { id: '1', title: 'Calendly', image_url: '/landingpage/sponsors/calenly.png' },
  { id: '2', title: 'Contena', image_url: '/landingpage/sponsors/contena.png' },
  { id: '3', title: 'Mentora', image_url: '/landingpage/sponsors/mentora.png' },
  { id: '4', title: 'Schedullin', image_url: '/landingpage/sponsors/schedullin.png' },
  { id: '5', title: 'Stockita', image_url: '/landingpage/sponsors/stockita.png' },
  { id: '6', title: 'Invoice', image_url: '/landingpage/sponsors/invoice.png' },
]

const { data: logoData, error: logoError } = await useFetch('/api/landingpage/logos')

const logos = computed(() => {
  if (logoError.value || !logoData.value?.logos?.length) return fallbackLogos
  return logoData.value.logos
})

function scrollToFaq() {
  const el = document.getElementById('faq')
  if (el) {
    el.scrollIntoView({ behavior: 'smooth' })
  } else {
    navigateTo(`${route.path}#faq`)
  }
}
</script>

<style scoped>
@keyframes scroll {
  0% {
    transform: translateX(0);
  }

  100% {
    transform: translateX(-50%);
  }
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