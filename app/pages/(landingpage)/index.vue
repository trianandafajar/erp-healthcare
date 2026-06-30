<template>
  <Header />
  <div>
    <HomeBanner :banner="banner" />
    <HomeFeatures :feature="feature" />
    <Services :services="services" />
    <Workflow :workflow="workflow" />
    <Cta :cta="callToAction" />
  </div>
  <Footer/>
</template>

<script setup>
import config from "~/config/config.json";
import Header from "~/components/landingpage/Header.vue"
import Footer from "~/components/landingpage/Footer.vue"
import HomeBanner from "~/components/landingpage/HomeBanner.vue"
import HomeFeatures from "~/components/landingpage/HomeFeatures.vue"
import Services from "~/components/landingpage/Services.vue"
import Workflow from "~/components/landingpage/Workflow.vue"
import Cta from "~/components/landingpage/Cta.vue"

const { data: homePage } = await useAsyncData('home', () =>
  import('~/utils/contentParser').then(m => m.getListPage("content/_index.md"))
);

const { frontmatter } = homePage.value;
const { banner, feature, services, workflow, call_to_action } = frontmatter;
const callToAction = call_to_action;
const { title } = config.site;

useSeoMeta({
  title: title,
});

definePageMeta({
  layout: 'blank',
})
</script>
