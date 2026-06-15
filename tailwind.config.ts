import type { Config } from 'tailwindcss'

export default {
    corePlugins: {
        preflight: false,
    },

    content: [
        './app/layouts/landing.vue',
        './app/pages/landing/**/*.vue',
        './app/components/landing/**/*.vue',
    ],
} satisfies Config