# BarOps

Esqueleto de una webapp para gestionar un bar o restaurante. Incluye Next.js 15
(App Router), TypeScript, Tailwind CSS 4, shadcn/ui con tema neutral, Prisma 7
con SQLite local, Auth.js v5, Vitest y Playwright.

## Arranque en Windows 10 / PowerShell

No necesitas Docker ni un servidor de base de datos. Node 20 y pnpm se instalan
dentro de `.tools` para este proyecto y no se incluyen en Git.

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\scripts\setup.ps1
.\barops-shell.cmd
```

El segundo comando abre una sesión de PowerShell con Node 20 y pnpm 10
en el PATH. Dentro de esa ventana:

```powershell
pnpm install
pnpm prisma db push
pnpm prisma generate
pnpm dev
```

Abre http://localhost:3000. `pnpm prisma db push` crea
`prisma/dev.db` con el esquema vacío. `setup.ps1` crea
`.env.local` con un `AUTH_SECRET` aleatorio. Ambos archivos son locales y
están excluidos de Git.

Si ya tienes Node 20.19 o posterior y pnpm 10 en el PATH, puedes prescindir de
`setup.ps1` y `barops-shell.cmd`. Crea `.env.local` a partir de
`.env.example` con un secreto aleatorio antes de ejecutar `pnpm dev`.
Prisma 7 y Vitest 4 son compatibles con Node 20; pnpm 11 requiere Node 22.

## Comprobaciones

```powershell
pnpm test
pnpm typecheck
pnpm lint
pnpm build
```

Para el test de navegador, deja `pnpm dev` abierto en una terminal. En otra
terminal de BarOps, instala Chromium una vez y ejecuta:

```powershell
pnpm exec playwright install chromium
pnpm test:e2e
```

Auth.js expone `/api/auth/*` con `providers: []`. Aún no hay inicio de
sesión ni modelos de dominio. Cuando se añada el primer modelo a
`prisma/schema.prisma`, ejecuta de nuevo `pnpm prisma db push` y
`pnpm prisma generate`.

## Estructura

- `app/`: portada y ruta API de Auth.js.
- `components/ui/`: componentes de shadcn/ui.
- `prisma/`: esquema y base SQLite local.
- `lib/prisma.ts`: cliente Prisma compartido con adaptador libSQL para el archivo local.
- `tests/unit/` y `tests/e2e/`: pruebas Vitest y Playwright.
