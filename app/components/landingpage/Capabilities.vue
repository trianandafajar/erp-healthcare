<template>
  <section class="py-20 md:py-28">
    <div class="container mx-auto">
      <div class="text-center max-w-2xl mx-auto mb-14">
        <h2 class="text-3xl md:text-4xl font-bold text-gray-900">Core Capabilities</h2>
        <p class="mt-4 text-gray-500 leading-relaxed">Powerful features designed to transform how healthcare facilities operate every day.</p>
      </div>

      <div class="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div v-for="cap in capabilities" :key="cap.title" class="group relative bg-white rounded-2xl p-8 border border-gray-100 hover:border-[#176D37]/20 transition-all duration-300">
          <div class="absolute inset-0 bg-gradient-to-br from-[#176D37]/0 to-[#176D37]/0 group-hover:from-[#176D37]/[0.02] group-hover:to-transparent rounded-2xl transition-all duration-300 pointer-events-none" />
          <div class="relative">
            <div class="w-12 h-12 rounded-full bg-[#176D37]/10 flex items-center justify-center mb-5">
              <i :class="['mdi', cap.icon, 'text-[#176D37]', 'text-2xl']"></i>
            </div>
            <h3 class="text-lg font-bold text-gray-900">{{ cap.title }}</h3>
            <p class="mt-2 text-sm text-gray-500 leading-relaxed">{{ cap.description }}</p>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
const capabilities = [
  { icon: 'mdi-account-multiple-outline', title: 'Multi-Role Access', description: 'Role-based dashboards for doctors, nurses, pharmacists, receptionists, and administrators.' },
  { icon: 'mdi-chart-box-outline', title: 'Real-Time Analytics', description: 'Live dashboards with key metrics, patient flow, revenue tracking, and operational insights.' },
  { icon: 'mdi-shield-check-outline', title: 'Security & Compliance', description: 'HIPAA-compliant data encryption, role-based access control, and complete audit trails.' },
  { icon: 'mdi-monitor-dashboard', title: 'Cross-Platform', description: 'Access from desktop, tablet, and mobile with responsive design and offline capability.' },
];
</script>
