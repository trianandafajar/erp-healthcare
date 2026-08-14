import { defineVitestConfig } from '@nuxt/test-utils/config'

export default defineVitestConfig({
    define: {
        'import.meta.client': 'true',
        'import.meta.server': 'false',
    },
    test: {
        environment: 'happy-dom',
        environmentOptions: {
            nuxt: {
                dotenv: {
                    fileName: '.env.test',
                },
            },
        },
    },
})
