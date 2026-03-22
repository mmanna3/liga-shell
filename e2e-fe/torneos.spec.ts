import { expect, test } from '@playwright/test'
import { login, reseed } from './helpers'

test.describe('Torneos', () => {
  test.describe.configure({ mode: 'serial' })

  test.beforeAll(async () => {
    await reseed()
  })

  test('muestra mensaje vacío cuando no hay torneos', async ({ page }) => {
    await login(page)
    await page.goto('/torneos')

    await expect(
      page.getByText('No hay torneos para el año seleccionado')
    ).toBeVisible()
  })

  test('navega a la pantalla de crear torneo', async ({ page }) => {
    await login(page)
    await page.goto('/torneos/crear')

    await expect(page.getByText('Crear nuevo torneo')).toBeVisible()
  })

  test('flujo completo: crear agrupador y luego crear torneo', async ({ page }) => {
    await login(page)

    // Paso 1: crear el agrupador
    await page.goto('/torneos/agrupadores/crear')
    await expect(page.getByText('Crear agrupador de torneos')).toBeVisible()
    await page.getByPlaceholder('Nombre del agrupador').fill('Liga E2E')
    const navAgrupador = page.waitForURL('/torneos/agrupadores')
    await page.getByRole('button', { name: 'Guardar' }).click()
    await navAgrupador

    // Paso 2: crear el torneo con ese agrupador
    await page.goto('/torneos/crear')
    await expect(page.getByText('Crear nuevo torneo')).toBeVisible()

    // Nombre del torneo
    await page.getByPlaceholder('Ej: Torneo Anual 2026').fill('Torneo E2E 2026')

    // Seleccionar agrupador
    await page.getByRole('button', { name: 'Liga E2E' }).click()

    // Agregar categoría
    await page.getByRole('button', { name: 'Agregar' }).click()
    await page.getByPlaceholder('Ej: +40, Sub 15, Mayores').fill('Sub 12')
    await page.getByPlaceholder('Desde').fill('2010')
    await page.getByPlaceholder('Hasta').fill('2014')
    await page.getByRole('button', { name: 'Guardar' }).click()

    // Verificar que la categoría se agregó
    await expect(page.getByText('Sub 12')).toBeVisible()

    // Seleccionar formato de fase
    await page.getByRole('button', { name: 'Todos contra todos' }).click()

    // Crear el torneo
    const navTorneo = page.waitForURL('/torneos')
    await page.getByRole('button', { name: 'Crear torneo' }).click()
    await navTorneo
    await expect(page).toHaveURL('/torneos')
    await expect(page.getByText('Torneo E2E 2026')).toBeVisible()
  })

  test('navega al detalle del torneo desde la lista', async ({ page }) => {
    await login(page)
    await page.goto('/torneos')

    // El torneo creado en el test anterior sigue en la DB
    await expect(page.getByText('Torneo E2E 2026')).toBeVisible()
    await page.getByText('Torneo E2E 2026').click()

    await page.waitForURL(/\/torneos\/detalle\/\d+/)
    await expect(page.getByText('Torneo E2E 2026').first()).toBeVisible()
  })
})
