import { defineConfig, devices } from '@playwright/test'

// Local Supabase demo keys (constant for every fresh `supabase start`)
const LOCAL_SUPABASE_URL = 'http://127.0.0.1:54321'
const LOCAL_SUPABASE_ANON_KEY =
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni443kwl2k8LgXHkT6iK4hD-2n6XZJ1HZ8RwXJZLfX4VnY5wLJfJk2vZg'
const LOCAL_SUPABASE_SERVICE_KEY =
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJZDJvoHhK3YTR9r8lXMbpT6P7tL2U0'

export default defineConfig({
    testDir: './e2e',
    fullyParallel: true,
    forbidOnly: !!process.env.CI,
    retries: process.env.CI ? 2 : 0,
    workers: process.env.CI ? 1 : undefined,
    reporter: process.env.CI ? [['list'], ['html', { open: 'never' }]] : 'list',
    timeout: 60_000,

    use: {
        baseURL: 'http://127.0.0.1:3100',
        trace: 'retain-on-failure',
        screenshot: 'only-on-failure',
    },

    projects: [
        {
            name: 'chromium',
            use: { ...devices['Desktop Chrome'] },
        },
    ],

    // Spin up the Nuxt app pointed at the LOCAL Supabase stack (port 54321).
    // Local Supabase must already be running + seeded: `pnpm test:e2e:setup`.
    webServer: {
        command: 'pnpm dev:e2e',
        url: 'http://127.0.0.1:3100',
        reuseExistingServer: !process.env.CI,
        timeout: 300_000,
        env: {
            SUPABASE_URL: LOCAL_SUPABASE_URL,
            SUPABASE_KEY: LOCAL_SUPABASE_ANON_KEY,
            SUPABASE_SERVICE_KEY: LOCAL_SUPABASE_SERVICE_KEY,
            ENABLE_INSTANT_SUPERADMIN_LOGIN: 'false',
        },
    },
})
