<script setup lang="ts">
import FooterPanel from '~/components/dashboard/footer/FooterPanel.vue'
import VerticalHeaderVue from '~/components/dashboard/vertical-header/VerticalHeader.vue'
import NurseVerticalSidebar from '~/components/dashboard/vertical-sidebar/NurseVerticalSidebar.vue'
import { useTenantTheme } from '~/composables/useTenantTheme'
import UpgradeModal from '~/components/dashboard/UpgradeModal.vue'
useTenantTheme()
</script>

<template>
    <v-locale-provider>
        <v-app :class="[]">
            <NurseVerticalSidebar />
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
            <UpgradeModal />
        </v-app>
    </v-locale-provider>
</template>
