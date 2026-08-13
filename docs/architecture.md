# Arquitectura

Documento de referencia para entender el flujo de renderizado, View Transitions y ciclo de vida de los scripts.

---

## 1. Renderizado

Astro genera **HTML estático** para cada ruta en `src/pages/`. No hay SSR runtime en producción.

| Ruta | Salida |
|------|--------|
| `/` | HTML que redirige a `/es/` (meta-refresh + script inline) |
| `/es/` | HTML ES estático |
| `/en/` | HTML EN estático |
| `/404` | HTML estático |

`/es/` y `/en/` comparten el mismo layout (`BaseLayout.astro`) y las mismas secciones, pero cada uno importa `getTranslations(Astro.url)` y resuelve el locale desde el primer segmento del path.

---

## 2. View Transitions (`ClientRouter`)

`<ClientRouter />` vive en `BaseLayout.astro:75`. Activa la navegación SPA entre `/es/` y `/en/` (y a `/404` si se diera).

### Eventos disponibles

| Evento | Cuándo se dispara |
|--------|-------------------|
| `astro:before-swap` | Antes de reemplazar el DOM |
| `astro:after-swap` | Después de reemplazar el DOM |
| `astro:page-load` | Cuando la página (inicial o tras navegación) está lista |

### Patrón para re-bindear listeners

Los scripts que mutan DOM deben re-bindearse tras cada navegación. Patrón actual (ver `ThemeToggle.astro`):

```ts
const setupToggle = () => {
  const toggle = document.getElementById('theme-toggle');
  if (toggle && !toggle.dataset.bound) {
    toggle.addEventListener('click', toggleTheme);
    toggle.dataset.bound = 'true';
  }
};
setupToggle();
document.addEventListener('astro:page-load', setupToggle);
```

Alternativa, usada por `HeroShader.astro` y `Hero.astro`:

```ts
document.addEventListener('astro:page-load', () => {
  // init logic
});
```

### Limpieza específica

`HeroShader.astro` cancela su `requestAnimationFrame`, desconecta el `MutationObserver` y elimina los listeners de `resize` (window) y `mousemove` (document) en `astro:before-swap` (con `{ once: true }`). Es la única animación con `requestAnimationFrame` propio; las demás (GSAP, cursor) se re-inicializan de forma idempotente en cada `astro:page-load`.

---

## 3. Ciclo de scripts

Orden de ejecución en `BaseLayout.astro`:

1. **Bloque inline en `<head>`** (`is:inline`, síncrono):
   - Lee `localStorage.theme` o detecta `prefers-color-scheme`.
   - Aplica la clase `.dark` a `<html>` antes del paint (evita FOUC).
   - Re-aplica en `astro:before-swap` y `astro:after-swap` para que persista entre navegaciones.

2. **`<ClientRouter />`** se inyecta en `<head>`.

3. **Cuerpo (`<body>`)**:
   - `<div id="cursor-dot">` (DOM estático; CSS `@media (pointer: fine)` lo muestra en desktop).
   - `<slot />` con el contenido de la página.

4. **Script final del body** (módulo, diferido por Astro):
   ```ts
   import { initLenis } from '../scripts/lenis';
   import { initAnimations } from '../scripts/gsap-animations';
   import { initCursor } from '../scripts/cursor';

   document.addEventListener('astro:page-load', () => {
     initLenis();
     initAnimations();
     initCursor();
   });
   ```
   El listener es deliberado: los scripts módulo de Astro se ejecutan **una sola vez**, así que los `init*` deben re-lanzarse en cada `astro:page-load` para que el DOM nuevo tras un swap reciba sus animaciones. Todos son idempotentes (ver `docs/animations.md`).

5. **Scripts de componentes** — Astro procesa los `<script>` de cada `.astro` y los bundlea. Se ejecutan en orden de aparición; los que listen `astro:page-load` se registran y disparan también tras cada navegación.

### Diagrama

```
HTML estático
   ↓
<head> inline: theme init → evita FOUC
   ↓
ClientRouter activo
   ↓
<body> markup + cursor-dot
   ↓
Scripts módulo:
  initLenis       → smooth scroll
  initAnimations  → ScrollTrigger + reveal + magnetic
  initCursor      → cursor-dot follow
  initShader      → WebGL (en Hero)
  Hero timeline   → SplitType + GSAP
   ↓
astro:page-load se re-dispara tras cada navegación SPA
```

---

## 4. Theming

- Token-driven: `:root` (light) + `.dark` (dark) en `src/styles/global.css`.
- Persistencia: `localStorage.theme`.
- Detección inicial: `window.matchMedia('(prefers-color-scheme: dark)')`.
- Script en `BaseLayout.astro` se ejecuta **inline** (no módulo) para que corra antes del primer paint.
- `MutationObserver` en `HeroShader.astro` actualiza el uniform `uTheme` del shader en cada cambio de clase en `<html>`.

No mover este script al final del body ni convertirlo en módulo. Convertirlo en módulo diferido introduce el flash de tema incorrecto en la primera carga.

---

## 5. Routing e i18n

El routing por idioma es **100% manual (file-based)**: `src/pages/es/index.astro` y `src/pages/en/index.astro`. **No hay bloque `i18n` en `astro.config.mjs`**: se eliminó porque su middleware interceptaba `/es/` (prefixDefaultLocale: false manda el default a `/`) y rompía la ruta con 404.

`/` redirige a `/es/` vía meta-refresh en `src/pages/index.astro`. Si en el futuro se migra a un hosting con soporte de redirects nativos (Cloudflare Pages, Netlify, Vercel), ese archivo puede eliminarse y configurar el redirect allí.

`getLocaleFromUrl(url)` parsea el primer segmento del path; `getRelativeUrl(url, targetLocale)` construye la URL equivalente en el otro idioma (ver `src/i18n/index.ts`).

---

## 6. SEO y meta tags

`BaseLayout.astro` genera:
- `<title>` + `<meta name="description">` (con fallback a `t.site.*`).
- Open Graph (`og:type`, `og:url`, `og:title`, `og:description`, `og:image`).
- Twitter Card (`summary_large_image`).
- `<link rel="canonical">` apuntando a `Astro.site` + path actual.
- `lang={locale}` en `<html>`.

La imagen OG por defecto es `/og-image.png` (no existe aún en `public/`; placeholder). Si se necesita, añadir `public/og-image.png` y, opcionalmente, variantes por idioma.

---

## 7. Configuración destacada

`astro.config.mjs`:
```js
export default defineConfig({
  site: '<dominio-de-producción>',
  vite: { plugins: [tailwindcss()] },
});
```

`site` es **obligatorio** para que `<ClientRouter />` resuelva URLs absolutas correctamente en View Transitions. El valor concreto lo define el usuario cuando se decida el hosting. No hay bloque `i18n` (ver §5).

`tsconfig.json` extiende `astro/tsconfigs/strict`. Tipos generados por Astro viven en `.astro/types.d.ts` (excluido de git).

`package.json` scripts: `dev`, `build`, `preview`, `astro`. Node >= 22.12.0.