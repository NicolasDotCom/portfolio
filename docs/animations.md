# Animaciones

Cómo está construido el sistema de animaciones del portfolio. Lee esto antes de tocar Lenis, GSAP, el shader o el cursor.

---

## 1. Pipeline de scripts

Inicializado al final de `<body>` en `src/layouts/BaseLayout.astro`, dentro de un listener de `astro:page-load` (se dispara en la carga inicial **y tras cada navegación SPA**):

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

El orden importa: **Lenis primero**, luego GSAP (porque ScrollTrigger necesita saber que el scroll es smooth), luego cursor. Todos los `init*` son **idempotentes**: se pueden llamar en cada navegación sin duplicar estado (Lenis y cursor tienen guardas a nivel de módulo; `initAnimations` mata los ScrollTriggers viejos antes de re-crearlos).

---

## 2. Lenis (smooth scroll)

`src/scripts/lenis.ts`:

```ts
import Lenis from 'lenis';

let lenis: Lenis | null = null;

export function initLenis(): Lenis {
  if (lenis) return lenis;

  lenis = new Lenis({
    duration: 1.2,
    easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    orientation: 'vertical',
    gestureOrientation: 'vertical',
    smoothWheel: true,
    touchMultiplier: 2,
  });

  function raf(time: number) {
    lenis!.raf(time);
    requestAnimationFrame(raf);
  }
  requestAnimationFrame(raf);

  return lenis;
}
```

Notas:
- `html.lenis { height: auto; }` está en `global.css` para evitar que Lenis rompa alturas.
- Lenis convive con `scroll-behavior: smooth` del CSS sin problemas.
- La guarda a nivel de módulo evita crear una segunda instancia (y un segundo loop `raf`) en cada navegación SPA.
- Si añades un nuevo comportamiento que dependa de scroll (p.ej. progress bar), **registra el plugin de ScrollTrigger con Lenis** o suscríbete a eventos de Lenis, no a `window.scroll`.

---

## 3. GSAP + ScrollTrigger

`src/scripts/gsap-animations.ts`:

```ts
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export function initAnimations(): void {
  ScrollTrigger.getAll().forEach((trigger) => trigger.kill());

  // 1. Reveal de secciones
  ...
  // 2. Magnetic buttons (guarda el.dataset.magneticBound)
  ...
  // 3. Project cards parallax
  ...
}
```

### Por qué se matan los ScrollTriggers al inicio

`initAnimations` se ejecuta en cada `astro:page-load`. Sin el `kill()`, los triggers de la página anterior se acumulan tras varias navegaciones SPA y apuntan a elementos ya desmontados. Matarlos antes de re-bindear garantiza que solo existen los triggers del DOM actual.

**Regla crítica**: `.reveal` tiene `opacity: 0` en CSS (`global.css`). Si `initAnimations` no corre tras una navegación, las secciones quedan invisibles. Por eso el init vive en `astro:page-load` y no como llamada única.

### Reglas al añadir animaciones GSAP

- Usar `gsap.fromTo` en lugar de `from` / `to` cuando el estado inicial es crítico (evita flash en navegaciones SPA).
- `ease: 'power3.out'` y `'power4.out'` son la convención. Mantener.
- `toggleActions: 'play none none reverse'` para reveals: aparecen al entrar, revierten al salir.
- `delay` acumulado por índice (`i * 0.1`) solo si el efecto lo justifica. Evita delays largos.

---

## 4. Cursor personalizado

`src/scripts/cursor.ts`:

- Lee posición del mouse (`mousemove`) y la persigue con interpolación (factor `0.2`).
- Aplica clase `.active` cuando el mouse está dentro de la ventana, `.hover` sobre `a, button, [role="button"]`.
- El elemento DOM `#cursor-dot` está en `BaseLayout.astro` y **se reemplaza en cada swap** (vive en el body). Por eso el script guarda la referencia en una variable de módulo que se actualiza en cada llamada a `initCursor()`, y el loop `raf` / listeners de `document` solo se crean una vez (guarda `loopStarted`).
- Los listeners hover se re-bindean en cada `astro:page-load` porque los `<a>`/`<button>` del DOM nuevo no los tienen.
- El estilo vive en `global.css` bajo `@media (pointer: fine)` (desktop con puntero fino).

Notas:
- Si se añaden nuevos elementos interactivos personalizados (no `a/button/[role=button]`), añadirlos a la lista en `cursor.ts` o usar `data-cursor="hover"` con un listener explícito.

---

## 5. Hero timeline (GSAP + SplitType)

La lógica vive en `src/scripts/hero.ts` (`initHero()`), llamada desde el `<script>` de `src/components/Hero.astro` en `astro:page-load`:

```ts
import gsap from 'gsap';
import SplitType from 'split-type';

let split: SplitType | null = null;
let timeline: gsap.core.Timeline | null = null;

export function initHero(): void {
  const nameEl = document.querySelector('.hero-name') as HTMLElement | null;
  if (!nameEl) return;

  timeline?.kill();
  split?.revert();

  split = new SplitType(nameEl, { types: 'chars' });

  const chars: Element[] =
    split.chars && split.chars.length > 0 ? Array.from(split.chars) : [nameEl];

  gsap.set('.hero-greeting', { opacity: 0, y: 30 });
  // ... resto de elementos a opacity 0 + y
  gsap.set(chars, { opacity: 0, y: 50 });

  timeline = gsap.timeline({ delay: 0.3 });

  timeline
    .to('.hero-greeting', { opacity: 1, y: 0, duration: 0.8, ease: 'power3.out' })
    .to(chars, { opacity: 1, y: 0, duration: 0.8, stagger: 0.03, ease: 'power4.out' }, '-=0.4')
    // ... resto con to()
}
```

Notas:
- Los elementos del hero empiezan con `opacity-0` en el HTML. El timeline los anima al cargar.
- **Patrón `gsap.set()` + `gsap.to()`** (en lugar de `fromTo` con `immediateRender`): `gsap.set` fija el estado inicial de forma síncrona antes de crear el timeline, y `gsap.to` anima desde el estado actual hasta el objetivo. Esto evita las complicaciones de `immediateRender` en tweens posicionados dentro de timelines (donde GSAP fuerza `immediateRender: false` por defecto, pudiendo dejar elementos en estado incorrecto).
- `split.chars` envuelve cada carácter del nombre en un `<div class="char">`. Si por algún motivo SplitType no produce chars (caso edge), se hace fallback a animar `.hero-name` como bloque para que el nombre siempre sea visible.
- `timeline?.kill()` + `split?.revert()` hacen la función idempotente: se puede llamar en cada navegación sin acumular estado ni anidar wrappers.
- Si cambias el texto del nombre (en los diccionarios), no hace falta tocar el timeline.

---

## 6. WebGL Shader (Hero)

`src/components/shaders/HeroShader.astro` usa OGL:

- Geometría: `Triangle` que cubre la pantalla.
- Fragment: ruido simplex (`snoise`) en 3 capas, modulado por `uTime`, `uMouse` y `uTheme`.
- Colores: cambian según `uTheme` (0 = light, 1 = dark). El "accent" es `#FF5722`.
- `MutationObserver` en `<html>` actualiza `uTheme` al cambiar de tema.

### Cleanup crítico

```ts
document.addEventListener('astro:before-swap', () => {
  cancelAnimationFrame(animationId);
  observer.disconnect();
  window.removeEventListener('resize', onResize);
  document.removeEventListener('mousemove', onMouseMove);
}, { once: true });
```

Si tocas este archivo, **mantén el cleanup**. Sin él, el shader queda corriendo en background y el navegador se ralentiza al navegar. El listener `mousemove` vive en `document` (que persiste entre swaps): si no se remueve, se acumula uno por navegación.

### Cosas que se pueden tocar con seguridad

- Constantes de color (uniformes `lightBg`, `lightFg`, etc.).
- Tasa de animación (factor en `uTime * 0.2`).
- Intensidad del mouse glow (`mouseInfluence * 0.3`).
- `dpr` cap (actualmente `Math.min(window.devicePixelRatio, 2)`).

### Cosas que NO se deben tocar sin pensar

- La estructura de `snoise` — es ruido simplex estándar, romperlo causa pantallas en negro.
- El orden de las capas de ruido — está calibrado para que el efecto se vea suave.

---

## 7. Theming

Tokens en `src/styles/global.css` (`:root` y `.dark`). Aplicación:

- Script inline en `BaseLayout.astro` corre **antes del paint** (no convertirlo en módulo).
- `localStorage.theme` persiste la elección.
- Si no hay valor guardado, usa `prefers-color-scheme`.
- Listener en `astro:page-load` no necesario: el script se re-aplica en `astro:before-swap` y `astro:after-swap`.

El botón (`ThemeToggle.astro`) usa `import { toggleTheme } from '../scripts/theme'` y el patrón `dataset.bound` para no duplicar listeners tras navegaciones SPA.

---

## 8. Reduced motion

`global.css` neutraliza animaciones cuando `prefers-reduced-motion: reduce`:

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
```

GSAP y OGL **no** se desactivan automáticamente con esto. Si quieres respetar `prefers-reduced-motion` para JS:

```ts
const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
if (reduced) return; // skip initLenis / initShader / etc.
```

No está implementado todavía; añadirlo es una mejora pendiente.

---

## 9. Lista de chequeo al añadir una animación nueva

- [ ] ¿Respeta `prefers-reduced-motion`?
- [ ] ¿Usa tokens de diseño (`--accent`, etc.) en lugar de colores hardcoded?
- [ ] ¿Se re-bindea correctamente tras navegaciones SPA (`astro:page-load` o `dataset.bound`)?
- [ ] ¿Tiene cleanup en `astro:before-swap` si usa `requestAnimationFrame`, observers o listeners en `window`?
- [ ] ¿El estado inicial es coherente? (Usar `gsap.fromTo` si hay riesgo de flash.)