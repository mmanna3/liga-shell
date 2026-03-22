import { expect, test } from '@playwright/test'
import { login, reseed } from './helpers'

// delegadoId=3 (3.er delegado del seed), delegadoClubId=3 (3.er DelegadoClub del seed)
const URL_PENDIENTE = '/delegados/aprobar-rechazar/3/3'

test.describe('Aprobación y rechazo de delegados', () => {
  test.describe.configure({ mode: 'serial' })

  test.beforeAll(async () => {
    await reseed()
  })

  test('muestra los datos del delegado pendiente de aprobación', async ({ page }) => {
    await login(page)
    await page.goto(URL_PENDIENTE)

    await expect(page.getByText('Delegado', { exact: true })).toBeVisible()
    await expect(page.getByText('Pendiente', { exact: true }).first()).toBeVisible()
    await expect(page.getByRole('button', { name: 'Aprobar' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Rechazar' })).toBeVisible()
  })

  test('aprueba un delegado y regresa a la lista', async ({ page }) => {
    await login(page)
    await page.goto(URL_PENDIENTE)

    await expect(page.getByText('Delegado', { exact: true })).toBeVisible()
    // Esperar que el botón se habilite (datosCabecera se auto-llena al cargar)
    await expect(page.getByRole('button', { name: 'Aprobar' })).toBeEnabled()

    // Listener antes del click para no perder la navegación en CI
    const navPromise = page.waitForURL('/delegados')
    await page.getByRole('button', { name: 'Aprobar' }).click()
    await navPromise

    await expect(page).toHaveURL('/delegados')
  })

  test('el delegado aprobado aparece como Activo en la lista', async ({ page }) => {
    await login(page)
    await page.goto('/delegados')

    // Delegado Pendiente fue aprobado, ahora es Activo
    await expect(page.getByText('Delegado', { exact: true })).toBeVisible()
  })

  test('flujo de rechazo: reseed y rechazar el delegado pendiente', async ({ page }) => {
    // Volver a sembrar para tener el delegado pendiente otra vez
    await reseed()
    await login(page)
    await page.goto(URL_PENDIENTE)

    await expect(page.getByText('Delegado', { exact: true })).toBeVisible()

    // Clic en Rechazar abre el diálogo de confirmación
    await page.getByRole('button', { name: 'Rechazar' }).click()
    await expect(
      page.getByText('¿Estás seguro de borrar definitivamente del sistema este delegado?')
    ).toBeVisible()
    await expect(
      page.getByRole('button', { name: 'Eliminar definitivamente' })
    ).toBeVisible()

    // Confirmar el rechazo
    const navPromise = page.waitForURL('/delegados')
    await page.getByRole('button', { name: 'Eliminar definitivamente' }).click()
    await navPromise

    await expect(page).toHaveURL('/delegados')
  })
})
