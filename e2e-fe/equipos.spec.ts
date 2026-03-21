import { expect, test } from '@playwright/test'
import { login, reseed } from './helpers'

test.describe('Equipos', () => {
  test.describe.configure({ mode: 'serial' })

  test.beforeAll(async () => {
    await reseed()
  })

  test('muestra la lista de equipos con datos', async ({ page }) => {
    await login(page)
    await page.goto('/equipos')

    await expect(page.getByRole('cell', { name: 'Primera División' })).toBeVisible()
    await expect(page.getByRole('cell', { name: 'Reserva' })).toBeVisible()
    await expect(page.getByText('Registros: 2')).toBeVisible()
  })

  test('los equipos muestran el club al que pertenecen', async ({ page }) => {
    await login(page)
    await page.goto('/equipos')

    const filas = page.getByRole('row')
    await expect(filas.filter({ hasText: 'Primera División' }).getByText('Club Defensores del Norte')).toBeVisible()
  })

  test('navega al detalle del equipo al hacer click en la fila', async ({ page }) => {
    await login(page)
    await page.goto('/equipos')

    await page.getByRole('cell', { name: 'Primera División' }).click()

    await page.waitForURL(/\/equipos\/detalle\/\d+/)
    await expect(page.getByText('Primera División')).toBeVisible()
  })
})
