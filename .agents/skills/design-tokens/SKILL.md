---
name: controlforge-design-tokens
description: Applies ControlForge's visual identity — the "phosphor & brass" color system, typography, and motion rules — to any page, component, or UI element. Use when building, styling, or editing any ControlForge page (Home, Projects, Calculators, PID Lab, Notes, Dashboard), when the user asks for a new page/component/section, or when reviewing existing UI for consistency with the site's look and feel.
---

# ControlForge Design Tokens

ControlForge is an instrumentation and control engineering platform. Its visual identity is grounded in **real analog instrumentation** — gauge needles, CRT/oscilloscope phosphor displays, brass nameplates — not generic SaaS/tech-dashboard conventions. Do not default to blue/cyan-on-navy, rounded card grids with soft drop shadows, or gradient-wash hero sections; these are the generic look this project deliberately moved away from.

## Color tokens

Use these exact values. Do not substitute similar-looking colors.

```css
--bg:          #15130F;   /* warm graphite base — NOT blue-black, NOT pure black */
--panel:       #1D1A15;   /* card/panel surface */
--panel-2:     #18150F;   /* recessed surface (chart backgrounds, inset fields) */
--line:        #302B22;   /* borders, dividers */
--line-soft:   #221E17;   /* faint grid lines, subtle separators */

--amber:       #FFB000;   /* PRIMARY signal color — live data, active states, links, focus */
--amber-dim:   #8C6318;   /* de-emphasized amber (disabled active states) */
--amber-glow:  rgba(255,176,0,.35); /* box-shadow / text-shadow glow only */

--crimson:     #D64550;   /* alarms, errors, bad tuning/overshoot — nothing else */
--verdigris:   #4FA98A;   /* normal/OK/success states — nothing else */

--text:        #EDE6DA;   /* primary text — warm off-white, like engraved brass. NEVER pure white (#fff) */
--text-dim:    #A79C8A;   /* secondary text, labels */
--text-faint:  #6B6255;   /* tertiary text, meta info, timestamps */
```

**Rules:**
- Amber is the *signal* color: numbers, active/live states, primary buttons, focus rings, hover accents. It is not a decorative wash — never use it as a large background fill or gradient backdrop.
- Crimson and verdigris are reserved exclusively for alarm/error and normal/success states respectively. Never use them decoratively or as a generic accent.
- Background is always the warm graphite `--bg`, never pure black (`#000`) or blue-black.

## Typography

```css
font-family: 'Space Grotesk', sans-serif;   /* headings only (h1–h3) */
font-family: 'IBM Plex Mono', monospace;    /* ALL data: instrument tags (LT-101), numbers, units, nav labels, buttons, UI chrome */
font-family: 'IBM Plex Serif', serif;       /* body paragraphs in long-form content only (Notes/article pages) */
font-family: 'IBM Plex Sans', sans-serif;   /* short UI copy, descriptions, card blurbs — NOT article body text */
```

- Never mix mono and serif in the same content block. Mono = machine data. Serif = human reading. Sans = interface chrome/short copy.
- Heading weight: 500–600. Avoid all-caps headings; use all-caps only for short mono labels (e.g. a status pill like `SYS · ONLINE`), and only where the content is genuinely a short system-style label, not a section title.

## Layout principles

- Backgrounds may use a faint graph-paper grid (`--line-soft`, 28–56px cell) behind panels or thumbnails — this reinforces the "engineering drawing" feel. Do not use it under long-form reading content (Notes body text).
- Card grids use a shared 1px hairline border between cells (background-color-as-gridline technique), not individual rounded cards with drop shadows.
- Border radius stays small and consistent: 2–5px across all components. Never use large/pill radii except for status dots and small pills.
- Instrument tags (PT-101, LT-101, FV-101, etc.) always render in IBM Plex Mono, small size, with the tag prefix meaning preserved (PT=pressure, TT=temperature, FT=flow, LT=level, xIC=controller).

## Motion rules — read this before adding any animation

**Home page only** may use continuous/ambient motion: 3D parallax scenes, auto-playing particle flows, rotating gauges, idle bobbing.

**Every other page** (Projects, Calculators, PID Lab, Notes, Dashboard) must follow "motion serves the task" — animation only fires in direct response to user input:
- Hover: subtle tilt (2–8deg max) or border/shadow change — never more than ~0.3s duration
- Scroll: at most one staggered reveal per section, not per individual element
- Interaction: live-recalculating numbers, step-by-step reveals when a user changes an input (e.g. calculator steps animating in as values change)
- Nothing should loop indefinitely or auto-play on these pages

Always respect `prefers-reduced-motion: reduce` — set all animations/transitions to near-zero duration under that media query, project-wide.

## Quick self-check before finishing any ControlForge UI work

- [ ] Is amber used only for signal/active data, not as background decoration?
- [ ] Are crimson/verdigris used only for alarm/normal states?
- [ ] Is background warm graphite, not black or navy?
- [ ] Is mono reserved for data/tags, serif for long reading, sans for short UI copy?
- [ ] If this is not the Home page, does motion only happen in response to user action?
- [ ] Border radius small (2–5px), hairline grid borders instead of individual card shadows?
