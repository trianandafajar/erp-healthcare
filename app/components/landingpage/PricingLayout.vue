<template>
  <section class="section pb-0">
    <div class="container">
      <h1 class="text-center font-normal">{{ title }}</h1>
      <div class="section row -mt-10 justify-center md:mt-0">
        <div
          v-for="(plan, index) in plans"
          :key="plan.title + index"
          :class="['col-12 md:col-4', !plan.recommended ? 'lg:px-0' : 'col-recommended']"
        >
          <div class="card text-center">
            <h4>{{ plan.title }}</h4>
            <div class="mt-5">
              <span class="text-5xl text-dark">${{ plan.price }}</span>
              <span>/ {{ plan.type }}</span>
            </div>
            <h5 class="mt-2 font-normal text-text">{{ plan.subtitle }}</h5>
            <ul class="mt-5">
              <li v-for="(feature, fi) in plan.features" :key="fi" class="mb-[10px] leading-5">
                {{ feature }}
              </li>
            </ul>
            <NuxtLink
              :class="['btn mt-5', plan.recommended ? 'btn-primary' : 'btn-outline-primary']"
              :to="plan.button.link"
              :rel="plan.button.rel"
            >
              {{ plan.button.label }}
            </NuxtLink>
          </div>
        </div>
      </div>
    </div>
  </section>
  <Cta :cta="callToAction" />
</template>

<script setup>
const props = defineProps({
  data: { type: Object, required: true },
});

const { frontmatter } = props.data;
const { title, plans, call_to_action } = frontmatter;
const callToAction = call_to_action;
</script>
