<template>
  <SectionFeatures v-if="content?.features?.length" :features="content.features" />
  <SectionFaq v-if="content?.faq?.items?.length" :faq="content.faq.items" :title="content.faq.title"
    :title-highlight="content.faq.titleHighlight" :title-suffix="content.faq.titleSuffix"
    :description="content.faq.description" :image="content.faq.image_url" />
  <SectionCta v-if="content?.cta?.title" :cta="content.cta" />
</template>

<script setup>
import SectionFeatures from '~/components/landingpage/industry-detail/SectionFeatures.vue'
import SectionFaq from '~/components/landingpage/industry-detail/SectionFaq.vue'
import SectionCta from '~/components/landingpage/industry-detail/SectionCta.vue'
defineProps({
  content: {
    type: Object,
    default: () => ({})
  }
})
</script>
