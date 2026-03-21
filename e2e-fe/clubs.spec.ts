import { expect, test } from '@playwright/test'
import { login, reseed } from './helpers'

test.describe('Clubes', () => {
  test.describe.configure({ mode: 'serial' })

  test.beforeAll(async () => {
    await reseed()
  })

  test('muestra la lista de clubes con datos', async ({ page }) => {
    await login(page)
    await page.goto('/clubs')

    await expect(page.getByText('Club Defensores del Norte')).toBeVisible()
    await expect(page.getByText('Atlético San Lorenzo')).toBeVisible()
    await expect(page.getByText('Registros: 2')).toBeVisible()
  })

  test('navega al detalle del club al hacer click en la fila', async ({ page }) => {
    await login(page)
    await page.goto('/clubs')

    await page.getByText('Club Defensores del Norte').click()

    await page.waitForURL(/\/clubs\/detalle\/\d+/)
    await expect(page.getByText('Club Defensores del Norte')).toBeVisible()
  })

  test('navega a la pantalla de crear club', async ({ page }) => {
    await login(page)
    await page.goto('/clubs/crear')

    await expect(page.getByText('Crear Club')).toBeVisible()
    await expect(page.getByLabel('Nombre')).toBeVisible()
  })

  test('crea un club y regresa a la lista', async ({ page }) => {
    await login(page)
    await page.goto('/clubs/crear')

    await page.getByLabel('Nombre').fill('Club E2E Frontend')
    await page.getByLabel('Dirección').fill('Calle Falsa 123')
    await page.getByRole('button', { name: 'Guardar' }).click()

    await page.waitForURL('/clubs')
    await expect(page).toHaveURL('/clubs')
    await expect(page.getByText('Club E2E Frontend')).toBeVisible()
  })

  test('edita un club y guarda los cambios', async ({ page }) => {
    await login(page)
    await page.goto('/clubs/editar/1')

    // Esperar que el formulario cargue con los datos del club
    await expect(page.getByLabel('Nombre')).toHaveValue('Club Defensores del Norte')

    await page.getByLabel('Nombre').fill('Club Defensores Editado')
    await page.getByRole('button', { name: 'Guardar' }).click()

    await page.waitForURL(/\/clubs\/detalle\/1/)
    await expect(page.getByText('Club Defensores Editado')).toBeVisible()
  })
})
