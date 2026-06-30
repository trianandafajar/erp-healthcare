<template>
  <div class="section row pb-0">
    <div class="col-12 pb-12 lg:pb-24">
      <div class="row items-center">
        <div class="col-12 md:col-6">
          <img
            v-if="posts[0].frontmatter.image"
            class="h-auto w-full rounded-lg"
            :src="posts[0].frontmatter.image"
            :alt="posts[0].frontmatter.title"
            width="540"
            height="227"
          />
        </div>
        <div class="col-12 md:col-6">
          <h2 class="h3 mb-2 mt-4">
            <NuxtLink
              :to="'/' + blogFolder + '/' + posts[0].slug"
              class="block hover:text-primary"
            >
              {{ posts[0].frontmatter.title }}
            </NuxtLink>
          </h2>
          <p class="text-text" v-html="firstPostSummary"></p>
          <NuxtLink
            class="btn btn-primary mt-4"
            :to="'/' + blogFolder + '/' + posts[0].slug"
          >
            Read More
          </NuxtLink>
        </div>
      </div>
    </div>
    <div
      v-for="(post, i) in posts.slice(1)"
      :key="'key-' + i"
      class="col-12 mb-8 sm:col-6 lg:col-4"
    >
      <img
        v-if="post.frontmatter.image"
        class="rounded-lg"
        :src="post.frontmatter.image"
        :alt="post.frontmatter.title"
        :width="i === 0 ? '925' : '445'"
        :height="i === 0 ? '475' : '230'"
      />
      <h2 class="h3 mb-2 mt-4">
        <NuxtLink
          :to="'/' + blogFolder + '/' + post.slug"
          class="block hover:text-primary"
        >
          {{ post.frontmatter.title }}
        </NuxtLink>
      </h2>
      <p class="text-text">{{ post.frontmatter.desc }}</p>
      <NuxtLink
        class="btn btn-primary mt-4"
        :to="'/' + blogFolder + '/' + post.slug"
      >
        Read More
      </NuxtLink>
    </div>
  </div>
</template>

<script setup>
import config from "~/config/config.json";
import { plainify } from "~/utils/textConverter";

const props = defineProps({
  posts: { type: Array, required: true },
});

const { blog_folder, summary_length } = config.settings;
const blogFolder = blog_folder;

const firstPostSummary = computed(() =>
  plainify(props.posts[0].content?.slice(0, Number(summary_length)))
);
</script>
