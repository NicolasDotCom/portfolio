# Portfolio — Nicolas Sanchez Trujillo

Portfolio personal bilingüe (ES / EN) de **Nicolas Sanchez Trujillo**, Full-Stack Developer.

- **Stack**: Astro 7 · Tailwind CSS 4 · TypeScript · GSAP · Lenis · OGL

---

## Stack técnico

| Capa | Tecnología |
|------|------------|
| Framework | Astro 7 con View Transitions (`ClientRouter`) |
| Estilos | Tailwind CSS 4 + design tokens en CSS custom properties |
| Lenguaje | TypeScript (modo `strict`) |
| Animaciones | GSAP + ScrollTrigger |
| Texto animado | SplitType |
| Smooth scroll | Lenis |
| WebGL (hero) | OGL |

---

## Estructura

```
src/
├── components/      # Secciones: Hero, About, Experience, Projects, Contact, Footer, etc.
│   └── shaders/     # HeroShader.astro (WebGL con OGL)
├── layouts/         # BaseLayout.astro (head, tema, ClientRouter)
├── pages/           # Rutas: /, /es/, /en/, 404
├── i18n/            # Diccionarios es.json / en.json + helpers
├── scripts/         # Lógica cliente (Lenis, GSAP, cursor, theme)
├── styles/          # global.css (tokens + Tailwind + componentes)
└── consts.ts        # SITE (metadata) + NAV_ITEMS
```

---

## Desarrollo local

```bash
npm install

# Dev server en background (recomendado en Laragon/Windows)
astro dev --background
astro dev status
astro dev logs

# Build de producción
npm run build

# Preview local
npm run preview

# Verificar tipos
astro check
```

Tras editar `src/` o `i18n/*.json`, el dev server recarga automáticamente.

---

## Internacionalización

- Default locale: `es`.
- Diccionarios en `src/i18n/{es,en}.json` (claves idénticas).
- Cambio de idioma vía `LangSwitcher` (esquina superior derecha).
- Detalle en [`docs/i18n.md`](./docs/i18n.md).

---

## Documentación

- [`AGENTS.md`](./AGENTS.md) — guía principal para agentes de IA.
- [`docs/architecture.md`](./docs/architecture.md) — flujo de render, View Transitions, ciclo de scripts.
- [`docs/animations.md`](./docs/animations.md) — Lenis, GSAP, WebGL, cursor, tema.
- [`docs/i18n.md`](./docs/i18n.md) — sistema de traducciones.
- [`docs/content.md`](./docs/content.md) — cómo actualizar experiencia, proyectos, contacto, CV.