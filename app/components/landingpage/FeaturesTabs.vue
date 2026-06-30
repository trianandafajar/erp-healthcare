<template>
  <section id="features" class="py-20 md:py-28 bg-white">
    <div class="container mx-auto px-4">

      <div class="text-center max-w-2xl mx-auto mb-12">
        <h2 class="text-3xl md:text-4xl font-semibold text-gray-900 leading-snug">
          Everything you need to<br class="hidden sm:block" />
          run your healthcare facility
        </h2>
        <p class="mt-4 text-gray-500 leading-relaxed text-[15px]">
          Integrated modules that work together seamlessly, from patient
          registration to billing and beyond.
        </p>
      </div>

      <!-- Tab Bar -->
      <div class="flex flex-wrap gap-2 mb-10">
        <button v-for="tab in tabs" :key="tab.id" @click="activeTab = tab.id" :style="activeTab === tab.id
          ? 'background-color: #176D37; color: #ffffff;'
          : 'background-color: #e8f5ee; color: #176D37;'"
          class="flex items-center gap-2 px-5 py-2.5 text-sm font-medium rounded-full transition-all duration-200 border-0 outline-none cursor-pointer">
          <v-icon :icon="tab.icon" size="18" :color="activeTab === tab.id ? '#ffffff' : '#176D37'" />
          {{ tab.label }}
        </button>
      </div>

      <!-- Content Grid -->
      <div class="grid lg:grid-cols-2 gap-12 items-center">

        <!-- Left: Feature List -->
        <div class="space-y-8">
          <TransitionGroup name="feat" tag="div" class="space-y-8">
            <div v-for="(item, i) in activeFeatures" :key="activeTab + i" class="flex gap-4">
              <div class="shrink-0 w-10 h-10 rounded-full flex items-center justify-center"
                style="background-color: #e8f5ee;">
                <v-icon :icon="item.icon" size="20" color="#176D37" />
              </div>
              <div>
                <h4 class="font-semibold text-gray-900 text-[15px]">{{ item.title }}</h4>
                <p class="mt-1 text-sm text-gray-500 leading-relaxed">{{ item.description }}</p>
              </div>
            </div>
          </TransitionGroup>
        </div>

        <!-- Right: Image -->
        <div>
          <Transition name="img-fade" mode="out-in">
            <div :key="activeTab" class="rounded-2xl overflow-hidden border border-gray-100 bg-white shadow-sm">
              <img :src="activeImage" :alt="activeTab + ' preview'" class="w-full object-cover" />
            </div>
          </Transition>
        </div>

      </div>
    </div>
  </section>
</template>

<script setup>
const activeTab = ref('registration')

const tabs = [
  { id: 'registration', label: 'Registration', icon: 'mdi-account-plus' },
  { id: 'medical', label: 'Medical records', icon: 'mdi-clipboard-pulse' },
  { id: 'pharmacy', label: 'Pharmacy', icon: 'mdi-pill' },
  { id: 'billing', label: 'Billing', icon: 'mdi-receipt-text' },
]

const features = {
  registration: {
    image: '/landingpage/service-slide-1.png',
    items: [
      { icon: 'mdi-lightning-bolt', title: 'Fast check-in', description: 'Reduce wait times with digital self-service kiosks and online pre-registration.' },
      { icon: 'mdi-database', title: 'Unified patient database', description: 'All patient data in one place — demographics, insurance, and medical history.' },
      { icon: 'mdi-format-list-numbered', title: 'Queue management', description: 'Real-time queue tracking with SMS and in-app notifications for patients.' },
    ],
  },
  medical: {
    image: '/landingpage/service-slide-2.png',
    items: [
      { icon: 'mdi-file-document', title: 'Digital health records', description: 'Secure, accessible patient records with version history and audit trails.' },
      { icon: 'mdi-stethoscope', title: 'Diagnosis & treatment plans', description: 'Integrated SOAP notes, ICD-10 coding, and care plan management.' },
      { icon: 'mdi-test-tube', title: 'Lab & imaging integration', description: 'Direct integration with lab systems and PACS for imaging results.' },
    ],
  },
  pharmacy: {
    image: '/landingpage/service-slide-3.png',
    items: [
      { icon: 'mdi-prescription', title: 'E-prescriptions', description: 'Digital prescriptions sent directly to the pharmacy with dosage validation.' },
      { icon: 'mdi-package-variant', title: 'Inventory tracking', description: 'Real-time stock monitoring with automatic reorder alerts and expiry tracking.' },
      { icon: 'mdi-truck-delivery', title: 'Dispensing workflow', description: 'End-to-end dispensing with verification steps and medication labeling.' },
    ],
  },
  billing: {
    image: '/landingpage/service-slide-1.png',
    items: [
      { icon: 'mdi-file-check', title: 'Automated invoicing', description: 'Generate invoices automatically from consultations, procedures, and medications.' },
      { icon: 'mdi-shield-check', title: 'Insurance claims', description: 'Submit and track insurance claims with BPJS/private insurance integration.' },
      { icon: 'mdi-credit-card', title: 'Payment gateway', description: 'Accept cash, card, QRIS, and online payments with automatic reconciliation.' },
    ],
  },
}

const activeFeatures = computed(() => features[activeTab.value].items)
const activeImage = computed(() => features[activeTab.value].image)
</script>

<style scoped>
.feat-enter-active,
.feat-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}

.feat-enter-from {
  opacity: 0;
  transform: translateY(8px);
}

.feat-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}

.img-fade-enter-active,
.img-fade-leave-active {
  transition: opacity 0.25s ease;
}

.img-fade-enter-from,
.img-fade-leave-to {
  opacity: 0;
}
</style>