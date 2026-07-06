<script setup lang="ts">
import FooterPanel from '~/components/dashboard/footer/FooterPanel.vue';
import VerticalHeaderVue from '~/components/dashboard/vertical-header/VerticalHeader.vue';
import Patientverticalsidebar from '~/components/dashboard/vertical-sidebar/Patientverticalsidebar.vue';
import { useTenantTheme } from '~/composables/useTenantTheme'
useTenantTheme()
</script>

<template>
    <v-locale-provider>
        <v-app :class="[]">
            <Patientverticalsidebar />
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
