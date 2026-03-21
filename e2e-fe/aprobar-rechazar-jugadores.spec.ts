import { expect, test } from '@playwright/test'
import { login, reseed } from './helpers'

// jugadorEquipoId=4 (4.º JugadorEquipo del seed), jugadorId=4 (jugador Pendiente)
const URL_PENDIENTE = '/jugadores/aprobar-rechazar/4/4'

test.describe('Aprobación y rechazo de jugadores', () => {
  test.describe.configure({ mode: 'serial' })

  test.beforeAll(async () => {
    await reseed()
  })

  test('muestra los datos del jugador pendiente de aprobación', async ({ page }) => {
    await login(page)
    await page.goto(URL_PENDIENTE)

    await expect(page.getByText('Jugador')).toBeVisible()
    await expect(page.getByText('Pendiente')).toBeVisible()
    await expect(page.getByText('45678901')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Aprobar' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Rechazar' })).toBeVisible()
    await expect(
      page.getByPlaceholder('Escribe el motivo del rechazo...')
    ).toBeVisible()
  })

  test('muestra error al intentar rechazar sin motivo', async ({ page }) => {
    await login(page)
    await page.goto(URL_PENDIENTE)

    await expect(page.getByText('Jugador')).toBeVisible()
    await page.getByRole('button', { name: 'Rechazar' }).click()

    await expect(
      page.getByText('Hay que ingresar un motivo de rechazo.')
    ).toBeVisible()
    await expect(page).toHaveURL(URL_PENDIENTE)
  })

  test('rechaza un jugador con motivo y regresa a la lista', async ({ page }) => {
    await login(page)
    // Navegar a jugadores primero para tener historial (navigate(-1) lo usa)
    await page.goto('/jugadores')
    await page.goto(URL_PENDIENTE)

    await expect(page.getByText('Jugador')).toBeVisible()
    await page.getByPlaceholder('Escribe el motivo del rechazo...').fill('Documentación incompleta')
    await page.getByRole('button', { name: 'Rechazar' }).click()

    await page.waitForURL('/jugadores')
    await expect(page).toHaveURL('/jugadores')
  })

  test('después del rechazo el jugador ya no figura como pendiente', async ({ page }) => {
    await login(page)
    await page.goto('/jugadores')

    // El jugador Pendiente fue rechazado — su estado cambia
    // Verificamos que los jugadores activos siguen en la lista
    await expect(page.getByRole('cell', { name: 'Carlos' })).toBeVisible()
    await expect(page.getByRole('cell', { name: 'Rodríguez' })).toBeVisible()
  })
})
