# Design System Specification: High-End Editorial B2B

## 1. Overview & Creative North Star: "The Kinetic Architect"

This design system rejects the "SaaS-in-a-box" aesthetic in favor of a bespoke, high-end editorial experience. We define our Creative North Star as **The Kinetic Architect**.

B2B platforms often feel static and heavy; this system aims to feel structural yet fluid. We move beyond rigid grids by embracing **intentional asymmetry** and **tonal depth**. By utilizing high-contrast typography scales and overlapping surface layers, we create a digital environment that feels curated, authoritative, and sophisticated. The interface should feel less like a database and more like a premium business journal — clean, spacious, and intellectually clear.

---

## 2. Colors & Surface Philosophy

The palette balances the deep, authoritative weight of Deep Indigo with the high-energy "Growth" signal of Vibrant Green.

### CSS Custom Properties (defined in `apps/web/src/index.css`)

```css
:root {
  --surface: #0b1326;
  --surface-container: #171f33;
  --surface-container-high: #222a3d;
  --surface-container-lowest: #060e20;
  --primary: #bcc3ff;
  --primary-container: #1e2a78;
  --secondary: #4ae176;
  --tertiary: #ffb595;
  --on-surface-variant: #c6c5d3;
  --outline-variant: #454651;
  --error: #ffb4ab;
}
```

### The "No-Line" Rule

**Standard 1px borders are strictly prohibited for sectioning.** To achieve a premium feel, boundaries must be defined solely through background color shifts or subtle tonal transitions. A `surface-container` section sitting on a `surface` background provides all the definition a professional user needs without the visual "noise" of a stroke.

### Surface Hierarchy & Nesting

Treat the UI as a series of physical layers — stacked sheets of frosted glass or fine architectural paper.

| Layer | Token | Hex | Usage |
|-------|-------|-----|-------|
| Base | `--surface` | #0b1326 | Page background, app shell |
| Primary Container | `--surface-container` | #171f33 | Cards, sidebar, content panels |
| Elevated | `--surface-container-high` | #222a3d | Hover states, active cards, chart backgrounds |
| Deepest Recess | `--surface-container-lowest` | #060e20 | Inset search bars, input fields, secondary nav |

### The Glass & Gradient Rule

To prevent the dark mode from feeling "flat," use **Glassmorphism** for floating elements (Modals, Popovers).

```css
.glass {
  background: rgba(23, 31, 51, 0.6);
  backdrop-filter: blur(20px);
}
```

**Signature Texture:** Main CTAs and Hero backgrounds should utilize a subtle linear gradient: `--primary-container` (#1e2a78) transitioning to `--primary` (#bcc3ff) at a 120-degree angle to provide a metallic, high-fidelity sheen.

---

## 3. Typography: Editorial Authority

We use **Inter** as the primary UI font and **Instrument Serif** for editorial accents (hero headlines, marketing pages).

```css
font-family: 'Inter', system-ui, sans-serif;
```

### Hierarchy

| Scale | Usage | Notes |
|-------|-------|-------|
| Display (lg/md/sm) | "Big Picture" moments, hero headlines | Letter-spacing `-0.02em`, dense and authoritative |
| Headline (lg/md/sm) | Section starts | Significant spacing above (`4rem`) to let content breathe |
| Title & Body | Most prose uses `body-lg` | Never lighter than `--on-surface-variant` (#c6c5d3) for AA accessibility |
| Labels | Data labels, metadata | All-caps with `+0.05em` letter spacing for a technical aesthetic |

### Font Weights in Use
- 400 (Regular) — body text
- 500 (Medium) — labels, secondary headings
- 600 (Semibold) — card titles, nav items
- 700 (Bold) — section headings
- 800 (Extrabold) — display/hero text

---

## 4. Elevation & Depth: Tonal Layering

Traditional drop shadows are a fallback of the past. In this system, depth is achieved through the **Layering Principle**.

- **Tonal Lift:** Place a `surface-container-high` card on a `surface-container` background. The shift in hex value creates a "soft lift" that feels integrated into the architecture.
- **Ambient Shadows:** If a floating effect is required (e.g., a primary dropdown), use a shadow with a `48px` blur and `4%` opacity. The shadow color must be a tinted version of the surface — use `#000000` only on the darkest layers.
- **The "Ghost Border":** If accessibility requires a stroke, use `--outline-variant` (#454651) at **15% opacity**. It should be felt, not seen.
- **Glassmorphism:** Use the `.glass` class on floating elements to allow the deep indigo backgrounds to bleed through, softening the edges of the UI.

---

## 5. Components & Layout Patterns

### Buttons (implemented in `components/ui/button.tsx`)

| Variant | Style | Usage |
|---------|-------|-------|
| Primary | Gradient fill (`primary` to `primary-container`), `on-primary-container` text, `0.5rem` corners | Main actions |
| Secondary | No background, "Ghost Border", `--secondary` (#4ae176) text | Growth-oriented secondary actions |
| Tertiary | Pure text with underline on hover using `--secondary` | Inline links, minor actions |
| Destructive | `--error` tinted background | Delete, cancel operations |
| Ghost | Transparent with hover tonal shift | Toolbar actions, icon buttons |

### Input Fields (implemented in `components/ui/input.tsx`)

- Background: `--surface-container-lowest`
- No borders by default
- 2px bottom-accent of `--primary` on focus
- Error states use `--error` (#ffb4ab) with a subtle glow rather than a heavy red box
- Field errors shown via `components/ui/field-error.tsx`

### Cards & Lists (The "No Divider" Rule)

Forbid the use of divider lines between list items. Instead:
1. Use `2rem` vertical whitespace between items
2. Or use alternating subtle background shifts (`surface-container` vs `surface-container-lowest`)

Cards implemented in `components/ui/card.tsx` with tonal elevation variants.

### Data Visualization (Recharts)

- Use `--secondary` (#4ae176) for growth/positive metrics
- Use `--tertiary` (#ffb595) for neutral metrics
- Use `--primary` (#bcc3ff) for primary data series
- All charts must use `--surface-container-high` background
- Tooltips: dark theme (`surface-container-high` background with `on-surface` text)
- Implemented in dashboard, analytics, and targets pages

### Kanban Board (Deals Pipeline)

- Horizontal scrolling board with pipeline stages as columns
- Columns separated by tonal shifts (`surface-container`), not borders
- Cards use "Tonal Lift" to indicate interactivity
- Stage totals displayed in column headers
- Drag-and-drop for stage movement
- Multi-pipeline support with pipeline selector

### Dialog/Modal (implemented in `components/ui/dialog.tsx`)

- Uses Radix UI Dialog primitive
- Glassmorphism overlay (`.glass` class)
- Content panel uses `surface-container-high` background
- Checkout dialog for Midtrans Snap integration

### Tables (implemented in `components/ui/table.tsx`)

- No outer borders
- Row hover uses `surface-container-high`
- Responsive: horizontal scroll on mobile
- Paired with `components/pagination-controls.tsx`

### Navigation & Layout (implemented in `components/layout/`)

- Sidebar uses background shift from `surface` to `surface-container` (no border)
- Collapses to hamburger menu on screens < 1024px
- Scroll lock class (`flowraze-app-shell-scroll-lock`) for mobile nav overlay
- Company app routes under `/company/*`, admin routes under `/admin/*`

---

## 6. Page Structure

### Marketing Pages (public)
Landing, Solutions, Pricing, About, Privacy, Terms, Blog, Careers, Help, Resources — use `components/landing/` primitives (header, footer, section, eyebrow, button) with Instrument Serif for editorial headlines.

### Company App Pages (authenticated)
Dashboard, Leads, Deals, Campaigns, Activities, Team, Users, Settings, Subscription, Search, Targets, Analytics, Automations, Support — wrapped in `Layout` shell with sidebar navigation.

### Admin Pages (superadmin)
Dashboard, Companies, Company Detail, Billing, Users — same `Layout` shell with platform-level navigation.

---

## 7. Do's and Don'ts

### Do:
- **DO** use extreme white space. If you think there is enough room, add `1.5x` more.
- **DO** overlap elements. Let a card sit 20px over a header background to create architectural depth.
- **DO** use `--secondary` (#4ae176) for micro-interactions, like success checkmarks or tiny "Live" pips.
- **DO** use CSS custom properties for all color values — never hardcode hex in components.
- **DO** use the `.glass` class for floating/overlay elements.
- **DO** use Radix UI primitives for accessible interactive components.

### Don't:
- **DON'T** use pure black (#000000) or pure white (#FFFFFF). Stick to the tonal range of the Indigo and Slate palette.
- **DON'T** use 1px solid borders to separate the sidebar from the main content. Use a background shift from `surface` to `surface-container`.
- **DON'T** use standard "drop shadows" on cards. Rely on the surface color hierarchy to indicate elevation.
- **DON'T** crowd the navigation. A premium experience feels unhurried.
- **DON'T** ignore mobile constraints. Fixed sidebars must collapse into a hamburger menu on screens < 1024px.
- **DON'T** mix editorial whitespace with cluttered headers. Keep the global search and user profile minimalist.
- **DON'T** use light-mode tooltip defaults. All tooltips must match the dark theme.
- **DON'T** introduce new color values without adding them as CSS custom properties first.

---

## 8. Implemented Component Library

| Component | File | Notes |
|-----------|------|-------|
| Badge | `ui/badge.tsx` | Status indicators, tags |
| Button | `ui/button.tsx` | Multiple variants (primary, secondary, ghost, destructive) |
| Card | `ui/card.tsx` | Tonal elevation containers |
| Dialog | `ui/dialog.tsx` | Radix-based modal with glass overlay |
| Field Error | `ui/field-error.tsx` | Inline form validation messages |
| Input | `ui/input.tsx` | Text inputs with focus accent |
| Label | `ui/label.tsx` | Form labels |
| Select | `ui/select.tsx` | Radix-based dropdown select |
| Separator | `ui/separator.tsx` | Visual separator (use sparingly) |
| Table | `ui/table.tsx` | Data tables with responsive scroll |
| Textarea | `ui/textarea.tsx` | Multi-line text input |
| Activity Feed | `activity-feed.tsx` | Timeline of lead activities |
| Checkout Dialog | `checkout-dialog.tsx` | Midtrans Snap payment flow |
| Export Controls | `export-controls.tsx` | CSV/PDF export buttons with filters |
| Pagination Controls | `pagination-controls.tsx` | Page navigation for tables |
| SEO | `SEO.tsx` | Document head meta tags |

---

## 9. Accessibility Notes

- All body text uses minimum `--on-surface-variant` (#c6c5d3) on `--surface` (#0b1326) for AA contrast compliance
- Interactive components use Radix UI primitives for keyboard navigation and screen reader support
- Focus indicators use `--primary` accent (2px bottom border on inputs, ring on buttons)
- Mobile navigation is fully keyboard-accessible
- Form errors are associated with inputs via `field-error` component
- Color is never the sole indicator of state — always paired with text or icons
