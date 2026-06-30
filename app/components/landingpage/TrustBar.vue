<template>
  <section class="border-y border-border bg-[#edf6f5]">
    <div class="container mx-auto">
      <div class="grid grid-cols-2 md:grid-cols-4">
        <div v-for="stat in stats" :key="stat.label" class="px-6 py-10 text-center md:text-left">
          <div class="font-primary text-3xl font-bold tabular-nums tracking-tight text-dark md:text-[2.75rem]">
            {{ stat.value }}
          </div>
          <div class="mt-2 text-[13px] uppercase tracking-wide text-text/70">
            {{ stat.label }}
          </div>
        </div>
      </div>

      <div class="flex flex-col items-center justify-between gap-4 py-12 text-xs text-text/60 md:flex-row">
        <p>Trusted by hospitals, clinics, and laboratories worldwide.</p>
        <div class="flex items-center gap-6">
          <span class="font-semibold text-dark">Best Healthcare ERP</span>
          <span class="hidden h-3 w-px md:block" />
          <span class="font-semibold text-dark">Top Rated Platform</span>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
const stats = [
  { value: '500+', label: 'Hospitals & Clinics' },
  { value: '50K+', label: 'Healthcare Professionals' },
  { value: '98%', label: 'Satisfaction Rate' },
  { value: '99.9%', label: 'System Uptime' },
];
</script>