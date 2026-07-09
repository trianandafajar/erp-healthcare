<script setup lang="ts">
import AppLogo from '~/components/AppLogo.vue'
import AuthRegister from '~/components/auth/AuthRegister.vue'

definePageMeta({
    layout: false,
    middleware: 'guest'
})

useSeoMeta({
    title: 'Register Page',
    ogTitle: 'My Amazing Site',
    description: 'This is my amazing site, let me tell you all about it.',
    ogDescription: 'This is my amazing site, let me tell you all about it.',
    ogImage: 'https://example.com/image.png',
    twitterCard: 'summary_large_image',
})
</script>

<template>
    <v-row class="bg-containerBg position-relative" no-gutters>
        <div class="blur-logo">
            <img src="/logo.png" alt="" style="width: 700px; height: auto; opacity: 0.4;" />
        </div>
        <v-col cols="12">
            <div class="pt-6 pl-6">
                <AppLogo />
            </div>
        </v-col>
        <!-- Register Part-->
        <v-col cols="12" lg="12" class="d-flex align-center">
            <v-container>
                <div class="d-flex align-center justify-center" style="min-height: calc(100vh - 148px)">
                    <v-row justify="center">
                        <v-col cols="12" md="12">
                            <v-card elevation="0" class="loginBox">
                                <v-card elevation="24">
                                    <v-card-text class="pa-sm-10 pa-6">
                                        <!-- Register Form-->
                                        <AuthRegister />
                                        <!-- Register Form-->
                                    </v-card-text>
                                </v-card>
                            </v-card>
                        </v-col>
                    </v-row>
                </div>
            </v-container>
        </v-col>
        <!-- Register Part-->
        <v-col cols="12">
            <v-container class="pt-0 pb-4">
                <AuthFooter />
            </v-container>
        </v-col>
    </v-row>
</template>

<style lang="scss">
.loginBox {
    max-width: 475px;
    margin: 0 auto;
}

.blur-logo {
    position: absolute;
    filter: blur(15px);
    top: 50%;
    left: 10%;
    transform: translate(-50%, -50%);
    pointer-events: none;
}
</style>
