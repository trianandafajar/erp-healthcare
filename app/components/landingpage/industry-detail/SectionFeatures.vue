<template>
  <section class="relative py-16 md:py-24 bg-white overflow-hidden">
    <div class="max-w-6xl mx-auto px-6">
      <div class="text-center max-w-3xl mx-auto mb-12">
        <h2 class="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 leading-tight">
          {{ title }} <span :style="{ color: primaryColor }">{{ titleHighlight }}</span> {{ titleSuffix }}
        </h2>
      </div>

      <div class="relative">
        <button v-show="canScrollLeft" @click="scrollByCard(-1)" aria-label="Previous feature"
          class="hidden md:flex absolute -left-5 top-[180px] z-10 w-11 h-11 rounded-full bg-white shadow-md border border-gray-100 items-center justify-center hover:bg-gray-50 transition-colors">
          <v-icon icon="mdi-chevron-left" :color="primaryColor" size="24" />
        </button>

        <div ref="scrollerRef"
          class="feature-scroller flex gap-6 overflow-x-auto scroll-smooth snap-x snap-mandatory pb-2"
          @scroll="updateScrollState">
          <div v-for="(feature, index) in features" :key="index"
            class="feature-card snap-start shrink-0 w-[85%] sm:w-[360px] rounded-2xl bg-gray-50 p-6 flex flex-col">
            <div class="relative h-[180px] mb-6 flex items-center justify-center overflow-hidden rounded-xl">
              <img v-if="feature.image_url" :src="feature.image_url" :alt="feature.title"
                class="w-full h-full object-contain" />
              <div v-else class="w-14 h-14 rounded-lg flex items-center justify-center"
                :style="{ backgroundColor: primaryColor + '1a' }">
                <v-icon :icon="feature.icon || 'mdi-check-circle'" :color="primaryColor" size="28" />
              </div>
            </div>

            <h3 class="text-xl font-bold text-gray-900 mb-2 leading-snug">
              {{ feature.title }}
            </h3>
            <p class="text-gray-600 text-sm leading-relaxed mb-5">
              {{ feature.description }}
            </p>

            <div v-if="feature.points?.length" class="mb-6">
              <p class="text-base font-bold text-gray-900 mb-3">Features</p>
              <ul class="space-y-3">
                <li v-for="(point, pIndex) in feature.points" :key="pIndex" class="flex items-start gap-3">
                  <span class="flex h-5 w-5 shrink-0 items-center justify-center rounded-full mt-0.5"
                    :style="{ backgroundColor: primaryColor }">
                    <v-icon icon="mdi-check" color="white" size="14" />
                  </span>
                  <span class="text-sm text-gray-700 leading-snug">{{ point }}</span>
                </li>
              </ul>
            </div>

<a
            v-if="feature.cta_text"
            :href="feature.cta_link || '#'"
            class="mt-auto block text-center text-white font-bold text-sm py-3 rounded-lg transition-opacity
            hover:opacity-90"
            :style="{ backgroundColor: primaryColor }"
            >
            {{ feature.cta_text }}
            </a>
          </div>
        </div>

        <button v-show="canScrollRight" @click="scrollByCard(1)" aria-label="Next feature"
          class="hidden md:flex absolute -right-5 top-[180px] z-10 w-11 h-11 rounded-full bg-white shadow-md border border-gray-100 items-center justify-center hover:bg-gray-50 transition-colors">
          <v-icon icon="mdi-chevron-right" :color="primaryColor" size="24" />
        </button>
      </div>
    </div>
  </section>
</template>

<script setup>
import { ref, onMounted, nextTick } from 'vue'

const props = defineProps({
  features: {
    type: Array,
    required: true,
  },
  title: {
    type: String,
    default: 'Explore All Essential Features of',
  },
  titleHighlight: {
    type: String,
    default: 'Hospital Management Software',
  },
  titleSuffix: {
    type: String,
    default: 'All-in-One',
  },
  primaryColor: {
    type: String,
    default: '#0aa8a7',
  },
})


const scrollerRef = ref(null)
const canScrollLeft = ref(false)
const canScrollRight = ref(false)

function updateScrollState() {
  const el = scrollerRef.value
  if (!el) return
  canScrollLeft.value = el.scrollLeft > 8
  canScrollRight.value = el.scrollLeft < el.scrollWidth - el.clientWidth - 8
}

function scrollByCard(direction) {
  const el = scrollerRef.value
  if (!el) return
  const card = el.querySelector('.feature-card')
  const step = card ? card.offsetWidth + 24 : 380
  el.scrollBy({ left: direction * step, behavior: 'smooth' })
}

onMounted(async () => {
  await nextTick()
  updateScrollState()
  window.addEventListener('resize', updateScrollState)
})
</script>

<style scoped>
.feature-scroller {
  scrollbar-width: none;
}

.feature-scroller::-webkit-scrollbar {
  display: none;
}
</style>