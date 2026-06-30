<template>
  <nav
    v-if="totalPages > 1"
    class="mb-4 mt-10 flex justify-center space-x-[10px]"
    aria-label="Pagination"
  >
    <NuxtLink
      v-if="hasPrevPage"
      :to="indexPageLink ? (section ? '/' + section : '/') : (section ? '/' + section : '') + '/page/' + (currentPage - 1)"
      class="inline-flex w-[42px] justify-center rounded-md bg-theme-light px-2 py-2 text-dark hover:bg-primary hover:text-white"
    >
      <span class="sr-only">Previous</span>
      <svg class="mt-1 h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
        <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
      </svg>
    </NuxtLink>
    <span v-else class="inline-flex w-[42px] justify-center rounded-md bg-theme-light px-2 py-2 text-dark">
      <span class="sr-only">Previous</span>
      <svg class="mt-1 h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
        <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
      </svg>
    </span>
    <template v-for="(pagination, i) in pageList" :key="'page-' + i">
      <span
        v-if="pagination === currentPage"
        aria-current="page"
        class="rounded-md bg-primary px-4 py-2 text-white"
      >
        {{ pagination }}
      </span>
      <NuxtLink
        v-else
        :to="i === 0 ? (section ? '/' + section : '/') : (section ? '/' + section : '') + '/page/' + pagination"
        aria-current="page"
        class="rounded-md bg-theme-light px-4 py-2 text-dark hover:bg-primary hover:text-white"
      >
        {{ pagination }}
      </NuxtLink>
    </template>
    <NuxtLink
      v-if="hasNextPage"
      :to="(section ? '/' + section : '') + '/page/' + (currentPage + 1)"
      class="inline-flex w-[42px] justify-center rounded-md bg-theme-light px-2 py-2 text-dark hover:bg-primary hover:text-white"
    >
      <span class="sr-only">Next</span>
      <svg class="mt-1 h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
        <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
      </svg>
    </NuxtLink>
    <span v-else class="inline-flex w-[42px] justify-center rounded-md bg-theme-light px-2 py-2 text-dark">
      <span class="sr-only">Next</span>
      <svg class="mt-1 h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
        <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
      </svg>
    </span>
  </nav>
</template>

<script setup>
const props = defineProps({
  section: { type: String, required: true },
  currentPage: { type: Number, required: true },
  totalPages: { type: Number, required: true },
});

const indexPageLink = computed(() => props.currentPage === 2);
const hasPrevPage = computed(() => props.currentPage > 1);
const hasNextPage = computed(() => props.totalPages > props.currentPage);
const pageList = computed(() => {
  const list = [];
  for (let i = 1; i <= props.totalPages; i++) {
    list.push(i);
  }
  return list;
});
</script>
