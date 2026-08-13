# AGENTS.md

Guía principal para agentes de IA que trabajen en este proyecto. Léela entera antes de hacer cambios.

Para contexto humano del proyecto consulta `README.md`. Detalles específicos por área en `docs/`.

---

## 1. Resumen del proyecto

Portfolio personal bilingüe (ES/EN) de **Nicolas Sanchez Trujillo**, Full-Stack Developer (Pereira, Colombia). Construido para mostrar experiencia, proyectos y datos de contacto.

- **Tipo**: sitio estático (SSG) con animaciones en cliente
- **Hosting / dominio**: pendientes de definir. No modificar `site` en `astro.config.mjs` ni configurar despliegue sin que el usuario lo indique.

El usuario es el dueño del portfolio y trabaja desde Laragon (Windows). Las decisiones de diseño y contenido las toma él; el agente debe proponer, no asumir.

---

## 2. Stack y versiones

| Capa | Tecnología | Versión |
|------|------------|---------|
| Framework | Astro | `^7.2.0` |
| Estilos | Tailwind CSS + `@tailwindcss/vite` | `^4.3.3` |
| Lenguaje | TypeScript (`astro/tsconfigs/strict`) | — |
| Animaciones | GSAP + ScrollTrigger | `^3.15.0` |
| Texto animado | SplitType | `^0.3.4` |
| Smooth scroll | Lenis | `^1.3.26` |
| WebGL | OGL | `^1.0.11` |
| Node | >= 22.12.0 | — |

**No añadir frameworks nuevos** (React, Vue, Svelte, MDX, CMS, etc.) sin pedirlo. El proyecto es Astro puro con vistas `.astro` + scripts `.ts` en cliente. **MDX ya fue retirado** del proyecto; los proyectos viven como datos dentro de los diccionarios i18n.

---

## 3. Estructura de carpetas

```
src/
├── components/        # Secciones y piezas de UI (.astro)
│   ├── Hero.astro
│   ├── About.astro
│   ├── Experience.astro
│   ├── Projects.astro + ProjectCard.astro
│   ├── Contact.astro
│   ├── Header.astro
│   ├── Footer.astro
│   ├── LangSwitcher.astro
│   ├── ThemeToggle.astro
│   └── shaders/       # HeroShader.astro (WebGL con OGL)
├── layouts/
│   └── BaseLayout.astro  # <html>, <head>, ClientRouter, init tema
├── pages/             # Rutas (file-based)
│   ├── index.astro    # Redirect a /es/ (meta-refresh)
│   ├── 404.astro
│   ├── es/index.astro
│   └── en/index.astro
├── i18n/              # Diccionarios + helpers
│   ├── es.json
│   ├── en.json
│   └── index.ts
├── scripts/           # Lógica cliente (Lenis, GSAP, cursor, theme)
├── styles/
│   └── global.css     # Tokens de diseño + utilidades + Tailwind
└── consts.ts          # SITE (metadata) + NAV_ITEMS
public/
├── cv-nicolas-sanchez.pdf
├── favicon.svg, favicon.ico
└── fonts/             # (vacío, las fuentes vienen de Google Fonts)
.github/workflows/
└── (vacío por ahora; se añadirá cuando se decida el hosting)
```

Convenciones:
- `src/pages/<locale>/index.astro` por idioma. Para añadir otro idioma, duplica la carpeta.
- Cada componente de sección es **autocontenido** e importa su propio `t` desde `i18n`.
- Los `<script>` en `.astro` son módulos por defecto; importan dependencias con `import` normal.
- **No** existe `src/content/` (no usar Astro Content Collections; los proyectos son items dentro de `i18n/*.json`).

---

## 4. Sistema de internacionalización

Default locale: `es`. Locales soportados: `es`, `en`. Routing **manual (file-based)**: no hay bloque `i18n` en `astro.config.mjs` (su middleware 404eaba `/es/`).

- Diccionarios: `src/i18n/{es,en}.json`. Mantener **mismas claves** en ambos archivos.
- Helpers: `src/i18n/index.ts` exporta `getTranslations(locale)`, `getLocaleFromUrl(url)`, `getRelativeUrl(url, targetLocale)`.
- Patrón en componentes:
  ```ts
  const locale = getLocaleFromUrl(Astro.url);
  const t = getTranslations(locale);
  ```
- `LangSwitcher.astro` muestra `ES | EN` y usa `getRelativeUrl` para mantener la ruta actual.
- `src/pages/index.astro` redirige a `/es/` con meta-refresh (solución provisional hasta que el hosting ofrezca redirects nativos).

**Reglas**:
- Cualquier texto visible para el usuario va en `es.json` y `en.json`. No hardcodear strings en los `.astro`.
- Si añades un campo nuevo, edita **ambos** diccionarios antes de probar.
- Ver guía completa en `docs/i18n.md`.

---

## 5. Estilos y design tokens

`src/styles/global.css` define tokens en CSS custom properties bajo `:root` (light) y `.dark` (dark). **Todas** las decisiones de color, espaciado y bordes de componentes deben pasar por estas variables.

| Token | Light | Dark |
|-------|-------|------|
| `--bg` | `#FAFAFA` | `#0A0A0A` |
| `--bg-subtle` | `#F0F0F0` | `#141414` |
| `--fg` | `#0A0A0A` | `#FAFAFA` |
| `--muted` | `#6B6B6B` | `#A0A0A0` |
| `--border` | `#E5E5E5` | `#1F1F1F` |
| `--accent` | `#FF5722` | `#FF7043` |
| `--accent-hover` | `#E64A19` | `#FF8A65` |
| `--accent-subtle` | `rgba(255,87,34,.1)` | `rgba(255,112,67,.1)` |

Tailwind v4 se importa con `@import "tailwindcss";` (un solo `@import`, no `@tailwind base/components/utilities`). Las clases se usan directamente en el markup; las personalizaciones y clases de componentes (`.magnetic-btn`, `.project-card`, `.reveal`, `.cursor-dot`, `.section`, `.mono`, `.accent`, `.text-gradient`) viven en `global.css`.

Respetar `prefers-reduced-motion`. El media query global ya neutraliza animaciones y transiciones; no eliminarlo.

---

## 6. Animaciones y comportamiento en cliente

Inicializadas en `BaseLayout.astro` dentro de un listener de `astro:page-load` (se dispara en la carga inicial y tras cada navegación SPA). Todos los `init*` son idempotentes:

1. **`initLenis()`** — smooth scroll global. Guarda a nivel de módulo: una sola instancia y un solo loop `raf`.
2. **`initAnimations()`** — mata todos los `ScrollTrigger` viejos (`ScrollTrigger.getAll().forEach(kill)`) y re-crea: reveals `.reveal`, parallax de `.project-card`, magnetic buttons (`.magnetic-btn`, con guarda `dataset.magneticBound`).
3. **`initCursor()`** — cursor-dot. Loop `raf` y listeners de `document` se crean una vez; el hover se re-bindea en cada navegación porque el DOM es nuevo.
4. **`initHero()`** — timeline del hero en `src/scripts/hero.ts`. Mata el timeline anterior y revierte el `SplitType` previo antes de re-animar; usa el patrón `gsap.set()` + `gsap.to()` para evitar problemas con `immediateRender` en timelines.
5. **`initShader()`** — vive en `HeroShader.astro`, se monta en `astro:page-load`. WebGL shader reactivo al mouse y al tema (uniform `uTheme`). Cleanup completo en `astro:before-swap` (incluye `mousemove`).
6. **`toggleTheme()`** — botón en `ThemeToggle.astro`. El script de tema en `BaseLayout.astro` (inline) corre **antes del paint** para evitar flash; se re-aplica en `astro:before-swap` y `astro:after-swap` para persistir entre navegaciones client-side.

**Importante**:
- Usar `astro:page-load` para listeners (no `DOMContentLoaded`), porque hay View Transitions (`<ClientRouter />`).
- Los scripts módulo de Astro se ejecutan una sola vez; todo lo que toque DOM debe re-lanzarse en `astro:page-load` de forma idempotente.
- `.reveal` tiene `opacity: 0` en CSS: si GSAP no corre tras una navegación, las secciones quedan invisibles.
- Cualquier listener que solo deba existir una vez: usar `dataset.bound` (ver patrón de `ThemeToggle.astro`).

Ver `docs/animations.md` para detalle (Lenis, GSAP, shader, cursor, theming, reduced motion).

---

## 7. Comandos de desarrollo

Sigue el protocolo de Laragon: **dev server en background**. Los flags `--background`, `stop`, `status`, `logs` son comandos reales de la CLI de Astro 7.

```bash
# Instalar deps
npm install

# Levantar dev server (background)
astro dev --background

# Inspeccionar
astro dev status
astro dev logs

# Detener
astro dev stop

# Build de producción
npm run build

# Preview local del build
npm run preview

# Verificación de tipos
astro check
```

Tras un cambio en `src/`, el dev server recarga automáticamente (HMR). Tras un cambio en `i18n/*.json`, también. Los `<script>` cliente se re-bundlean al guardar.

---

## 8. Convenciones de código

- **Sin comentarios** en el código a menos que el usuario los pida. Las aclaraciones viven en `docs/`.
- El código sigue el formato existente (no instalar Prettier sin pedirlo). El proyecto **no** tiene Prettier/ESLint configurado.
- TypeScript estricto (`astro/tsconfigs/strict`). Tipar props en componentes con `interface Props`.
- Imports relativos; no usar alias `@/` salvo que ya exista (no existe).
- No introducir dependencias nuevas sin confirmar con el usuario.
- Mantener consistencia con componentes existentes antes de "mejorar" nada.
- En español la UI y el código de cara al usuario; en inglés los identificadores, mensajes de commit (cuando aplique) y nombres de archivo.
- Los archivos no terminan en salto de línea en este repo (observa los existentes). Git advierte `LF will be replaced by CRLF` en Windows; es ruido, no error.

---

## 9. Tareas frecuentes (recetas)

### 9.1 Añadir un proyecto nuevo
1. Editar `src/i18n/es.json` y `src/i18n/en.json`: añadir objeto en `projects.items` con `title`, `description`, `tags`.
2. Si quieres imagen propia, añadir ruta en `public/projects/` y mapear en `src/components/Projects.astro` (`projectImages`) para **ambas** traducciones.
3. Si tiene URL externa, editar el `.map` en `Projects.astro` para incluir `link`/`code` reales (hoy son `'#'`).

### 9.2 Añadir un item de experiencia
1. Editar `experience.items` en ambos `*.json` con `role`, `company`, `period`, `description`.
2. `Experience.astro` los renderiza automáticamente con timeline alternado.

### 9.3 Cambiar el orden de las secciones
Editar `src/consts.ts` (`NAV_ITEMS`) y reordenar componentes en `src/pages/es/index.astro` y `src/pages/en/index.astro` (deben coincidir).

### 9.4 Añadir un nuevo idioma
1. Crear `src/i18n/<codigo>.json` copiando uno existente y traduciendo.
2. Registrar el locale en `src/i18n/index.ts` (tipo `Locale`, objeto `translations`, `getTranslations`, `getLocaleFromUrl`, `getRelativeUrl`).
3. Crear `src/pages/<codigo>/index.astro` con el mismo contenido que `es/index.astro` (incluyendo `<Experience />` entre About y Projects).
4. Añadir entrada en `LangSwitcher.astro`.

### 9.5 Añadir un script cliente propio
1. Crear `src/scripts/<nombre>.ts` exportando una función `initX()`.
2. Importar y llamar en `BaseLayout.astro` (dentro del `<script>` final del body).
3. Si toca DOM, esperar a `astro:page-load` o re-bindear con `dataset.bound`.

### 9.6 Modificar el shader del hero
Editar `src/components/shaders/HeroShader.astro`. El shader detecta tema vía `MutationObserver` sobre `document.documentElement.classList`. **Mantener el cleanup** en `astro:before-swap` (cancelar `requestAnimationFrame`, desconectar observer, remover listener de `resize`).

### 9.7 Conectar el formulario de contacto
El handler actual (`src/components/Contact.astro`) es un placeholder. Opciones:
- Servicio externo (Formspree, Web3Forms, Resend, etc.) — recomendado para mantener un hosting 100% estático.
- API route de Astro (`src/pages/api/contact.ts`) — requiere hosting con ejecución server-side, no funciona en hosting puramente estático.

Mantener `e.preventDefault()` y dar feedback al usuario.

### 9.8 Actualizar el CV
Reemplazar `public/cv-nicolas-sanchez.pdf`. Mantener el nombre estable porque está referenciado en `SITE.cv`.

### 9.9 Cambiar datos de contacto duro
Editar `src/consts.ts`: `email`, `phone`, `location`, `github`, `linkedin`, `cv`. `Contact.astro` los consume directamente.

---

## 10. Cosas que NO debes hacer

- No tocar `node_modules/`, `dist/`, `.astro/`. Ya están en `.gitignore`.
- No commitear sin que el usuario lo pida explícitamente.
- No cambiar la versión de Astro, Tailwind o las librerías de animación sin consultarlo (hay acoplamiento con `astro:page-load` y `ClientRouter`).
- No añadir frameworks JS (React, Vue, Svelte) ni integraciones (MDX, CMS, etc.). Es Astro + TS puro.
- No borrar el media query de `prefers-reduced-motion` ni la inicialización inline del tema (evita FOUC).
- No introducir un CMS, base de datos, ni servicios externos sin permiso.
- No decidir ni modificar hosting ni dominio sin que el usuario lo indique.
- No re-introducir `src/content/` ni MDX; los proyectos ya no viven ahí.
- No re-introducir enlaces a Twitter/X — fueron retirados del `Contact.astro`.
- No mover `public/cv-nicolas-sanchez.pdf` ni cambiar su ruta sin actualizar `SITE.cv`.

---

## 11. Documentación adicional

- `docs/architecture.md` — flujo de render, View Transitions, ciclo de vida de scripts.
- `docs/i18n.md` — detalle del sistema de traducciones.
- `docs/animations.md` — Lenis, GSAP, WebGL, cursor, tema.
- `docs/content.md` — cómo actualizar experiencia, proyectos, contacto, CV.

Cuando un cambio toque un área específica, lee el doc correspondiente antes de actuar.