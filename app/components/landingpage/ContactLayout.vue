<template>
  <section class="section">
    <div class="container">
      <h1 class="text-center font-normal" v-html="titleMd"></h1>
      <div class="section row pb-0">
        <div class="col-12 md:col-6 lg:col-7">
          <form class="contact-form" method="POST" :action="contactFormAction">
            <div class="mb-3">
              <input class="form-input w-full rounded" name="name" type="text" placeholder="Name" required />
            </div>
            <div class="mb-3">
              <input class="form-input w-full rounded" name="email" type="email" placeholder="Your email" required />
            </div>
            <div class="mb-3">
              <input class="form-input w-full rounded" name="subject" type="text" placeholder="Subject" required />
            </div>
            <div class="mb-3">
              <textarea class="form-textarea w-full rounded-md" rows="7" placeholder="Your message" />
            </div>
            <button type="submit" class="btn btn-primary">Send Now</button>
          </form>
        </div>
        <div class="content col-12 md:col-6 lg:col-5">
          <h4 v-html="infoTitleMd"></h4>
          <p class="mt-4" v-html="infoDescMd"></p>
          <ul class="contact-list mt-5">
            <li v-for="(contact, index) in info?.contacts" :key="index">
              <strong class="text-dark" v-html="contactMd(contact)"></strong>
            </li>
          </ul>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
import config from "~/config/config.json";
import { markdownify } from "~/utils/textConverter";

const props = defineProps({
  data: { type: Object, required: true },
});

const { frontmatter } = props.data;
const { title, info } = frontmatter;
const { contact_form_action } = config.params;

const titleMd = computed(() => markdownify(title));
const infoTitleMd = computed(() => markdownify(info?.title));
const infoDescMd = computed(() => markdownify(info?.description));
const contactMd = (contact) => markdownify(contact);

const contactFormAction = contact_form_action;
</script>
