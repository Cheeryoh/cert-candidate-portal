# RCA — Dark Theme Toggle: Colours Not Changing on Theme Switch

**Date:** 2026-03-17
**Severity:** Medium — feature visually broken; no data loss or auth impact
**Status:** Resolved

---

## Summary

After implementing a light/dark theme toggle using `next-themes`, the toggle button functioned correctly (icon and label updated on click) but no colours changed anywhere in the application. The root cause was a **CSS specificity tie** between the `:root {}` light-mode variable block and the `.dark {}` dark-mode variable block. Tailwind v4's compilation pipeline re-emits `:root` rules after `.dark` rules in the final CSS bundle, causing the light-mode values to always win via the last-rule-wins cascade rule.

---

## Timeline

| Time | Event |
|------|-------|
| Implementation | `next-themes` `ThemeProvider` added to `layout.tsx`; light/dark CSS variable blocks written in `globals.css`; `ThemeToggle` component created; all hardcoded inline colour values removed from sidebar and login page |
| First test | Toggle button clicked — icon switches between Sun/Moon correctly |
| Bug observed | No colour changes visible on any page in either direction |
| Diagnosis | CSS specificity tie identified between `:root {}` and `.dark {}` |
| Fix applied | `.dark {}` renamed to `:root.dark {}` in `globals.css` |

---

## What Worked Correctly

- `next-themes` `ThemeProvider` was wired up correctly (`attribute="class"`, `defaultTheme="light"`, `suppressHydrationWarning` on `<html>`)
- `next-themes` correctly wrote `.dark` to `document.documentElement.classList` on toggle
- `useTheme()` context updated, causing the React-rendered icon/label to switch
- All hardcoded `rgba(255,...)`, `#141413`, `#1c1c1a`, `#e8ddd0`, `text-zinc-*`, `bg-zinc-*` values had been purged from `.tsx` files
- CSS variable tokens were correctly referenced throughout the app (`bg-background`, `bg-sidebar`, `text-foreground`, etc.)
- Tailwind v4's `@custom-variant dark (&:is(.dark *))` was already present and correctly scoped

---

## Root Cause

### CSS Specificity Tie

CSS specificity is a three-part score `(id, class/attr/pseudo-class, element)`. Both `:root` and `.dark` score `(0,1,0)`:

| Selector | Specificity |
|----------|-------------|
| `:root` | `(0,1,0)` — one pseudo-class |
| `.dark` | `(0,1,0)` — one class |

When two rules have equal specificity and both match the same element, **the rule that appears later in the compiled stylesheet wins**. This is the CSS "last-rule-wins" tie-breaker.

In the source file `globals.css`, `:root {}` appeared on line 50 and `.dark {}` on line 85. In isolation this would be fine — `.dark` wins the tie because it comes later.

### Tailwind v4 Compilation Reorders `:root` Blocks

Tailwind v4 processes `globals.css` through a multi-pass pipeline:

1. `@import "tailwindcss"` — Tailwind base reset and utility foundations
2. `@import "tw-animate-css"` — animation utilities
3. `@import "shadcn/tailwind.css"` — shadcn component plugin
4. `@custom-variant dark (...)` — variant registration
5. `@theme inline { ... }` — theme variable mapping (may generate or reference `:root` declarations)
6. Developer-authored `:root {}` — light-mode variables (line 50 in source)
7. Developer-authored `.dark {}` — dark-mode variables (line 85 in source)
8. `@layer base { ... }` — base element styles

After Tailwind v4 resolves all `@import` and `@theme` directives, **it re-emits collected `:root` blocks as part of its output**. The `:root` declarations generated or collected during `@theme` processing are written after the position of the developer's `.dark {}` block in the final bundle. This makes `:root` physically appear later than `.dark` in the compiled CSS output.

Result: `:root { --background: #faf9f7 }` wins over `.dark { --background: #141413 }` on the same `html.dark` element every time, regardless of what class `next-themes` adds to `<html>`.

### Why the Toggle Icon Changed but Colours Did Not

These are two independent systems:

- **Icon/label** — driven by `useTheme().theme`, a React context value. `setTheme('dark')` updates React state immediately. The component re-renders. No CSS involved.
- **Colours** — driven by CSS custom properties cascading from `<html>`. `next-themes` correctly called `document.documentElement.classList.add('dark')`. The browser found `.dark { --background: #141413 }` and matched it — but also found `:root { --background: #faf9f7 }` later in the same stylesheet. Equal specificity, later position → light mode won. CSS variables stayed light. Browser repainted with unchanged colours.

The systems appeared to work together but had no actual coupling on the colour path.

---

## Fix

Changed `.dark {}` to `:root.dark {}` in `globals.css`.

```css
/* Before — specificity (0,1,0), ties :root */
.dark {
  --background: #141413;
  ...
}

/* After — specificity (0,2,0), always beats :root */
:root.dark {
  --background: #141413;
  ...
}
```

`:root.dark` matches a single element — the `<html>` element that has both the `:root` pseudo-class and the `.dark` class. Its specificity is `(0,2,0)` (pseudo-class + class), which permanently beats `:root`'s `(0,1,0)` regardless of the order Tailwind places them in the compiled output.

---

## Contributing Factors

**1. Implementation plan did not specify the selector form**
The plan specified "Add `.dark {}` block with existing dark values" without noting the specificity requirement. The implementer used the most natural-looking selector without considering compilation ordering.

**2. Tailwind v4 compilation ordering is non-obvious**
Developers reasonably expect their source file order to be preserved. The reordering of `:root` blocks by Tailwind v4's pipeline is an internal detail not surfaced in error messages or warnings.

**3. No automated colour-change test**
The Playwright test suite verified auth flow and page content but not that the theme toggle actually changed computed CSS colours. A visual regression test or a DOM inspection test would have caught this during CI before manual testing.

---

## Prevention Checklist

These items should be applied to any future theme implementation in a Tailwind v4 project:

### In CSS

- [ ] **Never use `.dark {}` to override `:root {}` variables.** The selectors tie on specificity and compilation order determines the winner. Use `:root.dark {}` or `html.dark {}` instead.
- [ ] Apply the same rule to any attribute-based theme selectors: `[data-theme="dark"] {}` also ties `:root`. Use `:root[data-theme="dark"] {}`.

| Selector | Specificity | Verdict |
|----------|-------------|---------|
| `.dark {}` | `(0,1,0)` | ❌ Unreliable — ties `:root` |
| `html.dark {}` | `(0,1,1)` | ✓ element + class |
| `:root.dark {}` | `(0,2,0)` | ✓ pseudo-class + class |

### In Testing

- [ ] Add a Playwright test that toggles the theme and asserts a computed CSS colour changed. Example:

```ts
test('theme toggle changes background colour', async ({ page }) => {
  await page.goto('/dashboard')

  const bgBefore = await page.evaluate(() =>
    getComputedStyle(document.documentElement)
      .getPropertyValue('--background').trim()
  )

  await page.getByRole('button', { name: /dark mode/i }).click()

  const bgAfter = await page.evaluate(() =>
    getComputedStyle(document.documentElement)
      .getPropertyValue('--background').trim()
  )

  expect(bgAfter).not.toBe(bgBefore)
})
```

### In Code Review

- [ ] Any PR that adds or modifies a `.dark {}` CSS block should be flagged for the selector specificity rule above.
- [ ] Any PR that wraps a Next.js layout in `ThemeProvider` should verify `suppressHydrationWarning` is on `<html>`, not `<body>`.

---

## Lessons Learned

1. **CSS specificity ties are silent.** The browser applies no warning when two equal-specificity rules conflict. The only symptom is unexpected visual output.

2. **"The toggle works" is not sufficient verification.** A toggle that updates React state and a toggle that changes CSS colours are two separate things. Both must be tested independently.

3. **Tailwind v4 compilation ordering is not source-order-preserving for `:root` blocks.** Treat compiled CSS as a black box for ordering purposes and use specificity — not position — to guarantee cascade priority.

4. **Grep audits catch values but not selectors.** The pre-implementation colour audit correctly identified and removed all hardcoded hex/rgba values from `.tsx` files. It did not (and cannot easily) catch a specificity issue in `.css` files. The audit must be paired with a runtime colour-change test.
