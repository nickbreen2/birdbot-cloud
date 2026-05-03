# Theme Switcher — Design Spec
**Date:** 2026-05-03  
**Status:** Approved

---

## Overview

Add Light / Dark / System theme switching to the BirdBot.ai dashboard. A segmented pill toggle lives in the profile dropdown between "Manage Account" / "Account settings" and "Sign Out" on both desktop and mobile. Default theme is System. The light palette is Clean Slate (crisp white panels on cool gray background). Implementation uses `next-themes` for SSR-safe theme management.

---

## Section 1 — Theme System Architecture

**Package:** Add `next-themes@^0.4` to `birdbot-cloud/package.json`.

**Provider placement:** In `src/app/layout.tsx`, wrap the entire tree with:
```tsx
<ThemeProvider attribute="data-theme" defaultTheme="system" enableSystem>
```
`next-themes` writes `data-theme="light"` or `data-theme="dark"` to the `<html>` element. Move `suppressHydrationWarning` from `<body>` to `<html>` (next-themes requires it there to avoid mismatch on the attribute it injects).

**Variable architecture — two tiers:**

1. `--theme-*` raw vars: defined in `:root` (light defaults) and `[data-theme="dark"]` overrides in `globals.css`. These are the values that actually flip.
2. `--color-*` vars in `@theme inline`: each points to `var(--theme-*)`. This means all existing Tailwind utilities (`bg-depth`, `text-text-base`, `bg-panel`, `border-border`, etc.) keep working in both themes with zero per-component changes for anything already using them.

**Tailwind dark variant:** Add `@custom-variant dark (&:where([data-theme="dark"], [data-theme="dark"] *));` to `globals.css` so `dark:` prefix utilities are available if needed for one-offs.

---

## Section 2 — Color Tokens

### globals.css restructure

**`:root` block (light defaults):**
```css
:root {
  --theme-depth:        #f8fafc;
  --theme-surface:      #f1f5f9;
  --theme-panel:        #ffffff;
  --theme-panel-hover:  #f8fafc;
  --theme-border:       #e2e8f0;
  --theme-text-base:    #0f172a;
  --theme-text-dim:     #475569;
  --theme-text-muted:   #94a3b8;
  /* Toggle pill track / active */
  --theme-toggle-track:        #e2e8f0;
  --theme-toggle-active:       #0f172a;
  --theme-toggle-text:         #94a3b8;
  --theme-toggle-text-active:  #ffffff;
  /* Graph canvas */
  --gc-bg:         rgba(248,250,252,0.9);
  --gc-bg-dot:     rgba(0,0,0,0.06);
  --gc-border:     #e2e8f0;
  --gc-overlay:    rgba(248,250,252,0.88);
  --gc-overlay-border: #e2e8f0;
  --gc-btn-text:   #475569;
  --gc-btn-hover:  rgba(0,0,0,0.04);
  --gc-btn-hover-text: #0f172a;
  --gc-divider:    #e2e8f0;
  --gc-label-color: #475569;
  /* Avatar fallback gradient */
  --theme-avatar-gradient: linear-gradient(135deg, #cbd5e1, #94a3b8);
}
```

**`[data-theme="dark"]` block (dark overrides):**
```css
[data-theme="dark"] {
  --theme-depth:        #000000;
  --theme-surface:      #111111;
  --theme-panel:        #1a1a1a;
  --theme-panel-hover:  #222222;
  --theme-border:       #3d3d3d;
  --theme-text-base:    #f1f5f9;
  --theme-text-dim:     #94a3b8;
  --theme-text-muted:   #64748b;
  --theme-toggle-track:        #222222;
  --theme-toggle-active:       #ffffff;
  --theme-toggle-text:         #64748b;
  --theme-toggle-text-active:  #0f172a;
  --gc-bg:         rgba(8,8,11,0.6);
  --gc-bg-dot:     rgba(255,255,255,0.04);
  --gc-border:     #1A1A1E;
  --gc-overlay:    rgba(11,11,14,0.85);
  --gc-overlay-border: #232328;
  --gc-btn-text:   #C8C8CE;
  --gc-btn-hover:  rgba(255,255,255,0.04);
  --gc-btn-hover-text: #ffffff;
  --gc-divider:    #232328;
  --gc-label-color: #94a3b8;
  /* Avatar fallback gradient */
  --theme-avatar-gradient: linear-gradient(135deg, #2a2a2a, #444444);
}
```

**`@theme inline` block** — unchanged structure, values now point to `--theme-*`:
```css
@theme inline {
  --color-depth:        var(--theme-depth);
  --color-surface:      var(--theme-surface);
  --color-panel:        var(--theme-panel);
  --color-panel-hover:  var(--theme-panel-hover);
  --color-border:       var(--theme-border);
  --color-text-base:    var(--theme-text-base);
  --color-text-dim:     var(--theme-text-dim);
  --color-text-muted:   var(--theme-text-muted);
  /* Accents unchanged */
  --color-blue:         #2563eb;
  --color-blue-light:   #3b82f6;
  --color-blue-bright:  #60a5fa;
  --color-gold:         #eab308;
  --color-gold-light:   #facc15;
  --color-emerald:      #22c55e;
  --font-heading:       var(--font-outfit);
  --font-sans:          var(--font-outfit);
}
```

### custom.css changes

**`html, body` rule:** Replace hardcoded `#0a0e1a` / `#f1f5f9` with `var(--theme-depth)` / `var(--theme-text-base)`.

**`.brief` section vars:** The `.brief` block defines its own `--brief-bg`, `--brief-surface`, `--brief-border`, etc. These need light-mode overrides. Add a `[data-theme="light"] .brief { ... }` block that replaces the dark hex values with light equivalents.

**`.gc` (graph canvas chrome):** Replace all hardcoded hex values in `.gc`, `.gc__overview`, `.gc__zoom`, `.gc__zoom button`, etc. with the `--gc-*` CSS vars defined above.

**`.mem-card`, `.mem-group__title`, `.mem-group__sub`, `.mem-card__body`, etc.:** Add `[data-theme="light"]` overrides for all hardcoded dark hex values in the memory timeline CSS classes.

**`.loop` borders:** `border-top: 1px solid #1A1A1E` → `border-top: 1px solid var(--theme-border)`.

**Scrollbar:** Add `[data-theme="light"]` block overriding track/thumb colors.

**StarField:** The component has no CSS class. As part of this work, add `className="starfield ..."` to the root `<div>` in `src/components/StarField.tsx`, then add `[data-theme="light"] .starfield { display: none; }` to `custom.css`.

**Inline-style color constants used in components:** The `UserMenu` and `BottomTabBar` dropdown popups use hardcoded hex (`#111111` background, `rgba(255,255,255,0.12)` border, `rgba(255,255,255,0.05)` hover). These are replaced with `var(--theme-surface)`, `var(--theme-border)`, and `var(--theme-panel-hover)` respectively.

Avatar gradients (`linear-gradient(135deg,#2a2a2a,#444444)`) in both components are replaced with a theme-responsive CSS var `--theme-avatar-gradient`.

---

## Section 3 — ThemeToggle Component

**File:** `src/components/dashboard/ThemeToggle.tsx`

```
Props: none
Dependencies: next-themes (useTheme), lucide-react (Sun, Moon, Monitor)
```

**Behavior:**
- On mount, reads current theme from `useTheme`
- Renders a `mounted` guard: returns `null` until hydrated to prevent SSR mismatch
- Three segments in order: Light (Sun icon), Dark (Moon icon), System (Monitor icon)
- Clicking a segment calls `setTheme(id)`
- Active segment: filled pill with `var(--theme-toggle-active)` background, text `var(--theme-toggle-text-active)`
- Inactive segments: transparent, text `var(--theme-toggle-text)`
- Transition: `all 0.15s ease` on background and color
- Track background: `var(--theme-toggle-track)`, `border-radius: 7px`, `padding: 3px`
- Each segment: `flex: 1`, `border-radius: 5px`, `height: 28px`, icon (11px) + label (11px) in a row

**Placement in `UserMenu.tsx`:**
```
[Account settings button]
[thin divider]
[ThemeToggle]
[thin divider]
[Sign out button]
```

**Placement in `BottomTabBar.tsx`** (inside the profile popup):
```
[user info header]
[divider]
[Manage Account button]
[divider]
[ThemeToggle]
[divider]
[Sign Out button]
```

---

## Section 4 — Memory Graph Theme Support

**Files:** `src/components/memory/graphConstants.ts`, `src/components/memory/GraphCanvas.tsx`

**Strategy:** Convert hardcoded color constants to functions that read CSS vars at draw time:
```ts
function cssVar(name: string): string {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim()
}
```

Replace color constants like `NODE_COLOR = "#2563eb"` with `nodeColor: () => cssVar('--gc-node-color')`. Add `--gc-node-color`, `--gc-edge-color`, `--gc-node-label` etc. to the `:root` / `[data-theme="dark"]` blocks.

**Re-render on theme change:** In `GraphCanvas.tsx`, add a `MutationObserver` on `document.documentElement` watching the `data-theme` attribute. When it fires, trigger a re-render / re-draw so graph colors update instantly without a page reload.

---

## Section 5 — Files Changed (complete list)

| File | Change |
|---|---|
| `package.json` | Add `next-themes@^0.4` |
| `src/app/layout.tsx` | Add ThemeProvider, move suppressHydrationWarning to `<html>` |
| `src/app/globals.css` | Add `:root` light vars, `[data-theme="dark"]` overrides, restructure `@theme inline`, add `@custom-variant dark` |
| `src/app/custom.css` | Replace hardcoded hex in body, .brief, .gc, .mem-card, .loop, scrollbar; add StarField hide rule |
| `src/components/dashboard/ThemeToggle.tsx` | **New file** — segmented pill |
| `src/components/dashboard/UserMenu.tsx` | Add ThemeToggle, replace inline hex with CSS vars |
| `src/components/dashboard/BottomTabBar.tsx` | Add ThemeToggle, replace inline hex with CSS vars |
| `src/components/StarField.tsx` | Add `starfield` CSS class to root div |
| `src/components/memory/graphConstants.ts` | Convert colors to CSS var readers |
| `src/components/memory/GraphCanvas.tsx` | Add MutationObserver for theme re-draw |

---

## Out of Scope

- Landing page dark mode (landing page stays dark-only; no light mode for marketing pages)
- Clerk auth modal theming (uses Clerk's own theme system, separate concern)
- Per-user server-side theme persistence (localStorage is sufficient; no DB change needed)
