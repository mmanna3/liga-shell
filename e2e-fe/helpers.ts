import type { Page } from '@playwright/test'

const BACKEND_URL = 'http://localhost:5072'

export async function login(page: Page) {
  await page.goto('/login')
  await page.getByTestId('input-usuario').fill('admin')
  await page.getByTestId('input-password').fill('admin123')
  await page.getByTestId('boton-ingresar').click()
  await page.waitForURL('/')
}

export async function reseed() {
  await fetch(`${BACKEND_URL}/api/e2e-fe/seed`, { method: 'POST' })
}
