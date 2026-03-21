import { expect, test } from '@playwright/test'
import { login, reseed } from './helpers'

test.describe('Delegados', () => {
  test.describe.configure({ mode: 'serial' })

  test.beforeAll(async () => {
    await reseed()
  })

  test('muestra la lista de delegados con datos', async ({ page }) => {
    await login(page)
    await page.goto('/delegados')

    await expect(page.getByText('roberto.mendez')).toBeVisible()
    await expect(page.getByText('ana.suarez')).toBeVisible()
    await expect(page.getByText('Roberto', { exact: true })).toBeVisible()
    await expect(page.getByText('Méndez', { exact: true })).toBeVisible()
    await expect(page.getByText('Registros: 3')).toBeVisible()
  })

  test('muestra delegado pendiente de aprobación', async ({ page }) => {
    await login(page)
    await page.goto('/delegados')

    await expect(page.getByText('Delegado', { exact: true })).toBeVisible()
    await expect(page.getByText('Pendiente', { exact: true }).first()).toBeVisible()
  })

  test('navega al detalle del delegado al hacer click en la fila', async ({ page }) => {
    await login(page)
    await page.goto('/delegados')

    await page.getByText('roberto.mendez').click()

    await page.waitForURL(/\/delegados\/detalle\/\d+/)
  })

  test('el detalle del delegado muestra sus datos', async ({ page }) => {
    await login(page)
    await page.goto('/delegados/detalle/1')

    await expect(page.getByText('Roberto Méndez')).toBeVisible()
    await expect(page.getByText('56789012')).toBeVisible()
    await expect(page.getByText('roberto.mendez')).toBeVisible()
    await expect(page.getByText('Club Defensores del Norte')).toBeVisible()
  })
})
