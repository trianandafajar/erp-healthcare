<template>
  <iframe
    width="100%"
    height="400"
    :src="'https://www.youtube.com/embed/' + id"
    :title="title"
    frameborder="0"
    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
    allowfullscreen
  ></iframe>
</template>

<script setup>
defineProps({
  id: { type: String, required: true },
  title: { type: String, default: "YouTube Video" },
});
</script>
