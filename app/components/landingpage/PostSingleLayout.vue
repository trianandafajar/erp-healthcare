<template>
  <section class="section">
    <div class="container">
      <div class="row">
        <article class="col-12 mx-auto text-center md:col-8">
          <img
            v-if="image"
            :src="image"
            height="500"
            width="1000"
            :alt="title"
            class="rounded-lg"
          />
          <h1 class="h2 mb-6 mt-6 text-left" v-html="titleMd"></h1>
          <div class="content mb-16 text-left">
            <MarkdownContent :content="content" />
          </div>
        </article>
      </div>
    </div>
  </section>
</template>

<script setup>
import { markdownify } from "~/utils/textConverter";

const props = defineProps({
  frontmatter: { type: Object, required: true },
  content: { type: String, default: "" },
});

let { description, title, image } = props.frontmatter;
description = description ? description : props.content.slice(0, 120);
const titleMd = computed(() => markdownify(title));

useSeoMeta({
  title: title,
  description: description,
});
</script>
