import type { Page } from '@playwright/test'

export async function login(page: Page) {
  await page.goto('/login')
  await page.getByTestId('input-usuario').fill('admin')
  await page.getByTestId('input-password').fill('admin123')
  await page.getByTestId('boton-ingresar').click()
  await page.waitForURL('/')
}
