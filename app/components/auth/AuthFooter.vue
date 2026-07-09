<script setup lang="ts">
import { shallowRef } from 'vue'

const year = new Date().getFullYear()

const footerLink = shallowRef([
    { title: 'About us', to: '/legal?page=about' },
    { title: 'Privacy', to: '/legal?page=privacy' },
    { title: 'Terms', to: '/legal?page=terms' },
])
</script>

<template>
    <v-footer class="px-0 pt-2" color="containerbg" style="z-index: 201; position: relative">
        <v-row justify="center" no-gutters>
            <v-col cols="12" md="6" class="text-md-left text-center">
                <p class="text-subtitle-2 text-lightText mb-md-0 mb-4">
                    © {{ year }} This site is protected by
                    <NuxtLink to="/legal?page=privacy" class="text-primary">Privacy Policy</NuxtLink>. Distributed by
                    <NuxtLink to="/legal?page=about" class="text-primary">HealthData</NuxtLink>
                </p>
            </v-col>
            <v-col class="d-flex flex-md-row flex-column justify-md-end align-center" cols="12" md="6">
                <NuxtLink v-for="(item, i) in footerLink" :key="i" :to="item.to"
                    class="cursor-pointer mx-md-3 mx-2 mb-md-0 mb-2 text-subtitle-2 text-lightText">
                    {{ item.title }}
                </NuxtLink>
            </v-col>
        </v-row>
    </v-footer>
</template>