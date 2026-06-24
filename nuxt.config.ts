export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: {
    enabled: true,

    timeline: {
      enabled: true,
    },
  },

  css: [
    '@fontsource/public-sans/400.css',
    '@fontsource/public-sans/500.css',
    '@fontsource/public-sans/600.css',
    '@fontsource/public-sans/700.css',
    '@mdi/font/css/materialdesignicons.min.css',
    '~/assets/scss/style.scss',
    '~/assets/css/tailwind.css',
  ],

  build: {
    transpile: ['vuetify'],
  },

  vite: {
    ssr: {
      noExternal: ['vuetify'],
    },
    optimizeDeps: {
      include: ['vuetify'],
    },
  },

  modules: ['@pinia/nuxt', '@nuxtjs/tailwindcss'],

  runtimeConfig: {
    supabaseServiceKey: process.env.SUPABASE_SERVICE_KEY,
    public: {
      supabaseUrl: process.env.SUPABASE_URL,
      supabaseKey: process.env.SUPABASE_KEY,
    },
    resendApiKey: process.env.RESEND_API_KEY,
  },
})