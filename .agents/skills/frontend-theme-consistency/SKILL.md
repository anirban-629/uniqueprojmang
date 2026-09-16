---
name: frontend-theme-consistency
description: >-
  MANDATORY pre-read before any frontend UI work — new components, pages, styling changes, or
  edits to existing UI. Enforces a single source of truth for design tokens, spacing, typography,
  and component reuse so the entire app stays visually uniform. Strict: no ad-hoc styling, no
  hardcoded values, no new components without first checking for an existing equivalent.
---

# Frontend Theme Consistency

This skill is **not optional context** — it is a required read-before-write gate. Any task that touches `apps/web` UI (new component, new page, styling change, layout change, even a "small" tweak) must consult this skill's rules before writing code. If a request arrives to do FE work and this skill hasn't been consulted yet in the current task, read it first, before proposing or writing anything.

---

## 0. Why This Is Strict

A design system degrades one "just this once" exception at a time — one hardcoded hex color here, one custom spacing value there, one bespoke button instead of the shared one. Individually harmless, collectively the app stops looking like one product. This skill exists to make "reuse and stay consistent" the default that requires no willpower, and "invent something new" the path that requires an explicit, justified exception.

---

## 1. Before Writing Any UI Code — Mandatory Checks, In Order

### 1.1 Read the theme source of truth

Locate and read the actual current design tokens before doing anything else:

```bash
cat apps/web/tailwind.config.ts    # or .js — color palette, spacing scale, font config, breakpoints
cat apps/web/src/app/globals.css   # CSS custom properties, :root tokens, dark mode overrides
```

Do not assume you remember these values from a previous task in this session — **re-read them fresh every time**, since they can change, and working from a stale mental snapshot is exactly how drift happens.

### 1.2 Search for an existing component before creating one

```bash
ls apps/web/src/components/ui/          # shadcn/ui primitives already installed
grep -r "export function" apps/web/src/components/ --include="*.tsx" -l
```

If a component that does what's needed (or close to it) already exists, **use/extend it — do not create a parallel one.** A second "Button" variant that isn't the shared `Button` component is exactly the kind of drift this skill exists to prevent.

### 1.3 Check for an existing pattern for this kind of UI

Before building a new page layout, form pattern, card style, empty state, loading state, or error state — check if one already exists elsewhere in the app (`apps/web/src/app/(app)/...`) and follow that pattern rather than inventing a new one. Consistency of _pattern_ matters as much as consistency of _tokens_.

---

## 2. Hard Rules — No Exceptions Without Explicit User Sign-Off

1. **No hardcoded colors.** Never write `#3B82F6`, `rgb(...)`, or a raw Tailwind color class like `bg-blue-500` directly in a component. Use the theme's semantic tokens only (e.g., `bg-primary`, `text-muted-foreground`, whatever the actual token names are in `globals.css`/`tailwind.config.ts` — read Section 1.1 first to know the real names, don't guess generic shadcn defaults if this project has customized them).
2. **No hardcoded spacing/sizing values outside the scale.** No `margin: 13px` or `p-[17px]`. Use the spacing scale already defined (Tailwind's default scale, or a customized one — check `tailwind.config.ts`). If a genuinely new spacing value seems needed, that's a signal to stop and ask, not to reach for an arbitrary value.
3. **No new font sizes/weights outside the defined type scale.** Same principle — check what heading/body/caption styles already exist and reuse them.
4. **No new components duplicating an existing one's purpose.** Per Section 1.2 — extend/compose the existing component (via props, variants) rather than building a sibling.
5. **No inline `style={{ }}` for anything the theme/utility classes already cover.** Inline styles bypass the entire token system and are invisible to any future theme change (e.g., a color palette update won't touch a hardcoded inline style).
6. **No new UI patterns (a new type of card, a new modal style, a new empty-state design) without checking Section 1.3 first**, and if nothing existing fits, **ask the user before inventing one** — a new pattern is a design decision, not just a code change, and shouldn't be made unilaterally.
7. **Dark mode is not optional.** Every new piece of UI must work correctly in both light and dark mode using the theme's existing dark-mode token overrides — never a component that only looks right in one mode because it used a hardcoded light-mode-only value.
8. **Responsive behavior must match existing breakpoint conventions.** Check how existing pages handle mobile/tablet/desktop before introducing a new breakpoint pattern.

---

## 3. When a Genuine New Pattern _Is_ Needed

Sometimes the existing system truly doesn't cover a new need (e.g., a Kanban board component genuinely doesn't exist yet and nothing else in the app resembles it). In that case:

1. **State explicitly that this is new** — don't quietly build it as if it were routine. Say something like: _"There's no existing pattern for a Kanban board in the codebase — I'll need to design a new component. Here's the approach I'd take, using the existing color/spacing tokens: [...]. Should I proceed?"_
2. **Still use the existing tokens** (colors, spacing, type scale) even when the _structure_ is new — a new component should still visually belong to the same design system, even if its layout is novel.
3. **Get explicit confirmation before building it**, per the project's standing file-change guardrails (`GEMINI.md` / `.agents/rules/`) — a new design pattern is exactly the kind of change that deserves a deliberate yes, not an assumed one.
4. Once approved and built, treat it as the new canonical pattern for that use case — the _next_ time something similar is needed, it should be found via Section 1.3 and reused, not reinvented again.

---

## 4. Consistency Checklist Before Considering Any FE Task Done

Run through this before presenting the work as complete:

- [ ] No hardcoded color values anywhere in the diff (grep for `#` hex codes and raw `rgb(`/`hsl(` in the changed files as a sanity check).
- [ ] No arbitrary Tailwind bracket values (`[17px]`, `[#hex]`) unless there was no alternative and the user was told why.
- [ ] Every new/reused component matches the naming and prop conventions of similar existing components.
- [ ] Verified in both light and dark mode (mentally trace through, or actually check if you can run the app).
- [ ] Spacing and typography visually match neighboring UI — not just "close enough."
- [ ] If anything in this task required deviating from an existing pattern, that deviation was explicitly flagged and approved (Section 3), not silently introduced.

---

## 5. Relationship to Other Skills/Rules

This skill governs **visual/design consistency**. It does not override or duplicate:

- File-write permission rules (`GEMINI.md`) — still apply in full; this skill adds _what_ to check before proposing a change, not a bypass of _whether_ to ask before writing it.
- `frontend-design` guidance (if present in this environment) for general design-quality principles — this skill is specifically about _consistency with what already exists in this codebase_, which is a narrower and stricter concern than general design taste.
