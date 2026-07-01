<template>
  <section class="py-12 md:py-24 bg-gray-50">
    <div class="mx-6 max-w-3xl mx-auto">
      <h2 class="text-3xl md:text-4xl font-bold text-gray-900 text-center mb-12">
        Frequently Asked Questions
      </h2>
      <div class="space-y-3">
        <div v-for="(item, index) in faq" :key="index"
          class="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <button @click="toggle(index)"
            class="w-full flex items-center justify-between p-5 text-left font-semibold text-gray-900 hover:bg-gray-50 transition-colors">
            {{ item.question }}
            <v-icon :icon="openIndex === index ? 'mdi-chevron-up' : 'mdi-chevron-down'" class="transition-transform" />
          </button>
          <div v-show="openIndex === index" class="px-5 pb-5 text-gray-600 leading-relaxed">
            {{ item.answer }}
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
import { ref } from 'vue'

defineProps({
  faq: {
    type: Array,
    required: true
  }
})

const openIndex = ref(null)

function toggle(index) {
  openIndex.value = openIndex.value === index ? null : index
}
</script>
