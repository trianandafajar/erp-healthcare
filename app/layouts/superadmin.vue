<script setup lang="ts">
import FooterPanel from '~/components/dashboard/footer/FooterPanel.vue'
import VerticalHeaderVue from '~/components/dashboard/vertical-header/VerticalHeader.vue'
import SuperAdminverticalsidebar from '~/components/dashboard/vertical-sidebar/SuperAdminverticalsidebar.vue'
</script>

<template>
    <v-locale-provider>
        <v-app :class="[]">
            <SuperAdminverticalsidebar />
            <VerticalHeaderVue />

            <v-main class="page-wrapper">
                <v-container fluid>
                    <div>
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
