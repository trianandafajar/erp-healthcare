<template>
  <footer class="section bg-theme-light pb-0">
    <div class="container">
      <div class="row">
        <div v-for="col in footer" :key="col.name" class="mb-12 sm:col-6 lg:col-3">
          <h2 class="h4">{{ col.name }}</h2>
          <ul class="mt-6">
            <li v-for="item in col.menu" :key="item.text" class="mb-1">
              <NuxtLink :to="item.url">{{ item.text }}</NuxtLink>
            </li>
          </ul>
        </div>
        <div class="md-12 sm:col-6 lg:col-3">
          <NuxtLink to="/" aria-label="Bigspring">
            <img
              :src="config.site.logo"
              :width="config.site.logo_width"
              :height="config.site.logo_height"
              alt=""
            />
          </NuxtLink>
          <p class="mt-3 mb-6" v-html="footerContentMd"></p>
          <Social :source="social" class="social-icons mb-8" />
        </div>
      </div>
      <div class="border-t border-border py-6">
        <p class="text-sm text-center" v-html="copyrightMd"></p>
      </div>
    </div>
  </footer>
</template>

<script setup>
import config from "~/config/config.json";
import menu from "~/config/menu.json";
import social from "~/config/social.json";
import { markdownify } from "~/utils/textConverter";

const { footer } = menu;
const { copyright, footer_content } = config.params;
const copyrightMd = markdownify(copyright);
const footerContentMd = markdownify(footer_content);
</script>
