import { test, expect } from '@playwright/test'

// seed_e2e.sql enables the token below and sets opening hours every day.
const TOKEN = 'e2e-booking'

function nextMonday(): { date: Date; day: number } {
    const now = new Date()
    const diff = (1 - now.getDay() + 7) % 7
    const target = new Date(now.getFullYear(), now.getMonth(), now.getDate() + (diff === 0 ? 7 : diff))
    return { date: target, day: target.getDate() }
}

test.describe('public booking wizard', () => {
    test('books an appointment end-to-end', async ({ page }) => {
        await page.goto(`/public-booking/${TOKEN}`)

        // Config page loads (tenant name shown in header)
        await expect(page.getByText('Demo Clinic').first()).toBeVisible({ timeout: 15_000 })
        await expect(page.getByRole('heading', { name: 'Select Date' })).toBeVisible()

        // Step 1: pick next Monday (seed has a schedule for Andi on Mondays)
        const { date: target, day } = nextMonday()
        const now = new Date()
        if (target.getMonth() !== now.getMonth() || target.getFullYear() !== now.getFullYear()) {
            await page.locator('button:has(.mdi-chevron-right)').click()
        }
        await page.getByRole('button', { name: String(day), exact: true }).click()
        await page.getByRole('button', { name: 'Continue' }).click()

        // Step 2: pick a doctor + time slot
        await expect(page.getByRole('heading', { name: 'Select Doctor & Time' })).toBeVisible()
        await expect(page.locator('.v-chip').first()).toBeVisible({ timeout: 15_000 })
        await page.locator('.v-chip').first().click()
        await page.getByRole('button', { name: 'Continue' }).click()

        // Step 3: patient details
        await expect(page.getByRole('heading', { name: 'Your Details' })).toBeVisible()
        await page.getByLabel('Full Name *').fill('E2E Tester')
        await page.getByLabel('Email *').fill(`e2e-${Date.now()}@demo.local`)
        await page.getByRole('button', { name: 'Continue' }).click()

        // Step 4: confirm
        await expect(page.getByRole('heading', { name: 'Confirm Your Booking' })).toBeVisible()
        await page.getByRole('button', { name: 'Confirm Booking' }).click()

        await expect(page.getByText('Booking Confirmed')).toBeVisible({ timeout: 15_000 })
    })

    test('shows unavailable state for an unknown token', async ({ page }) => {
        await page.goto('/public-booking/does-not-exist')
        await expect(page.getByRole('heading', { name: 'Booking Unavailable' })).toBeVisible({ timeout: 15_000 })
    })
})
