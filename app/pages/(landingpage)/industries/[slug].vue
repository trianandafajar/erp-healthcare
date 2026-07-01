<template>
  <Header />
  <div v-if="pending" class="d-flex justify-center py-16">
    <v-progress-circular indeterminate color="primary" />
  </div>
  <div v-else-if="!industry" class="d-flex justify-center py-16 text-medium-emphasis">
    Industry not found
  </div>
  <template v-else>
    <section class="py-12 md:py-24 bg-[#0a0a0a]">
      <div class="mx-6 max-w-6xl mx-auto">
        <div class="grid md:grid-cols-2 gap-8 items-center">
          <div>
            <h1 class="text-4xl md:text-5xl lg:text-6xl font-bold text-white leading-tight">
              {{ industry.detail?.hero?.title || industry.title }}
            </h1>
            <p class="mt-5 text-gray-400 text-lg leading-relaxed">
              {{ industry.detail?.hero?.description || industry.description }}
            </p>
          </div>
          <div>
            <img :src="industry.detail?.hero?.image_url || industry.image_url" :alt="industry.title"
              class="w-full rounded-2xl object-cover max-h-[400px]" />
          </div>
        </div>
      </div>
    </section>

    <SectionRenderer :content="industry.detail" />

    <div class="text-center py-8">
      <NuxtLink to="/" class="text-[#0aa8a7] hover:text-[#16d5d4] font-semibold no-underline">
        &larr; Back to Home
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
