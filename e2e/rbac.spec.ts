import { test, expect } from '@playwright/test'

const PASSWORD = 'Password123!'

async function loginAsPatient(page: import('@playwright/test').Page) {
    await page.goto('/login')
    await page.getByLabel('email address').fill('patient.siti@demo.local')
    await page.getByLabel('password').fill(PASSWORD)
    await page.getByRole('button', { name: 'Login' }).click()
    await expect(page).toHaveURL(/\/demo-clinic\/patient\/dashboard$/, { timeout: 15_000 })
}

test.describe('role-based route protection', () => {
    test('patient is redirected away from the doctor dashboard', async ({ page }) => {
        await loginAsPatient(page)

        await page.goto('/demo-clinic/doctor/dashboard')
        await expect(page).toHaveURL(/\/demo-clinic\/patient\/dashboard$/, { timeout: 15_000 })
    })

    test('guest is redirected to /login when visiting a protected page', async ({ page }) => {
        await page.goto('/demo-clinic/doctor/dashboard')
        await expect(page).toHaveURL(/\/login(\?|$)/, { timeout: 15_000 })
    })
})
