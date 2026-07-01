<template>
  <section id="faq" class="relative py-16 md:py-24 bg-white overflow-hidden">
    <div class="max-w-6xl mx-auto px-6">
      <div class="text-center max-w-3xl mx-auto mb-16">
        <h2 class="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 leading-tight">
          {{ title }} <span class="text-orange-500">{{ titleHighlight }}</span> {{ titleSuffix }}
        </h2>
        <p class="mt-5 text-gray-600 text-base md:text-lg leading-relaxed">
          {{ description }}
        </p>
      </div>

      <div class="grid md:grid-cols-2 gap-10 md:gap-14 items-center">
        <div class="rounded-xl border border-gray-200 divide-y divide-gray-200 overflow-hidden bg-white">
          <div v-for="(item, index) in faq" :key="index">
            <button @click="toggle(index)" class="w-full flex items-center gap-4 px-6 py-6 text-left group"
              :aria-expanded="openIndex === index">
              <span class="flex h-8 w-8 shrink-0 items-center justify-center text-orange-500">
                <v-icon :icon="item.icon || 'mdi-help-circle-outline'" size="26" />
              </span>
              <span class="flex-1 text-base md:text-lg font-bold text-gray-900">{{ item.question }}</span>
              <v-icon :icon="openIndex === index ? 'mdi-chevron-up' : 'mdi-chevron-down'"
                class="shrink-0 text-gray-400 transition-transform" size="22" />
            </button>
            <div v-show="openIndex === index"
              class="px-6 pb-6 pl-[3.75rem] -mt-2 text-sm md:text-base leading-relaxed text-gray-600">
              {{ item.answer }}
            </div>
          </div>
        </div>
        <div class="relative flex min-h-[320px] items-center justify-center">
          <img :key="openIndex ?? -1" :src="faq[openIndex]?.image_url || faq[0]?.image_url" :alt="title"
            class="relative z-10 w-full max-w-lg object-contain select-none pointer-events-none" />
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
import { ref } from 'vue'

const props = defineProps({
  faq: {
    type: Array,
    required: true,
  },
  title: {
    type: String,
    default: 'Why Chosee',
  },
  titleHighlight: {
    type: String,
    default: 'Hospital ERP',
  },
  titleSuffix: {
    type: String,
    default: 'for Modern Healthcare',
  },
  description: {
    type: String,
    default: 'Discover the benefits of our Hospital ERP solution and how it can help streamline your healthcare operations.',
  },
  image: {
    type: String,
    default: '',
  },
})

const openIndex = ref(0)

function toggle(index) {
  openIndex.value = openIndex.value === index ? null : index
}
</script>