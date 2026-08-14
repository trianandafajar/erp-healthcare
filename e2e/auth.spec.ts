import { test, expect } from '@playwright/test'

const PASSWORD = 'Password123!'

test.describe('authentication', () => {
    test('logs in as admin and lands on the admin dashboard', async ({ page }) => {
        await page.goto('/login')
        await page.getByLabel('email address').fill('admin@demo.local')
        await page.getByLabel('password').fill(PASSWORD)
        await page.getByRole('button', { name: 'Login' }).click()

        await expect(page).toHaveURL(/\/demo-clinic\/dashboard$/, { timeout: 15_000 })
        await expect(page.getByText(/dashboard/i).first()).toBeVisible()
    })

    test('logs in as patient and lands on the patient dashboard', async ({ page }) => {
        await page.goto('/login')
        await page.getByLabel('email address').fill('patient.siti@demo.local')
        await page.getByLabel('password').fill(PASSWORD)
        await page.getByRole('button', { name: 'Login' }).click()

        await expect(page).toHaveURL(/\/demo-clinic\/patient\/dashboard$/, { timeout: 15_000 })
    })

    test('shows an error for wrong credentials', async ({ page }) => {
        await page.goto('/login')
        await page.getByLabel('email address').fill('admin@demo.local')
        await page.getByLabel('password').fill('wrong-password')
        await page.getByRole('button', { name: 'Login' }).click()

        await expect(page.locator('.v-alert')).toContainText(/invalid|login failed|password/i, {
            timeout: 15_000,
        })
        await expect(page).toHaveURL(/\/login$/)
    })
})
