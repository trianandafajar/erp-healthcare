<template>
  <Header />
  <div v-if="pending" class="d-flex justify-center py-16">
    <v-progress-circular indeterminate color="primary" />
  </div>
  <div v-else-if="!industry" class="d-flex justify-center py-16 text-medium-emphasis">
    Industry not found
  </div>
  <template v-else>
    <section class="relative min-h-screen w-full overflow-hidden bg-[#0a0a0a] flex items-center py-20 md:py-0">
      <div class="pointer-events-none absolute inset-0 opacity-60" style="
          background-image: radial-gradient(rgba(245, 166, 35, 0.35) 1px, transparent 1px);
          background-size: 20px 20px;
          -webkit-mask-image: radial-gradient(ellipse 55% 70% at 88% 35%, black 0%, transparent 70%);
          mask-image: radial-gradient(ellipse 55% 70% at 88% 35%, black 0%, transparent 70%);
        "></div>

      <div class="relative z-10 max-w-6xl w-full mx-auto px-6">
        <div class="grid md:grid-cols-2 gap-12 md:gap-8 items-center">
          <div class="min-w-0">
            <h1
              class="text-4xl md:text-5xl lg:text-6xl font-extrabold leading-[1.12] bg-gradient-to-r from-amber-300 via-orange-400 to-orange-500 bg-clip-text text-transparent break-words">
              {{ industry.detail?.hero?.title || industry.title }}
            </h1>

            <p class="mt-6 text-gray-400 text-base md:text-lg leading-relaxed max-w-xl [overflow-wrap:anywhere]">
              {{ industry.detail?.hero?.description || industry.description }}
            </p>

            <div class="mt-9 flex flex-wrap items-center gap-4">

              <NuxtLink :to="`${route.path}#faq`" @click.prevent="scrollToFaq"
                class="inline-flex items-center justify-center rounded-lg bg-orange-500 px-7 py-3.5 text-sm md:text-base font-bold text-white shadow-lg shadow-orange-500/25 transition-colors hover:bg-orange-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-300 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0a0a0a]">
                Find Your Solution
              </NuxtLink>
              <NuxtLink to="/login"
                class="inline-flex items-center justify-center rounded-lg bg-[#7a1f1f] px-7 py-3.5 text-sm md:text-base font-bold text-white transition-colors hover:bg-[#8f2626] focus:outline-none focus-visible:ring-2 focus-visible:ring-red-300 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0a0a0a]">
                Try Free
              </NuxtLink>
            </div>
          </div>
          <div class="relative mx-auto w-full max-w-md md:max-w-none min-w-0">
            <div
              class="absolute left-1/2 -bottom-8 h-32 w-[85%] -translate-x-1/2 bg-gradient-to-b from-orange-500/50 to-transparent blur-2xl"
              style="clip-path: polygon(0 0, 100% 0, 52% 100%, 48% 100%);" aria-hidden="true"></div>

            <img :src="industry.detail?.hero?.image_url || industry.image_url" :alt="industry.title"
              class="relative w-full rounded-2xl object-cover max-h-[420px] shadow-2xl ring-1 ring-white/10" />
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
  <Footer />
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
})
</script>