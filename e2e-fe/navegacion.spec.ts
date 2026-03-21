import { expect, test } from '@playwright/test'
import { login, reseed } from './helpers'

test.describe('Navegación', () => {
  test.describe.configure({ mode: 'serial' })

  test.beforeAll(async () => {
    await reseed()
  })

  test('ruta protegida redirige a login si no hay sesión', async ({ page }) => {
    await page.goto('/clubs')
    await page.waitForURL('/login')
    await expect(page.getByTestId('input-usuario')).toBeVisible()
  })

  test('ruta raíz redirige a login si no hay sesión', async ({ page }) => {
    await page.goto('/')
    await page.waitForURL('/login')
  })

  test('menú lateral navega a cada sección', async ({ page }) => {
    await login(page)

    await page.getByTestId('nav-clubes').click()
    await expect(page).toHaveURL('/clubs')

    await page.getByTestId('nav-jugadores').click()
    await expect(page).toHaveURL('/jugadores')

    await page.getByTestId('nav-equipos').click()
    await expect(page).toHaveURL('/equipos')

    await page.getByTestId('nav-delegados').click()
    await expect(page).toHaveURL('/delegados')

    await page.getByTestId('nav-torneos').click()
    await expect(page).toHaveURL('/torneos')
  })

  test('el nombre de usuario se muestra en el menú lateral', async ({ page }) => {
    await login(page)
    await expect(page.getByTestId('menu-lateral')).toContainText('admin')
    await expect(page.getByTestId('menu-lateral')).toContainText('Administrador')
  })
})
