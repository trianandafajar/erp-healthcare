declare const process: {
  env: {
    SUPABASE_URL?: string
    SUPABASE_KEY?: string
    SUPABASE_SERVICE_KEY?: string
  }
}

export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },

  app: {
    pageTransition: {
      name: 'fade',
      mode: 'out-in',
    },
  },

  css: [
    '@fontsource/public-sans/400.css',
    '@fontsource/public-sans/500.css',
    '@fontsource/public-sans/600.css',
    '@fontsource/public-sans/700.css',
    '@mdi/font/css/materialdesignicons.css',
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
  },

  modules: ['@pinia/nuxt', '@nuxtjs/tailwindcss'],

  runtimeConfig: {
    supabaseServiceKey: process.env.SUPABASE_SERVICE_KEY,
    public: {
      supabaseUrl: process.env.SUPABASE_URL,
      supabaseKey: process.env.SUPABASE_KEY,
    },
  },
})