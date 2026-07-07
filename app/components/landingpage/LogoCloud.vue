<template>
  <section class="py-14 bg-white border-b border-gray-100">
    <div class="container mx-auto">
      <p class="text-center text-xs font-semibold uppercase tracking-widest text-gray-400 mb-8">Trusted by Leading
        Healthcare Institutions</p>
      <div v-if="logos.length" ref="marqueeViewport" class="overflow-hidden">
        <div ref="marqueeTrack" class="flex gap-16 items-center w-fit will-change-transform">
          <img v-for="(logo, i) in logos" :key="i" :src="logo.image_url" :alt="logo.title"
            class="h-8 md:h-10 opacity-40 grayscale hover:opacity-70 hover:grayscale-0 transition-all duration-300"
            onerror="this.style.display='none'" />
          <img v-for="(logo, i) in logos" :key="'dup-' + i" :src="logo.image_url" :alt="logo.title"
            class="h-8 md:h-10 opacity-40 grayscale hover:opacity-70 hover:grayscale-0 transition-all duration-300"
            onerror="this.style.display='none'" />
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
import { animate, utils } from 'animejs'

const fallbackLogos = [
  { id: '1', title: 'Calendly', image_url: '/landingpage/sponsors/calenly.png' },
  { id: '2', title: 'Contena', image_url: '/landingpage/sponsors/contena.png' },
  { id: '3', title: 'Mentora', image_url: '/landingpage/sponsors/mentora.png' },
  { id: '4', title: 'Schedullin', image_url: '/landingpage/sponsors/schedullin.png' },
  { id: '5', title: 'Stockita', image_url: '/landingpage/sponsors/stockita.png' },
  { id: '6', title: 'Invoice', image_url: '/landingpage/sponsors/invoice.png' },
]

const { data, error } = await useFetch('/api/landingpage/logos')

const logos = computed(() => {
  if (error.value || !data.value?.logos?.length) return fallbackLogos
  return data.value.logos
})

const marqueeViewport = ref(null)
const marqueeTrack = ref(null)

const PIXELS_PER_SECOND = 40
let marqueeAnimation = null
let resizeObserver = null
let lastWidth = 0

function waitForImages(container) {
  const images = Array.from(container.querySelectorAll('img'))
  return Promise.all(
    images.map((img) =>
      img.complete
        ? Promise.resolve()
        : new Promise((resolve) => {
          img.addEventListener('load', resolve, { once: true })
          img.addEventListener('error', resolve, { once: true })
        })
    )
  )
}

function buildMarquee() {
  const track = marqueeTrack.value
  if (!track) return

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  if (prefersReducedMotion) return

  const images = track.querySelectorAll('img')
  const setLength = logos.value.length
  const firstImg = images[0]
  const firstDupImg = images[setLength]
  if (!firstImg || !firstDupImg) return

  utils.set(track, { translateX: 0 })

  const singleSetWidth = firstDupImg.getBoundingClientRect().left - firstImg.getBoundingClientRect().left
  if (!singleSetWidth) return

  if (Math.abs(singleSetWidth - lastWidth) < 1) return
  lastWidth = singleSetWidth

  marqueeAnimation?.pause()
  marqueeAnimation = animate(track, {
    translateX: -singleSetWidth,
    duration: (singleSetWidth / PIXELS_PER_SECOND) * 1000,
    ease: 'linear',
    loop: true,
    alternate: false,
  })
}

onMounted(async () => {
  await nextTick()
  if (marqueeTrack.value) await waitForImages(marqueeTrack.value)
  buildMarquee()

  resizeObserver = new ResizeObserver(() => buildMarquee())
  if (marqueeViewport.value) resizeObserver.observe(marqueeViewport.value)
})

onBeforeUnmount(() => {
  marqueeAnimation?.pause()
  resizeObserver?.disconnect()
})
</script>