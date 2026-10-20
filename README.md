# BarOps

Base del MVP para gestionar mesas, reservas, pedidos, pagos e inventario de un bar o restaurante. Usa Next.js 15, TypeScript, Tailwind CSS 4, shadcn/ui, Prisma 7 con SQLite local, Auth.js v5, Vitest y Playwright.

## Arranque en Windows 10 / PowerShell

No necesitas Docker ni un servidor de base de datos. El proyecto incluye un script que prepara Node 20 y pnpm 10 en `.tools` (carpeta local ignorada por Git):

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\scripts\setup.ps1
.\barops-shell.cmd
```

Si ya tienes Node 20.19 o posterior y pnpm 10 en el PATH, puedes usar tu instalación. Crea `.env.local` a partir de `.env.example` con un `AUTH_SECRET` aleatorio; `setup.ps1` lo hace por ti.

En la terminal con Node y pnpm:

```powershell
pnpm install
pnpm prisma migrate dev --name init
pnpm prisma db seed
pnpm dev
```

Abre http://localhost:3000. La migración crea `prisma/dev.db` y `pnpm prisma db seed` carga 5 mesas, 3 categorías, 8 productos, un administrador, un camarero, un usuario de cocina y el stock inicial. El seed se puede repetir sin duplicar esos datos. La migración `init` ya está incluida en el repositorio: al repetir el comando, Prisma indicará que la base está al día.

Para explorar los datos:

```powershell
pnpm prisma studio
```

Studio muestra en la terminal la URL local donde abre. La configuración usa una URL absoluta para Studio en Windows y la ruta local `file:./prisma/dev.db` para las migraciones. Node 20 necesita `better-sqlite3` para Studio; está incluido como dependencia de desarrollo.

## Modelo de datos

```text
User --< Reserva >-- Mesa
User --< Pedido >-- Mesa
Pedido --< LineaPedido >-- Producto >-- Categoria
Pedido --< Pago >-- User
Producto -- Inventario --< MovimientoStock >-- User
```

Las relaciones usan `ON DELETE RESTRICT`. `User`, `Mesa` y `Producto` tienen `deletedAt` para borrado lógico. Los importes se guardan como `BigInt` en centavos de ARS; al mostrar precios, conviértelos a moneda en la interfaz. El precio de cada línea de pedido queda guardado cuando se crea la línea, aunque luego cambie el precio del producto. La aplicación deberá validar capacidades, cantidades positivas, disponibilidad, transiciones de estado y saldos antes de escribir; el esquema no sustituye esas reglas de negocio.

## Comprobaciones

```powershell
pnpm prisma migrate status
pnpm typecheck
pnpm test
pnpm lint
pnpm build
```

Para el test de navegador, deja `pnpm dev` abierto en una terminal. En otra terminal de BarOps, instala Chromium una vez y ejecuta:

```powershell
pnpm exec playwright install chromium
pnpm test:e2e
```

## Estructura

- `app/`: portada y ruta API de Auth.js.
- `components/ui/`: componentes de shadcn/ui.
- `prisma/schema.prisma`: modelos y relaciones del MVP.
- `prisma/migrations/`: historial de cambios de la base de datos.
- `prisma/seed.ts`: datos de ejemplo.
- `prisma/dev.db`: archivo SQLite local, ignorado por Git.
- `lib/prisma.ts`: cliente Prisma compartido con adaptador libSQL.
- `tests/unit/` y `tests/e2e/`: pruebas Vitest y Playwright.

## Autenticación y permisos

La portada enlaza a `/login`. Auth.js Credentials comprueba el email y la contraseña en SQLite. Los hashes son Argon2id con sal aleatoria, 19 MiB, 2 iteraciones y paralelismo 1. Las contraseñas nuevas admiten entre 15 y 128 caracteres, espacios y Unicode; se rechazan las comunes o fáciles de adivinar. No hay reglas de composición ni caducidad periódica.

El seed crea o completa tres cuentas de prueba: `admin@barops.local`, `camarero@barops.local` y `cocina@barops.local`. Imprime una contraseña aleatoria una sola vez cuando asigna el hash; una ejecución posterior no cambia una contraseña existente. Conservá esas credenciales en un gestor de contraseñas para las pruebas. Los usuarios existentes sin hash o sin verificación no pueden ingresar; `deletedAt` deshabilita el acceso.

| Sección | Admin | Camarero | Cocina |
| --- | --- | --- | --- |
| Dashboard | Sí | Sí | Sí |
| Reservas | Sí | Sí | No |
| Comandas | Sí | Sí | Sí |
| TPV | Sí | Sí | No |
| Inventario | Sí | No | No |

Las páginas privadas validan la sesión y el rol en el servidor. El ejemplo `GET /api/reservas/:id` también valida propiedad: un camarero solo puede leer sus reservas; admin puede leer todas. Todas las rutas de datos futuras deben repetir la autorización en el servidor. Las sesiones duran 8 horas, se registran en SQLite y se comprueban por petición; logout y cambio de contraseña las revocan. Auth.js usa una cookie HttpOnly y SameSite=Lax; Secure se activa en producción con HTTPS.

### Recuperación por email

Configurá en `.env.local` `AUTH_URL`, `APP_URL`, `SMTP_HOST`, `SMTP_PORT`, `SMTP_FROM` y, si el servidor lo requiere, `SMTP_USER` y `SMTP_PASSWORD`. `APP_URL` debe usar HTTPS en producción. La solicitud siempre responde con el mismo mensaje para emails existentes e inexistentes. El enlace dura 30 minutos y usa un token aleatorio de un solo uso; SQLite guarda únicamente SHA-256 del token. El cambio de contraseña revoca las sesiones activas. Sin SMTP configurado, los correos no se pueden entregar.

Detrás de un proxy inverso que elimine cabeceras IP aportadas por clientes, configurá `TRUST_PROXY=true` para aplicar el límite por IP real. El límite por cuenta funciona siempre. Mantené persistentes la base SQLite y `AUTH_SECRET` entre reinicios. No uses las credenciales demo en producción.

### Pruebas de autenticación

```powershell
pnpm test
pnpm test:coverage
pnpm build
pnpm dev
# En otra terminal:
pnpm test:e2e
```

Vitest prepara `prisma/test-auth.db` como base aislada para pruebas unitarias, de integración y de componentes con React Testing Library. Playwright prueba el navegador contra `http://localhost:3000` y crea cuentas temporales que elimina al terminar.
