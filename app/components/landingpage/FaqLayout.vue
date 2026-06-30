<template>
  <section class="section">
    <div class="container">
      <h1 class="text-center font-normal" v-html="titleMd"></h1>
      <div class="section row -mt-6">
        <div v-for="(faq, index) in faqs" :key="index" class="col-12 mt-6 md:col-6">
          <div class="p-12 shadow">
            <div class="faq-head relative">
              <h4 v-html="faqTitleMd(faq.title)"></h4>
            </div>
            <p class="faq-body mt-4" v-html="faqAnswerMd(faq.answer)"></p>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
import { markdownify } from "~/utils/textConverter";

const props = defineProps({
  data: { type: Object, required: true },
});

const { frontmatter } = props.data;
const { title, faqs } = frontmatter;

const titleMd = computed(() => markdownify(title));
const faqTitleMd = (t) => markdownify(t);
const faqAnswerMd = (a) => markdownify(a);
</script>
