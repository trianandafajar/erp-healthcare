<template>
  <footer class="bg-gray-900 text-gray-400">
    <div class="container mx-auto py-16">
      <div class="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
        <div>
          <img :src="config.site.logo" :alt="config.site.title" class="h-8 brightness-0 invert" />
          <p class="mt-4 text-sm leading-relaxed">{{ config.params.footer_content }}</p>
        </div>
        <div v-for="col in footer" :key="col.name">
          <h3 class="text-sm font-bold text-white mb-4">{{ col.name }}</h3>
          <ul class="space-y-2">
            <li v-for="item in col.menu" :key="item.text">
              <NuxtLink :to="item.url"
                :class="['text-sm transition-colors', isActive(item.url) ? 'text-white font-bold' : 'hover:text-white']">
                {{ item.text }}
              </NuxtLink>
            </li>
          </ul>
        </div>
      </div>
    </div>
    <div class="border-t border-gray-800">
      <div class="container mx-auto py-6 flex flex-col items-center gap-4">
        <p class="text-sm" v-html="copyrightMd"></p>
      </div>
    </div>
  </footer>
</template>

<script setup>
import { computed } from 'vue';
import config from "~/config/config.json";
import menu from "~/config/menu.json";
import { markdownify } from "~/utils/textConverter";

const route = useRoute();

function isActive(url) {
  if (!url) return false;

  if (url.startsWith('#')) {
    return route.hash === url;
  }
  const [urlPath, urlQueryString] = url.split('?');
  const targetPath = urlPath || '/';

  if (route.path !== targetPath) return false;

  if (urlQueryString) {
    const urlParams = new URLSearchParams(urlQueryString);
    for (const [key, value] of urlParams) {
      if (route.query[key] !== value) return false;
    }
  }

  return true;
}

const { footer } = menu;
const { copyright } = config.params;
const copyrightMd = markdownify(copyright);
</script>
