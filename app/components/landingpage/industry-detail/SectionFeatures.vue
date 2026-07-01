<template>
  <section class="py-12 md:py-24 bg-white">
    <div class="max-w-6xl mx-auto">
      <h2 class="text-3xl md:text-4xl font-bold text-gray-900 text-center mb-12">
        Key Features
      </h2>
      <div class="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div v-for="(feature, index) in features" :key="index"
          class="p-6 rounded-xl border border-gray-200 hover:border-[#0aa8a7] transition-colors">
          <div class="w-12 h-12 rounded-lg bg-[#0aa8a7]/10 flex items-center justify-center mb-4">
            <v-icon :icon="feature.icon || 'mdi-check-circle'" color="#0aa8a7" size="24" />
          </div>
          <h3 class="text-xl font-bold text-gray-900 mb-2">{{ feature.title }}</h3>
          <p class="text-gray-600 leading-relaxed">{{ feature.description }}</p>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
defineProps({
  features: {
    type: Array,
    required: true
  }
})
</script>
