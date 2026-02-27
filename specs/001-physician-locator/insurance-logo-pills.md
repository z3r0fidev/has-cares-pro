# Enhancement Spec: Insurance Pill Logo Integration

**Feature Branch**: `001-physician-locator`
**Created**: 2026-02-27
**Status**: Approved for Implementation
**Enhancement Type**: UI/UX — Visual Identity

---

## Overview

Enhance insurance filter pills (HeroBanner) and insurance accepted chips (Provider Profile) to display each insurer's brand logo alongside the plan name. The logo provides immediate visual recognition — patients identify their carrier by mark before reading the text — reducing cognitive load and improving filter interaction rates.

---

## Affected Surfaces

| Surface | Component | Current state | Enhanced state |
|---|---|---|---|
| Home → HeroBanner | `HeroBanner.tsx` | Text-only pill button | Logo + label pill button |
| Provider Profile → Insurance section | `providers/[id]/page.tsx` | Text-only green chip | Logo + label green chip |

---

## Research Findings

### Logo Source: Clearbit Logo API

**Decision: Clearbit (`https://logo.clearbit.com/<domain>`) as primary, initials as mandatory fallback.**

Evaluated three options:

| Option | Verdict | Reason |
|---|---|---|
| A — Clearbit runtime | **Selected** | Covers 6/8 commercial insurers; PNG; free tier; browser-cached |
| B — Simple Icons npm | Eliminated | Zero coverage for all 8 insurers (healthcare excluded from scope) |
| C — Self-hosted SVG sprite | Eliminated | No `/public/` directory exists; trademark maintenance burden; 36 BCBS regional variants |

No npm package bundles US health insurance logos. The `simple-icons` package and `@healthcare-icons/react` both lack insurer brand marks.

### Clearbit Coverage

| Insurer | Domain | Logo available |
|---|---|---|
| Aetna | `aetna.com` | Yes |
| Blue Cross Blue Shield | `bcbs.com` | Yes (BCBSA federation mark) |
| Cigna | `cigna.com` | Yes |
| Humana | `humana.com` | Yes |
| UnitedHealthcare | `uhc.com` | Yes |
| Kaiser Permanente | `kaiserpermanente.org` | Yes |
| Medicare | `medicare.gov` | **No** — government program, initials fallback only |
| Medicaid | `medicaid.gov` | **No** — government program, initials fallback only |

### Brand Colors (for initials fallback)

| Insurer | Fallback bg | Fallback text | Initials |
|---|---|---|---|
| Aetna | `#FEF3C7` | `#92400E` | AE |
| Blue Cross Blue Shield | `#EFF6FF` | `#1D4ED8` | BC |
| Cigna | `#EFF6FF` | `#1E40AF` | CI |
| Humana | `#FDF2F8` | `#9D174D` | HU |
| Medicare | `#EFF6FF` | `#1D4ED8` | MC |
| Medicaid | `#F0FDF4` | `#15803D` | MD |
| UnitedHealthcare | `#FFF7ED` | `#9A3412` | UH |
| Kaiser Permanente | `#F0FDF4` | `#166534` | KP |

---

## UX Design Decisions (Premium UX Review)

### Logo Sizing

- **Filter pills (HeroBanner):** 16px — one step above `text-sm` (14px); legible mark, compact pill
- **Profile chips:** 14px — proportional to `text-xs` (12px); prevents vertical tension

Logo sizing formula: `Math.max(6, Math.floor(size * 0.42))` px font-size for initials

### Aspect Ratio

**`object-contain` inside a fixed square container.** All insurance logos are wide-format (BCBS, UHC, Cigna are landscape wordmarks). `object-cover` crops wordmarks unacceptably. Natural dimensions produce ragged pill widths. `object-contain` with transparent background is the only acceptable choice.

### Fallback Strategy

Two-tier fallback:

1. **Immediate base layer:** Initials rendered in brand color at mount (zero network, zero CLS).
2. **Async overlay:** Clearbit `<img>` loads on top; fades in on `onLoad` (150ms). Stays hidden forever on `onError`. Initials remain as permanent visible layer.

Medicare and Medicaid are in `NO_LOGO_SET` — no `<img>` is ever mounted for them, eliminating redundant government website requests.

### Interactive State (Filter Pills)

```
Default:   bg-white / border-slate-200 / text-slate-700
Hover:     bg-white / border-primary / shadow-sm
Selected:  bg-primary/10 / border-primary / text-slate-900 font-semibold
```

**Do not tint or alter the logo on selection.** Brand marks remain full-color in all states. The pale-gold `bg-primary/10` wash reads clearly against all 8 insurer colors.

### Profile Chips vs. Filter Pills

Visually distinct to prevent false affordance. Profile chips are **non-interactive** (`cursor-default`, no hover state). Filter pills are **interactive** (`cursor-pointer`, hover border/shadow). They share the logo treatment but differ in interactivity, size, and color family.

### Accessibility

- Logos are **decorative**: `alt=""` + `aria-hidden="true"` on all logo elements
- The parent `button`'s `aria-label={`Filter by ${pill.label} insurance`}` is the full accessible context
- Profile chip `<span>` text node provides the screen reader label; logo is excluded
- Focus ring from `--ring` (brand gold) applies automatically via `globals.css` `outline-ring/50`

### Loading UX

No skeleton placeholder at 16px. Skeleton would be noisier than the instant fallback. Pattern:

1. Initials render immediately → no CLS
2. `<img>` loads silently behind the initials
3. 150ms `transition-opacity` fade when `onLoad` fires
4. On `onError` or for `NO_LOGO_SET`: fallback persists permanently

### Mobile

Logos stay visible on mobile — recognition is the primary value of this enhancement. Width increase is ~24px per pill (16px logo + 8px gap – 4px padding reduction). Scrollable HeroBanner row accommodates this without layout changes.

Responsive padding: `px-3 py-1.5` (desktop+mobile unified — no separate breakpoint needed).

---

## Shadcn / Component Architecture

### Components Required

| Component | Status | Install |
|---|---|---|
| `Badge` | Already installed | — |
| `Button` | Already installed | — |
| `Avatar` | Already installed | — |
| `Tooltip` | **Not installed** | `cd apps/web && npx shadcn@latest add tooltip` |

**Tooltip is optional for MVP.** It adds full plan name on hover for truncated labels (e.g. "UnitedHealthcare" at narrow viewports). The core logo enhancement does not require it.

### Component Composition

Filter pills use a **raw `<button>`** (not shadcn `Button`) to preserve the exact current style surface. Adding shadcn `Button` would require overriding its height and font-weight defaults and is unnecessary complexity.

Profile chips use a **raw `<span>`** (not shadcn `Badge`) for the same reason — existing green color family is a hand-crafted design token that doesn't map to a Badge variant.

In both cases, `InsuranceLogo` is the new shared child component dropped in as the leading element.

---

## Files Modified

| File | Type | Change |
|---|---|---|
| `apps/web/src/lib/insuranceLogos.ts` | **New** | Domain map, brand colors, helper functions |
| `apps/web/src/components/Insurance/InsuranceLogo.tsx` | **New** | Shared logo + initials fallback component |
| `apps/web/src/components/Search/HeroBanner.tsx` | Modified | Add `InsuranceLogo` to pills, compact padding |
| `apps/web/src/app/[locale]/providers/[id]/page.tsx` | Modified | Add `InsuranceLogo` to insurance chips |
| `apps/web/next.config.ts` | Modified | Add `logo.clearbit.com` to `images.remotePatterns` |

---

## Implementation Plan

### Step 1 — Create `apps/web/src/lib/insuranceLogos.ts`

New data module. No component changes yet.

Exports:
- `InsuranceFallbackConfig` type
- `NO_LOGO_SET: Set<string>` — `['Medicare', 'Medicaid']`
- `INSURER_DOMAIN_MAP: Record<string, string>` — 6 commercial insurers
- `INSURER_FALLBACK_CONFIG: Record<string, InsuranceFallbackConfig>` — all 8 insurers
- `getClearbitLogoUrl(name: string): string | null`
- `getFallbackConfig(name: string): InsuranceFallbackConfig`

### Step 2 — Create `apps/web/src/components/Insurance/InsuranceLogo.tsx`

`"use client"` component. Props: `name: string`, `size?: number` (default 16).

Rendering logic:
```
if NO_LOGO_SET.has(name) or getClearbitLogoUrl(name) === null:
  → render InitialsFallback only (no img mount)
else:
  → render InitialsFallback as z-0 base layer
  → render <img> as z-10 overlay, opacity-0 initially
  → onLoad: setLoaded(true) → opacity-100 with 150ms transition
  → onError: setErrored(true) → img hidden forever, fallback remains
```

Font size for initials: `Math.max(6, Math.floor(size * 0.42))` px.

The container `<span>` is `aria-hidden="true"` — purely decorative.

### Step 3 — Update `apps/web/next.config.ts`

Add `images.remotePatterns` entry for `logo.clearbit.com`:

```typescript
images: {
  remotePatterns: [
    {
      protocol: 'https',
      hostname: 'logo.clearbit.com',
      port: '',
      pathname: '/**',
    },
  ],
},
```

### Step 4 — Update `apps/web/src/components/Search/HeroBanner.tsx`

Minimal surgical changes:
- Import `InsuranceLogo` from `@/components/Insurance/InsuranceLogo`
- Add `InsurancePill` interface (no functional change — just typing the existing `INSURANCE_PILLS` array)
- On each pill `<button>`:
  - Change `px-4 py-2` → `px-3 py-1.5`
  - Add `flex items-center gap-1.5` to `className`
  - Insert `<InsuranceLogo name={pill.value} size={16} />` as first child
- All other code (click handler, aria-label, hover classes) unchanged

### Step 5 — Update `apps/web/src/app/[locale]/providers/[id]/page.tsx`

Minimal surgical changes to the insurance section only (lines 265–282):
- Add import: `import InsuranceLogo from '../../../../components/Insurance/InsuranceLogo';`
- On each insurance chip `<span>`:
  - Change `px-2.5 py-1` → `px-3 py-1.5`
  - Add `inline-flex items-center gap-1.5` to `className`
  - Insert `<InsuranceLogo name={ins} size={14} />` as first child
- All other code unchanged

---

## Acceptance Criteria

1. **Logo renders** — For all 6 commercial insurers (Aetna, BCBS, Cigna, Humana, UHC, Kaiser), a small logo appears to the left of the name in both HeroBanner filter pills and Provider Profile insurance chips.
2. **Fallback renders** — For Medicare and Medicaid (and any unknown insurer string), a brand-colored initials badge renders immediately; no broken `<img>` tag or empty space is visible at any point.
3. **No layout shift** — Pills and chips do not reflow when the logo finishes loading. The container maintains fixed dimensions from mount.
4. **No broken images** — If Clearbit returns a 404 or network error, the `onError` handler fires and the initials fallback remains visible. The `<img>` does not appear with a broken-image icon.
5. **Accessibility preserved** — Screen readers announce only the pill's `aria-label` or chip text. Logo `aria-hidden="true"` is set on all logo elements. No redundant announcements.
6. **Mobile usability** — Pills remain compact and scrollable on 375px viewport. Logo does not cause horizontal overflow.
7. **TypeScript clean** — `npm run build` passes with zero type errors.
8. **No new dependencies** — Implementation uses only existing packages (React, Tailwind, `cn` from `@/lib/utils`).

---

## Out of Scope

- Tooltip component installation — optional enhancement, deferred to future PR
- Self-hosted logo assets — deferred; requires trademark legal review and CI asset pipeline
- Selected/active state for filter pills — existing behavior preserved; visual active state is a separate enhancement
- Insurance filter count badges — separate enhancement
- Logo for ProviderSearchCard insurance fields — card does not currently display insurance; separate feature

---

## Licensing Note

Displaying insurer logos to indicate "this provider accepts [insurance]" is universal practice across ZocDoc, Healthgrades, Headway, and all major US provider directory platforms. This constitutes non-modified reference use. Mitigation: add "All insurance logos are registered trademarks of their respective owners" to `terms-of-service.md` prior to production launch.
