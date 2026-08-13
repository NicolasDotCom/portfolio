# Contenido

Cómo actualizar la información que muestra el portfolio: identidad, experiencia, proyectos, contacto, CV.

---

## 1. Identidad global (no traducible)

`src/consts.ts` expone el objeto `SITE`. Campos actuales:

```ts
export const SITE = {
  title: 'Nicolas Sanchez Trujillo — Full-Stack Developer',
  description: 'Full-Stack Developer especializado en Laravel, Inertia.js y React. Construyo aplicaciones web modernas con código limpio y escalable.',
  author: 'Nicolas Sanchez Trujillo',
  email: 't.nicolassanchez@gmail.com',
  phone: '+57 3214272278',
  location: 'Pereira, Risaralda, Colombia',
  github: 'https://github.com/nicolasdotcom',
  linkedin: 'https://linkedin.com/in/nicolasdotcom',
  cv: '/cv-nicolas-sanchez.pdf',
};
```

Campos y dónde se consumen:

| Campo | Uso |
|-------|-----|
| `title`, `description` | Fallback de `<title>` y meta description (también traducible en `i18n/*.json`) |
| `author` | Disponible para meta tags (`article:author`, JSON-LD futuro, etc.) |
| `email`, `phone`, `location` | `Contact.astro` (mailto, tel, texto) |
| `github`, `linkedin` | `Contact.astro` (enlaces sociales) |
| `cv` | `Contact.astro` (botón de descarga) |

`NAV_ITEMS` controla el menú superior y los anchors. Reordenar con cuidado: deben coincidir con el orden de las secciones en `src/pages/es/index.astro` y `src/pages/en/index.astro`.

---

## 2. SEO por idioma

`src/i18n/es.json` y `src/i18n/en.json` tienen un bloque `site`:

```json
"site": {
  "title": "...",
  "description": "..."
}
```

Estos se usan como fallback en `<title>` y `<meta name="description">` (`BaseLayout.astro` líneas 16-17). Si una página concreta necesita un título distinto, pasar `title` y `description` como props a `BaseLayout`.

---

## 3. Hero

Bloque `hero` en cada diccionario:

| Clave | Uso |
|-------|-----|
| `greeting` | "Hola, soy" / "Hi, I'm" |
| `name` | Nombre mostrado (animado letra por letra con SplitType) |
| `title` | Rol principal |
| `description` | Párrafo bajo el rol |
| `cta` | Texto del botón "Ver proyectos" |
| `scroll` | Texto del indicador de scroll |

Editar en ambos JSON si cambian copy.

---

## 4. About

Bloque `about` y `skills`:

```json
"about": {
  "title": "Sobre mí",
  "text": "Desarrollador Full-Stack ..."
},
"skills": {
  "title": "Stack técnico",
  "frontend": "Front-End",
  "backend": "Back-End",
  "database": "Bases de datos",
  "tools": "Herramientas",
  "soft": "Habilidades blandas"
}
```

Las **skills concretas** (React, Laravel, MySQL, etc.) están hardcoded en `src/components/About.astro` como `skillCategories[].items`. Es la única excepción a "todo en JSON" del proyecto: si las skills cambian, editar el array en el `.astro`.

Para mover skills a JSON:
1. Crear `skills.items` (categoría → array de strings) en ambos diccionarios.
2. Reemplazar el array local por `t.skills.items` en `About.astro`.

---

## 5. Experiencia

Bloque `experience` en cada diccionario. Estructura:

```json
"experience": {
  "title": "Experiencia",
  "present": "Actualidad",
  "items": [
    {
      "role": "Desarrollador Full-Stack",
      "company": "Proyectos Autónomos",
      "period": "2023 — Actualidad",
      "description": "..."
    }
  ]
}
```

Para **añadir** un item: agregar objeto al final de `items`. `Experience.astro` los renderiza en orden con timeline alternado (par/impar). El más reciente va primero.

Para **cambiar el rango temporal**: actualizar `period`. La palabra "Actualidad" / "Present" viene de `experience.present`; en un futuro, si se quiere, se puede usar esa clave para mostrar "(Actualidad)" en lugar del valor literal dentro de `period`.

---

## 6. Proyectos

Bloque `projects` en cada diccionario:

```json
"projects": {
  "title": "Proyectos destacados",
  "viewProject": "Ver proyecto",
  "viewCode": "Ver código",
  "items": [
    {
      "title": "Sistema de Tickets de Soporte",
      "description": "...",
      "tags": ["Laravel 12", "Inertia.js", "React", "MySQL"]
    }
  ]
}
```

### Imágenes

`src/components/Projects.astro` tiene un mapa `projectImages`:

```ts
const projectImages: Record<string, string> = {
  'Sistema de Tickets de Soporte': 'https://picsum.photos/seed/tickets/800/600',
  'Support Ticket System': 'https://picsum.photos/seed/tickets/800/600',
  // ...
};
```

**Cada proyecto tiene dos claves** (ES y EN) que apuntan al mismo seed para mantener la coherencia visual.

Para imágenes propias:
1. Añadir el asset a `public/projects/<slug>.webp` (formato recomendado: WebP, 800x600, < 100 KB).
2. Mapear en `projectImages` (ambas traducciones).
3. Si dejas `picsum.photos` está bien, pero considera reemplazarlo cuando el portfolio esté más maduro.

### Links

`Projects.astro` mapea también `link` y `code`. Actualmente son `'#'` (placeholders). Para añadir URLs reales:

```ts
const projects = t.projects.items.map((project, i) => ({
  ...project,
  image: projectImages[project.title] || '...',
  link: project.link ?? '#',
  code: project.code ?? '#',
}));
```

Y añadir `link`/`code` opcionales a los items del JSON si se quiere mantener todo en diccionario.

---

## 7. Contacto

`Contact.astro` mezcla datos duros (de `SITE`) con traducciones (de `t.contact`).

Datos duros (`src/consts.ts`):
- `SITE.email` → `mailto:...`
- `SITE.phone` → `tel:...` (formato raw + display formateado)
- `SITE.location` → texto plano
- `SITE.cv` → botón de descarga
- `SITE.github`, `SITE.linkedin` → enlaces sociales

Traducibles (diccionario, bloque `contact`):

| Clave | Uso |
|-------|-----|
| `title` | Título de la sección |
| `description` | Párrafo introductorio |
| `emailLabel`, `phoneLabel`, `locationLabel` | Etiquetas mono uppercased |
| `downloadCV` | Texto del botón |
| `socials` | Subtítulo "Redes" |
| `form.name`, `form.email`, `form.message`, `form.send` | Labels y botón del form |

### Formulario

Actualmente es placeholder (`alert('Message sent! (placeholder)')`). Para conectar:

**Opción A — servicio externo (Formspree, Web3Forms, Resend, etc.)**:
1. Crear cuenta y obtener endpoint.
2. Reemplazar el handler en `Contact.astro` con un `fetch` al endpoint.
3. Mantener `e.preventDefault()` y dar feedback (éxito / error).

**Opción B — endpoint Astro (`src/pages/api/contact.ts`)**:
1. Crear API route con `output: 'server'` o `output: 'hybrid'` (requiere adaptador, p.ej. `@astrojs/node` o `@astrojs/cloudflare`). Esta opción obliga a usar un hosting con soporte de ejecución server-side (no funciona en hosting 100% estático como GitHub Pages).
2. **No recomendada** mientras el hosting siga siendo 100% estático.

---

## 8. CV

Archivo: `public/cv-nicolas-sanchez.pdf`. Mantener nombre estable (referenciado en `SITE.cv`).

Al actualizar el CV:
1. Reemplazar el archivo en `public/`. Mismo nombre, mismo formato.
2. Si quieres añadir control de caché, sirve con `Cache-Control` desde un endpoint o usa un nombre versionado (`cv-2026.pdf`).
3. Considera añadir `<meta name="cv-updated" content="YYYY-MM-DD">` si te interesa tracking.

---

## 9. Footer

Bloque `footer` en cada diccionario:

```json
"footer": {
  "madeWith": "Hecho con",
  "rights": "Todos los derechos reservados."
}
```

El año actual (`new Date().getFullYear()`) se calcula en `Footer.astro` y se concatena con `rights`. El icono "heart" está inline en el componente; no se traduce.

---

## 10. Checklist al actualizar contenido

- [ ] Cambios en copy → ambos `es.json` y `en.json`.
- [ ] Cambios en skills (no copy) → `About.astro`.
- [ ] Cambios en contacto, email, redes → `src/consts.ts`.
- [ ] Nuevo proyecto → añadir a `projects.items` (ambos JSON) + mapear imagen (opcional) en `Projects.astro`.
- [ ] Nuevo item de experiencia → añadir al final de `experience.items`.
- [ ] Si cambias el orden de secciones → también `NAV_ITEMS` y reordena los componentes en `src/pages/es/index.astro` y `src/pages/en/index.astro`.
- [ ] Tras cambios, ejecutar `astro check` y `npm run build` para validar.