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

      <div ref="tabBarEl" class="relative flex flex-wrap gap-2 my-10">
        <div ref="pillEl" class="absolute rounded-full pointer-events-none border-2"
          style="background-color: rgba(23, 109, 55, 0.08); border-color: #176D37; z-index: 0; top: 0; left: 0;"></div>

        <button v-for="(tab, idx) in tabs" :key="tab.id" :ref="el => tabRefs[idx] = el" @click="selectTab(tab.id)"
          :style="{ color: '#176D37' }"
          class="relative z-10 flex items-center gap-2 px-5 py-2.5 text-sm font-medium rounded-full border-2 border-transparent outline-none cursor-pointer bg-transparent transition-colors duration-200"
          :class="activeTab !== tab.id && 'hover:bg-gray-50'">
          <v-icon :icon="tab.icon" size="18" color="#176D37" />
          {{ tab.label }}
        </button>
      </div>

      <div class="grid lg:grid-cols-2 gap-12 items-center">
        <div ref="listEl" class="relative min-h-[260px]">
          <div v-for="(item, i) in activeFeatures" :key="i" :ref="el => itemRefs[i] = el"
            class="flex gap-4 mb-8 last:mb-0">
            <div class="shrink-0 w-10 h-10 rounded-full flex items-center justify-center"
              style="background-color: #e8f5ee;">
              <v-icon :icon="item.icon" size="20" color="#176D37" />
            </div>
            <div>
              <h4 class="font-semibold text-gray-900 text-[15px]">{{ item.title }}</h4>
              <p class="mt-1 text-sm text-gray-500 leading-relaxed">{{ item.description }}</p>
            </div>
          </div>
        </div>

        <div class="relative overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
          <img ref="imgEl" :src="activeImage" :alt="activeTab + ' preview'" class="w-full object-cover block" />
        </div>

      </div>
    </div>
  </section>
</template>

<script setup>
import { ref, reactive, computed, onMounted, nextTick, onUnmounted } from 'vue'
import { animate, stagger, utils } from 'animejs'

const activeTab = ref('registration')
const tabRefs = reactive([])
const itemRefs = reactive([])
const pillEl = ref(null)
const tabBarEl = ref(null)
const listEl = ref(null)
const imgEl = ref(null)

const tabs = [
  { id: 'registration', label: 'Registration', icon: 'mdi-account-plus' },
  { id: 'medical', label: 'Medical records', icon: 'mdi-clipboard-pulse' },
  { id: 'pharmacy', label: 'Pharmacy', icon: 'mdi-pill' },
  { id: 'billing', label: 'Billing', icon: 'mdi-receipt-text' },
]

const features = {
  registration: {
    image: '/landingpage/features/25.png',
    items: [
      { icon: 'mdi-lightning-bolt', title: 'Fast check-in', description: 'Reduce wait times with digital self-service kiosks and online pre-registration.' },
      { icon: 'mdi-database', title: 'Unified patient database', description: 'All patient data in one place — demographics, insurance, and medical history.' },
      { icon: 'mdi-format-list-numbered', title: 'Queue management', description: 'Real-time queue tracking with SMS and in-app notifications for patients.' },
    ],
  },
  medical: {
    image: '/landingpage/features/26.png',
    items: [
      { icon: 'mdi-file-document', title: 'Digital health records', description: 'Secure, accessible patient records with version history and audit trails.' },
      { icon: 'mdi-stethoscope', title: 'Diagnosis & treatment plans', description: 'Integrated SOAP notes, ICD-10 coding, and care plan management.' },
      { icon: 'mdi-test-tube', title: 'Lab & imaging integration', description: 'Direct integration with lab systems and PACS for imaging results.' },
    ],
  },
  pharmacy: {
    image: '/landingpage/features/27.png',
    items: [
      { icon: 'mdi-prescription', title: 'E-prescriptions', description: 'Digital prescriptions sent directly to the pharmacy with dosage validation.' },
      { icon: 'mdi-package-variant', title: 'Inventory tracking', description: 'Real-time stock monitoring with automatic reorder alerts and expiry tracking.' },
      { icon: 'mdi-truck-delivery', title: 'Dispensing workflow', description: 'End-to-end dispensing with verification steps and medication labeling.' },
    ],
  },
  billing: {
    image: '/landingpage/features/28.png',
    items: [
      { icon: 'mdi-file-check', title: 'Automated invoicing', description: 'Generate invoices automatically from consultations, procedures, and medications.' },
      { icon: 'mdi-shield-check', title: 'Insurance claims', description: 'Submit and track insurance claims with BPJS/private insurance integration.' },
      { icon: 'mdi-credit-card', title: 'Payment gateway', description: 'Accept cash, card, QRIS, and online payments with automatic reconciliation.' },
    ],
  },
}

const activeFeatures = computed(() => features[activeTab.value].items)
const activeImage = computed(() => features[activeTab.value].image)

let switching = false
function pillTargetFor(idx) {
  const btn = tabRefs[idx]
  if (!btn) return null
  return {
    left: btn.offsetLeft,
    top: btn.offsetTop,
    width: btn.offsetWidth,
    height: btn.offsetHeight,
  }
}

function movePillTo(idx, { instant = false } = {}) {
  const target = pillTargetFor(idx)
  if (!target || !pillEl.value) return

  if (instant) {
    utils.set(pillEl.value, target)
    return
  }

  animate(pillEl.value, {
    ...target,
    duration: 380,
    ease: 'outQuint',
  })
}

function animateListIn() {
  animate(itemRefs.filter(Boolean), {
    opacity: [0, 1],
    translateY: [16, 0],
    delay: stagger(70),
    duration: 420,
    ease: 'outCubic',
  })
}

function animateListOut(done) {
  animate(itemRefs.filter(Boolean), {
    opacity: [1, 0],
    translateY: [0, -10],
    delay: stagger(40),
    duration: 220,
    ease: 'inCubic',
    onComplete: done,
  })
}

function animateImage() {
  animate(imgEl.value, {
    opacity: [0, 1],
    scale: [1.04, 1],
    duration: 480,
    ease: 'outQuart',
  })
}

async function selectTab(id) {
  if (id === activeTab.value || switching) return
  switching = true

  const idx = tabs.findIndex(t => t.id === id)
  movePillTo(idx)

  animateListOut(async () => {
    activeTab.value = id
    await nextTick()
    animateListIn()
    animateImage()
    switching = false
  })
}

function syncPillInstant() {
  const idx = tabs.findIndex(t => t.id === activeTab.value)
  movePillTo(idx, { instant: true })
}

let resizeObserver

onMounted(async () => {
  await nextTick()
  syncPillInstant()
  animateListIn()

  resizeObserver = new ResizeObserver(() => syncPillInstant())
  if (tabBarEl.value) resizeObserver.observe(tabBarEl.value)
})

onUnmounted(() => {
  resizeObserver?.disconnect()
})
</script>