<template>
  <header class="header">
    <nav class="navbar container mx-auto flex items-center justify-between py-4">
      <div class="flex shrink-0 items-center">
         <Logo :src="logo" />
      </div>

      <button class="flex shrink-0 cursor-pointer items-center md:hidden" @click="navOpen = !navOpen">
        <svg v-if="navOpen" class="h-6 w-6 fill-current" viewBox="0 0 20 20">
          <polygon points="11 9 22 9 22 11 11 11 11 22 9 22 9 11 -2 11 -2 9 9 9 9 -2 11 -2"
            transform="rotate(45 10 10)" />
        </svg>
        <svg v-else class="h-6 w-6 fill-current" viewBox="0 0 20 20">
          <path d="M0 3h20v2H0V3z m0 6h20v2H0V9z m0 6h20v2H0V0z" />
        </svg>
      </button>

      <div :class="[
        'w-full md:flex md:w-auto md:flex-1 md:justify-center',
        navOpen ? 'block' : 'hidden md:flex'
      ]">
        <ul class="block w-full md:flex md:w-auto md:items-center md:space-x-8">
          <li v-for="item in menuItems" :key="item.name">
            <a :href="item.url" :class="[
              'block py-2 font-semibold md:py-0',
              item.url === currentPath ? 'text-teal-500' : 'text-gray-800 hover:text-teal-500'
            ]" @click="navOpen = false">
              {{ item.name }}
            </a>
          </li>
        </ul>
      </div>

      <div class="hidden shrink-0 items-center justify-end md:flex">
        <a href="/login" class="rounded-full bg-teal-500 px-6 py-3 font-semibold text-white hover:bg-teal-600">
          Get Started
        </a>
      </div>
    </nav>
  </header>
</template>

<script setup>
import Logo from "./Logo.vue";
import config from "~/config/config.json";

const { logo } = config.site;

const route = useRoute();
const navOpen = ref(false);

const menuItems = [
  { name: "Home", url: "/" },
  { name: "Blog", url: "/blog" },
  { name: "Pricing", url: "/pricing" },
  { name: "Contact", url: "/contact" },
  { name: "FAQ", url: "/faq" },
];
</script>