<template>
  <Header />
  <HomeBanner :banner="banner" />
  <TrustBar />
  <LogoCloud />
  <FeaturesTabs />
  <IndustryCards />
  <Capabilities />
  <Testimonials />
  <Cta />
  <Footer />
</template>

<script setup>
import config from "~/config/config.json";
import Header from "~/components/landingpage/Header.vue"
import Footer from "~/components/landingpage/Footer.vue"
import HomeBanner from "~/components/landingpage/HomeBanner.vue"
import TrustBar from "~/components/landingpage/TrustBar.vue"
import LogoCloud from "~/components/landingpage/LogoCloud.vue"
import FeaturesTabs from "~/components/landingpage/FeaturesTabs.vue"
import IndustryCards from "~/components/landingpage/IndustryCards.vue"
import Capabilities from "~/components/landingpage/Capabilities.vue"
import Testimonials from "~/components/landingpage/Testimonials.vue"
import Cta from "~/components/landingpage/Cta.vue"

const { data: homePage } = await useAsyncData('home', () =>
  import('~/utils/contentParser').then(m => m.getListPage("content/_index.md"))
);

const { frontmatter } = homePage.value;
const { banner } = frontmatter;
const { title } = config.site;

useSeoMeta({
  title: title,
});

definePageMeta({
  layout: false,
  middleware: 'guest'
})
</script>
