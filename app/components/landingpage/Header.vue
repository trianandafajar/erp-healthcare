<template>
  <header class="header">
    <nav class="navbar container flex items-center justify-between">
      <div class="order-1">
      HALO
      </div>

      <button
        id="show-button"
        class="order-2 flex cursor-pointer items-center md:order-3 md:hidden"
        @click="navOpen = !navOpen"
      >
        <svg v-if="navOpen" class="h-6 fill-current" viewBox="0 0 20 20">
          <title>Menu Open</title>
          <polygon points="11 9 22 9 22 11 11 11 11 22 9 22 9 11 -2 11 -2 9 9 9 9 -2 11 -2" transform="rotate(45 10 10)" />
        </svg>
        <svg v-else class="h-6 fill-current" viewBox="0 0 20 20">
          <title>Menu Close</title>
          <path d="M0 3h20v2H0V3z m0 6h20v2H0V9z m0 6h20v2H0V0z" />
        </svg>
      </button>

      <div
        id="nav-menu"
        :class="['order-4 w-full md:order-2 md:w-auto', navOpen ? 'max-h-[1000px]' : 'max-h-0']"
      >
        <ul class="navbar-nav block w-full md:flex md:w-auto lg:space-x-2">
          <li v-for="(menu, i) in main" :key="'menu-' + i" class="nav-item">
            <template v-if="menu.hasChildren">
              <span class="nav-dropdown group relative">
                <span class="nav-link inline-flex items-center">
                  {{ menu.name }}
                  <svg class="h-4 w-4 fill-current" viewBox="0 0 20 20">
                    <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                  </svg>
                </span>
                <ul class="nav-dropdown-list hidden group-hover:block md:invisible md:absolute md:block md:opacity-0 md:group-hover:visible md:group-hover:opacity-100">
                  <li v-for="(child, ci) in menu.children" :key="'children-' + ci" class="nav-dropdown-item">
                    <NuxtLink :to="child.url" class="nav-dropdown-link block">{{ child.name }}</NuxtLink>
                  </li>
                </ul>
              </span>
            </template>
            <template v-else>
              <NuxtLink
                :to="menu.url"
                :class="['nav-link block', route.path === menu.url ? 'nav-link-active' : '']"
                @click="navOpen = false"
              >
                {{ menu.name }}
              </NuxtLink>
            </template>
          </li>
          <li v-if="enable" class="md:hidden">
            <NuxtLink class="btn btn-primary z-0 py-[14px]" :to="link">{{ label }}</NuxtLink>
          </li>
        </ul>
      </div>

      <div
        v-if="enable"
        class="order-3 hidden min-w-[160px] items-center justify-end md:flex"
      >
        <NuxtLink class="btn btn-primary z-0 py-[14px]" :to="link">{{ label }}</NuxtLink>
      </div>
    </nav>
  </header>
</template>

<script setup>
import config from "~/config/config.json";
import menu from "~/config/menu.json";

const { main } = menu;
const { logo } = config.site;
const { enable, label, link } = config.nav_button;
const route = useRoute();
const navOpen = ref(false);
</script>