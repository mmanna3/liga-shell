# Refactor: acercar app-carnet-digital a los patrones de liga-fe

## Diferencias clave y propuesta de refactor

### 1. Formularios: react-hook-form + Zod

**Problema en app:** Cada form usa `useState` manual para cada campo + validación ad-hoc duplicada. `useFichajeStore` tiene 40+ campos de estado mezclados con lógica de negocio.

**Pattern de liga-fe:** `useForm({ resolver: zodResolver(esquema) })` con schemas Zod reutilizables.

**Propuesta:** Migrar los flujos de fichaje (el más crítico por su complejidad) a react-hook-form + Zod. El esquema de validación del DNI (que hoy aparece duplicado en múltiples archivos) quedaría en un solo lugar.

---

### 2. Stores Zustand: pequeños y enfocados

**Problema en app:** `useFichajeStore` (210 líneas) mezcla estado de UI, lógica de validación y llamadas a la API. Imposible de testear en partes.

**Pattern de liga-fe:** Stores pequeños (solo `useAuth` es global/persistido). La lógica de formulario vive en hooks locales con react-hook-form, no en stores globales.

**Propuesta:** `useFichajeStore` debería ser solo el estado del wizard (paso actual, datos del jugador ya validados). La validación va en el schema Zod. Las llamadas a API van en `useApiMutation`.

---

### 3. `useApiMutation` sin estado de loading

**Problema en app:** `useApiMutation` no expone `isPending`, por lo que cada componente mantiene su propio `const [cargando, setCargando]`. Además las notificaciones toast están comentadas esperando integrar Sonner.

**Pattern de liga-fe:** `useApiMutation` retorna el resultado completo de `useMutation` (incluido `isPending`) y muestra toasts automáticamente con `sonner`.

**Propuesta:** Completar `useApiMutation` en app para que esté a la par con liga-fe. Es un cambio chico en `lib/api/custom-hooks/use-api-mutation.tsx` con alto impacto.

---

### 4. Estado de modales: discriminated union

**Problema en app:** `mis-jugadores.tsx` maneja modales con múltiples booleanos + jugador seleccionado suelto → estado inconsistente posible.

**Pattern de liga-fe:** Un componente `ModalEliminacion` con modo `standalone` que recibe todo lo que necesita.

**Propuesta:**
```typescript
// En lugar de: modalActiva + jugadorSeleccionado + modalBulk separados
type EstadoModal =
  | { tipo: 'ninguno' }
  | { tipo: 'eliminar'; jugador: CarnetDigitalDTO }
  | { tipo: 'transferir'; jugador: CarnetDigitalDTO }
  | { tipo: 'acciones'; jugador: CarnetDigitalDTO }
  | { tipo: 'bulk' }

const [modal, setModal] = useState<EstadoModal>({ tipo: 'ninguno' })
```

---

### 5. Rutas type-safe

**Problema en app:** `router.push('/(auth)/login')` como strings hardcodeados en múltiples archivos.

**Pattern de liga-fe:** `ruteo/rutas.ts` con constantes tipadas.

**Propuesta:** Crear `lib/rutas.ts` con las rutas como constantes. Expo Router también soporta typed routes nativamente si se habilita `experiments.typedRoutes: true` en `app.config.ts`.

---

### 6. Componentes grandes: descomponer

**Problema en app:** `mis-jugadores.tsx` (327 líneas) maneja agrupación por categoría, acciones bulk, animaciones y modales.

**Pattern de liga-fe:** Cada pantalla tiene su subcarpeta `components/` y `hooks/` propios.

**Propuesta:**
```
(tabs)/mis-jugadores/
  mis-jugadores.tsx         # Orquestador (~80 líneas)
  components/
    lista-jugadores.tsx
    barra-acciones-bulk.tsx
  hooks/
    use-acciones-jugador.ts  # Lógica de mutaciones (eliminar, transferir)
```

---

### 7. Manejo de fechas

**Problema en app:** `String(d.getDate()).padStart(2, '0')` — formato manual, frágil.

**Pattern de liga-fe:** `date-fns` + utilidad `toDateOnly()` centralizada.

**Propuesta:** Agregar `date-fns` (ya está en liga-fe, misma API) y crear `lib/utils/fechas.ts`.

---

### 8. `ContenedorCargandoYError` / AsyncBoundary

**Problema en app:** Cada pantalla repite el patrón `if (isLoading) return <ActivityIndicator>; if (isError) return <Text>Error</Text>`.

**Pattern de liga-fe:** `<ContenedorCargandoYError>` envuelve la sección async.

**Propuesta:** Crear un `<CargandoYError>` equivalente para React Native con skeleton screens.

---

## Prioridad sugerida

| # | Cambio | Impacto | Esfuerzo |
|---|--------|---------|----------|
| 1 | Completar `useApiMutation` (loading + toasts) | Alto | Bajo |
| 2 | Estado de modales con discriminated union | Medio | Bajo |
| 3 | Rutas type-safe (`lib/rutas.ts`) | Medio | Bajo |
| 4 | Descomponer `mis-jugadores.tsx` | Alto | Medio |
| 5 | react-hook-form + Zod en formularios nuevos | Alto | Medio |
| 6 | Refactorizar `useFichajeStore` | Alto | Alto |
| 7 | `CargandoYError` component | Medio | Medio |
| 8 | `date-fns` + utils de fechas | Bajo | Bajo |
