<template>
  <section id="industries" class="py-12 md:py-24">
    <div class="mx-6 rounded-3xl bg-[#0a0a0a] overflow-hidden">
      <div class="p-8 lg:p-14">
        <div class="max-w-3xl mb-12">
          <h2 class="text-4xl md:text-5xl lg:text-6xl font-bold text-white leading-tight">
            Built for Every
            <br>
            Healthcare Setting
          </h2>

          <p class="mt-5 text-gray-400 text-lg leading-relaxed max-w-2xl">
            Tailored solutions for different types of healthcare facilities,
            from small clinics to large hospital networks.
          </p>
        </div>
        <div class="grid grid-cols-1 md:grid-cols-[repeat(13,minmax(0,1fr))] gap-5">

          <div v-for="(industry, index) in displayIndustries" :key="industry.id" :class="[
            'group relative overflow-hidden rounded-3xl min-h-[340px]',
            widthClasses[index]
          ]">
            <img :src="industry.image" :alt="industry.title"
              class="absolute inset-0 h-full w-full object-cover transition duration-700 group-hover:scale-110" />
            <div class="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-black/10" />
            <div
              class="absolute inset-0 rounded-3xl border border-white/10 transition-all duration-300 group-hover:border-[#0aa8a7]" />

            <div class="absolute inset-0 flex flex-col justify-end p-8">
              <div class="flex items-center gap-4">
                <h3 class="text-white font-bold text-2xl border-b-2 border-white/80 pb-1 w-fit">
                  {{ industry.title }}
                </h3>
              </div>

              <div
                class="grid transition-all duration-500 ease-out grid-rows-[0fr] opacity-100 group-hover:grid-rows-[1fr] group-hover:opacity-100">
                <div class="overflow-hidden">
                  <div class="pt-5">
                    <p class="text-gray-300 text-sm leading-6 mb-4">
                      {{ industry.description }}
                    </p>

                    <NuxtLink v-if="industry.slug" :to="'/industries/' + industry.slug"
                      class="inline-flex items-center gap-2 text-[#0aa8a7] font-semibold hover:text-[#16d5d4] no-underline">
                      Learn More

                      <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5 transition group-hover:translate-x-1"
                        fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                      </svg>

                    </NuxtLink>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
const widthPattern = [
  'md:col-span-5',
  'md:col-span-4',
  'md:col-span-4',
  'md:col-span-4',
  'md:col-span-5',
  'md:col-span-4',
]

const { data: industries } = await useFetch('/api/landingpage/industries')

const displayIndustries = computed(() =>
  (industries.value ?? []).map(item => ({
    id: item.id,
    title: item.title,
    description: item.description,
    image: item.image_url,
    slug: item.slug
  }))
)

const widthClasses = computed(() =>
  displayIndustries.value.map((_, i) => widthPattern[i % widthPattern.length])
)
</script>
