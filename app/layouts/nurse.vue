<script setup lang="ts">
import FooterPanel from '~/components/dashboard/footer/FooterPanel.vue'
import LoaderWrapper from '~/components/dashboard/LoaderWrapper.vue'
import VerticalHeaderVue from '~/components/dashboard/vertical-header/VerticalHeader.vue'
import NurseVerticalSidebar from '~/components/dashboard/vertical-sidebar/NurseVerticalSidebar.vue'
</script>

<template>
    <v-locale-provider>
        <v-app :class="[]">
            <NurseVerticalSidebar />
            <VerticalHeaderVue />

            <v-main class="page-wrapper">
                <v-container fluid>
                    <div>
                        <LoaderWrapper />
                        <slot />
                    </div>
                </v-container>
                <v-container fluid class="pt-0">
                    <div>
                        <FooterPanel />
                    </div>
                </v-container>
            </v-main>
        </v-app>
    </v-locale-provider>
</template>
