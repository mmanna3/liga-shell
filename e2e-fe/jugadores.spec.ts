import { expect, test } from '@playwright/test'
import { login, reseed } from './helpers'

test.describe('Jugadores', () => {
  test.describe.configure({ mode: 'serial' })

  test.beforeAll(async () => {
    await reseed()
  })

  test('muestra la lista de jugadores con datos', async ({ page }) => {
    await login(page)
    await page.goto('/jugadores')

    await expect(page.getByRole('cell', { name: 'Carlos' })).toBeVisible()
    await expect(page.getByRole('cell', { name: 'Rodríguez' })).toBeVisible()
    await expect(page.getByRole('cell', { name: 'Marcos' })).toBeVisible()
    await expect(page.getByRole('cell', { name: 'García' })).toBeVisible()
  })

  test('muestra jugadores pendientes', async ({ page }) => {
    await login(page)
    await page.goto('/jugadores')

    await expect(page.getByRole('cell', { name: 'Pendiente', exact: true })).toBeVisible()
  })
})
