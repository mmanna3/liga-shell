import { expect, test } from '@playwright/test'
import { login, reseed } from './helpers'

// arbitroId=1 (único árbitro del seed: pendiente, con el agrupador Liga Infantil)
const URL_PENDIENTE = '/arbitros/aprobar-rechazar/1'

test.describe('Aprobación y rechazo de árbitros', () => {
  test.describe.configure({ mode: 'serial' })

  test.beforeAll(async () => {
    await reseed()
  })

  test('muestra los datos del árbitro pendiente de aprobación', async ({ page }) => {
    await login(page)
    await page.goto(URL_PENDIENTE)

    await expect(page.getByRole('heading', { name: 'Ana Pendiente' })).toBeVisible()
    await expect(page.getByText('DNI 40111222')).toBeVisible()
    await expect(page.getByRole('checkbox', { name: 'Liga Infantil' })).toBeChecked()
    await expect(page.getByRole('button', { name: 'Aprobar' })).toBeEnabled()
    await expect(page.getByRole('button', { name: 'Rechazar' })).toBeVisible()
  })

  test('no deja aprobar sin al menos un agrupador', async ({ page }) => {
    await login(page)
    await page.goto(URL_PENDIENTE)

    await expect(page.getByRole('heading', { name: 'Ana Pendiente' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Aprobar' })).toBeEnabled()

    await page.getByRole('checkbox', { name: 'Liga Infantil' }).click()
    await expect(page.getByRole('button', { name: 'Aprobar' })).toBeDisabled()
    await expect(
      page.getByText('Elegí al menos un agrupador para poder aprobarlo')
    ).toBeVisible()

    await page.getByRole('checkbox', { name: 'Liga Infantil' }).click()
    await expect(page.getByRole('button', { name: 'Aprobar' })).toBeEnabled()
  })

  test('aprueba un árbitro y regresa a la lista de pendientes', async ({ page }) => {
    await login(page)
    await page.goto(URL_PENDIENTE)

    await expect(page.getByRole('heading', { name: 'Ana Pendiente' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Aprobar' })).toBeEnabled()

    const navPromise = page.waitForURL('/arbitros/pendientes')
    await page.getByRole('button', { name: 'Aprobar' }).click()
    await navPromise

    await expect(page).toHaveURL('/arbitros/pendientes')
    await expect(page.getByText('40111222')).not.toBeVisible()
  })

  test('el árbitro aprobado aparece en Datos de los árbitros', async ({ page }) => {
    await login(page)
    await page.goto('/arbitros/datos')

    await expect(page.getByRole('cell', { name: 'Ana' })).toBeVisible()
    await expect(page.getByRole('cell', { name: 'Pendiente' })).toBeVisible()
    await expect(page.getByRole('cell', { name: 'Liga Infantil' })).toBeVisible()
  })

  test('flujo de rechazo: reseed y rechazar el árbitro pendiente', async ({ page }) => {
    await reseed()
    await login(page)
    await page.goto(URL_PENDIENTE)

    await expect(page.getByRole('heading', { name: 'Ana Pendiente' })).toBeVisible()

    await page.getByRole('button', { name: 'Rechazar' }).click()
    await expect(page.getByText('¿Rechazar a este árbitro?')).toBeVisible()
    await expect(
      page.getByRole('button', { name: 'Rechazar definitivamente' })
    ).toBeVisible()

    const navPromise = page.waitForURL('/arbitros/pendientes')
    await page.getByRole('button', { name: 'Rechazar definitivamente' }).click()
    await navPromise

    await expect(page).toHaveURL('/arbitros/pendientes')
    await expect(page.getByText('40111222')).not.toBeVisible()
  })
})
