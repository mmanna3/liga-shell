import { expect, test } from '@playwright/test'
import { login, reseed } from './helpers'

test.describe('Login', () => {
  test.describe.configure({ mode: 'serial' })

  test.beforeAll(async () => {
    await reseed()
  })

  test('muestra el formulario de login', async ({ page }) => {
    await page.goto('/login')
    await expect(page.getByTestId('input-usuario')).toBeVisible()
    await expect(page.getByTestId('input-password')).toBeVisible()
    await expect(page.getByTestId('boton-ingresar')).toBeVisible()
  })

  test('falla con credenciales inválidas', async ({ page }) => {
    await page.goto('/login')
    await page.getByTestId('input-usuario').fill('admin')
    await page.getByTestId('input-password').fill('contraseña-incorrecta')
    await page.getByTestId('boton-ingresar').click()
    await expect(page).toHaveURL('/login')
  })

  test('ingresa correctamente con credenciales válidas', async ({ page }) => {
    await login(page)
    await expect(page).toHaveURL('/')
  })

  test('redirige a login si no está autenticado', async ({ page }) => {
    await page.goto('/clubs')
    await expect(page).toHaveURL('/login')
  })
})
