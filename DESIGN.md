# Design System Specification: High-End Editorial B2B

## 1. Overview & Creative North Star: "The Kinetic Architect"
This design system rejects the "SaaS-in-a-box" aesthetic in favor of a bespoke, high-end editorial experience. We define our Creative North Star as **The Kinetic Architect**. 

B2B platforms often feel static and heavy; this system aims to feel structural yet fluid. We move beyond rigid grids by embracing **intentional asymmetry** and **tonal depth**. By utilizing high-contrast typography scales and overlapping surface layers, we create a digital environment that feels curated, authoritative, and sophisticated. The interface should feel less like a database and more like a premium business journal—clean, spacious, and intellectually clear.

---

## 2. Colors & Surface Philosophy
The palette balances the deep, authoritative weight of Deep Indigo with the high-energy "Growth" signal of Vibrant Green.

### The "No-Line" Rule
**Standard 1px borders are strictly prohibited for sectioning.** To achieve a premium feel, boundaries must be defined solely through background color shifts or subtle tonal transitions. A `surface-container-low` section sitting on a `surface` background provides all the definition a professional user needs without the visual "noise" of a stroke.

### Surface Hierarchy & Nesting
Treat the UI as a series of physical layers—stacked sheets of frosted glass or fine architectural paper.
- **Base Layer:** `surface` (#0b1326)
- **Primary Containers:** `surface-container` (#171f33)
- **Elevated Content:** `surface-container-high` (#222a3d)
- **Deepest Recess:** `surface-container-lowest` (#060e20) for inset search bars or secondary navigation.

### The Glass & Gradient Rule
To prevent the dark mode from feeling "flat," use **Glassmorphism** for floating elements (Modals, Popovers). Apply `surface-variant` at 60% opacity with a `20px` backdrop-blur. 
*   **Signature Texture:** Main CTAs and Hero backgrounds should utilize a subtle linear gradient: `primary_container` (#1e2a78) transitioning to `primary` (#bcc3ff) at a 120-degree angle to provide a metallic, high-fidelity sheen.

---

## 3. Typography: Editorial Authority
We use **Inter** not as a utility font, but as a brand anchor. The hierarchy is designed to create a rhythmic flow across the page.

*   **Display (lg/md/sm):** Use for "Big Picture" moments. Tighten letter-spacing to `-0.02em` to create a dense, authoritative "headline" feel.
*   **Headline (lg/md/sm):** Use for section starts. These should stand alone with significant `16` (4rem) spacing above them to let the "Growth" narrative breathe.
*   **Title & Body:** Standardize `body-lg` for most prose. Clarity is king; never use a color lighter than `on_surface_variant` (#c6c5d3) for body text to ensure AA accessibility.
*   **Labels:** Use `label-md` in all-caps with `+0.05em` letter spacing for a technical, "data-rich" aesthetic.

---

## 4. Elevation & Depth: Tonal Layering
Traditional drop shadows are a fallback of the past. In this system, depth is achieved through the **Layering Principle**.

*   **Tonal Lift:** Place a `surface-container-highest` card on a `surface-container` background. The shift in hex value creates a "soft lift" that feels integrated into the architecture.
*   **Ambient Shadows:** If a floating effect is required (e.g., a primary dropdown), use a shadow with a `48px` blur and `4%` opacity. The shadow color must be a tinted version of the surface—use `#000000` only on the darkest layers.
*   **The "Ghost Border":** If accessibility requires a stroke, use `outline_variant` (#454651) at **15% opacity**. It should be felt, not seen.
*   **Glassmorphism:** Use backdrop blurs on `surface_bright` elements to allow the deep indigo backgrounds to bleed through, softening the edges of the UI.

---

## 5. Components & Layout Patterns

### Buttons
*   **Primary:** A gradient-filled container (`primary` to `primary_container`) with `on_primary_container` text. Use `ROUND_EIGHT` (0.5rem) corners.
*   **Secondary:** No background. Use a "Ghost Border" and `secondary` (#4ae176) text for a sharp, growth-oriented look.
*   **Tertiary:** Pure text with an underline that appears on hover, utilizing the `secondary` color.

### Input Fields
*   **Styling:** Background set to `surface_container_lowest`. No borders. A 2px bottom-accent of `primary` appears only on focus. 
*   **State:** Error states use `error` (#ffb4ab) with a subtle glow effect (bloom) rather than a heavy red box.

### Cards & Lists (The "No Divider" Rule)
Forbid the use of divider lines between list items. Instead:
1.  Use `8` (2rem) vertical whitespace.
2.  Or, use alternating subtle background shifts (`surface-container` vs `surface-container-low`).

### Data Visualization (Signature Component)
B2B requires data. Use `secondary` (#4ae176) for "Growth/Positive" metrics and `tertiary` (#ffb595) for "Warning/Neutral" metrics. All charts should exist on a `surface_container_high` background to make the colors pop.

---

## 6. Do’s and Don’ts

### Do:
*   **DO** use extreme white space. If you think there is enough room, add `1.5x` more.
*   **DO** overlap elements. Let a card sit 20px over a header background to create architectural depth.
*   **DO** use `secondary_fixed` (#6bff8f) for micro-interactions, like success checkmarks or tiny "Live" pips.

### Don’t:
*   **DON'T** use pure black (#000000) or pure white (#FFFFFF). Stick to the tonal range of the Indigo and Slate palette.
*   **DON'T** use 1px solid borders to separate the sidebar from the main content. Use a background shift from `surface` to `surface-container`.
*   **DON'T** use standard "drop shadows" on cards. Rely on the surface color hierarchy to indicate elevation.
*   **DON'T** crowd the navigation. A premium experience feels unhurried.