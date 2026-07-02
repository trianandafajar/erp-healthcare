<template>
  <header :class="['header fixed top-0 left-0 w-full z-50 transition-all duration-300',
    (scrolled || alwaysShadow) ? 'bg-white/95 backdrop-blur-md shadow-sm' : 'bg-transparent'
  ]">
    <nav class="container mx-auto flex items-center justify-between h-16 md:h-[72px]">
      <div class="flex shrink-0 items-center">
        <Logo :src="logo" :class="['transition-all duration-300', isLight ? 'brightness-0 invert' : '']" />
      </div>

      <button class="flex shrink-0 cursor-pointer items-center md:hidden p-2" @click="navOpen = !navOpen">
        <svg v-if="navOpen"
          :class="['h-6 w-6 transition-colors duration-300', isLight ? 'text-white' : 'text-[#176D37]']" fill="none"
          viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
        <svg v-else :class="['h-6 w-6 transition-colors duration-300', isLight ? 'text-white' : 'text-[#176D37]']"
          fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      <div :class="[
        'fixed md:static inset-x-0 top-16 md:top-0 md:bg-transparent shadow-lg md:shadow-none md:flex md:flex-1 md:justify-center',
        navOpen ? 'block bg-white' : 'hidden md:flex'
      ]">
        <ul
          class="flex flex-col md:flex-row items-start md:items-center px-6 md:px-0 py-4 md:py-0 space-y-2 md:space-y-0 md:space-x-8">
          <li v-for="item in menuItems" :key="item.name">
            <NuxtLink :to="item.url" :class="[
              'block py-2 text-sm font-semibold transition-colors duration-300',
              item.url === currentPath
                ? 'text-[#176D37]'
                : (isLight ? 'text-white/90 hover:text-white' : 'text-gray-700 hover:text-[#176D37]')
            ]" @click="navOpen = false">
              {{ item.name }}
            </NuxtLink>
          </li>
        </ul>
      </div>

      <div class="hidden md:flex shrink-0 items-center space-x-3">
        <NuxtLink to="/login"
          class="inline-flex items-center px-5 py-2.5 text-sm font-semibold text-white bg-[#176D37] rounded-full hover:bg-[#089695] transition-all hover:shadow-lg hover:shadow-[#176D37]/20">
          Sign In
        </NuxtLink>
      </div>
    </nav>
  </header>
</template>

<script setup>
import { computed } from 'vue'
import Logo from "./Logo.vue";
import config from "~/config/config.json";

const { logo } = config.site;

const props = defineProps({
  darkHero: {
    type: Boolean,
    default: false,
  },
  alwaysShadow: {
    type: Boolean,
    default: false,
  },
})

const route = useRoute();
const currentPath = computed(() => route.path);
const navOpen = ref(false);
const scrolled = ref(false);

const isLight = computed(() => props.darkHero && !scrolled.value);

const menuItems = [
  { name: "Home", url: "/" },
  { name: "Features", url: "#features" },
  { name: "Industries", url: "#industries" },
  { name: "Testimonials", url: "#testimonials" },
];

let scrollHandler;
onMounted(() => {
  scrollHandler = () => {
    scrolled.value = window.scrollY > 20;
  };
  window.addEventListener('scroll', scrollHandler, { passive: true });
});

onUnmounted(() => {
  if (scrollHandler) window.removeEventListener('scroll', scrollHandler);
});
</script>