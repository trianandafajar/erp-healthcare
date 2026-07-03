<template>
  <section id="testimonials" class="py-20 md:py-28 bg-[#edf6f5]">
    <div class="container mx-auto">
      <div class="text-center max-w-2xl mx-auto mb-14">
        <h2 class="text-3xl md:text-4xl font-bold text-gray-900">Trusted by Healthcare<br class="hidden sm:block" />
          Professionals</h2>
        <p class="mt-4 text-gray-500 leading-relaxed">See how healthcare facilities across Indonesia are transforming
          their operations with our platform.</p>
      </div>

      <div class="grid md:grid-cols-3 gap-6">
        <div v-for="(testimonial, i) in testimonials" :key="i" class="bg-white rounded-2xl p-8 border border-gray-100">
          <div class="flex items-center gap-1 mb-4">
            <svg v-for="n in 5" :key="n" class="w-4 h-4 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
              <path
                d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
          </div>
          <p class="text-[#176D37] text-sm leading-relaxed mb-6">"{{ testimonial.quote }}"</p>
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-full bg-[#176D37]/10 flex items-center justify-center text-sm font-bold text-[#176D37]">
              <img v-if="testimonial.image_url" :src="testimonial.image_url" class="w-10 h-10 rounded-full object-cover" onerror="this.style.display='none'" />
              <span v-else>{{ testimonial.initials }}</span>
            </div>
            <div>
              <div class="text-sm font-bold text-gray-900">{{ testimonial.name }}</div>
              <div class="text-xs text-gray-500">{{ testimonial.role }}, {{ testimonial.institution }}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
import { computed } from 'vue'

const fallbackTestimonials = [
  {
    quote: "This platform has completely transformed how we manage patient records. The integration between registration, pharmacy, and billing saved us hours of manual work every day.",
    initials: 'DR',
    name: 'Dr. Andi Pratama',
    role: 'Director',
    institution: 'RS Pusat Jakarta',
    image_url: '/landingpage/testimonials/andri.jpg',
  },
  {
    quote: "The real-time dashboard and reporting features give us unprecedented visibility into our operations. We can now make data-driven decisions that improve patient care.",
    initials: 'SN',
    name: 'Siti Nurhaliza',
    role: 'Head of Operations',
    institution: 'Klinik Sehat Keluarga',
    image_url: '/landingpage/testimonials/siti.jpg',
  },
  {
    quote: "Implementing this ERP was the best decision we made. The pharmacy module alone reduced medication errors by 80% and streamlined our entire supply chain.",
    initials: 'AR',
    name: 'Apt. Rahmatullah',
    role: 'Pharmacy Manager',
    institution: 'Apotek Medika Farma',
    image_url: '/landingpage/testimonials/rahmatullah.jpg',
  },
];

const { data, error } = await useFetch('/api/landingpage/testimonials')

const testimonials = computed(() => {
  if (error.value || !data.value?.testimonials?.length) return fallbackTestimonials
  return data.value.testimonials
})
</script>
