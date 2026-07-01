<template>
  <SectionFeatures v-if="content?.features?.length" :features="content.features" />
  <SectionFaq v-if="content?.faq?.length" :faq="content.faq" />
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
