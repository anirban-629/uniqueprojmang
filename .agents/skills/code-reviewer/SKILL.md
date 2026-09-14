
---
name: code-reviewer
description: >-
  Strict, token-efficient code review skill. Triggers on: "review my changes",
  "review this code", "review diff", "review PR #<n>", "audit these files".
---
# Code Reviewer

Review code changes. Be terse. No preamble, no restating the diff, no praise padding.

## Scope

1. **Target detection**
   - PR given (number/URL) → `gh pr diff <n>` (checkout only if inspection requires it)
   - No PR given → `git diff` + `git diff --staged`
2. **Exclude by default**: lock files, `dist/`, `build/`, `.next/`, generated/proto files, vendored code, unchanged lines in modified files.
3. **Large diff (>500 lines changed)**: review only high-risk files first (auth, input handling, DB/queries, payment, core logic). State this limitation in Summary — do not silently skip.
4. **Conventions**: if GEMINI.md / CONTRIBUTING.md / lint config exists, defer to it over generic style opinions. Never flag anything already enforced by a linter/formatter.
5. **Substantial changes**: ask once before running tests/lint/build. No repeated asks.

## Analysis Pillars (fixed order, no skipping)

1. Correctness — bugs, edge cases, null/race conditions
2. Security — injection, unvalidated input, auth bypass, secrets
3. Maintainability — naming, duplication, complexity
4. Performance — inefficient loops/queries, missing pagination
5. Best practices — idiomatic framework/language use per project conventions
6. Testability — coverage gaps, hard-to-mock coupling

Skip a pillar only if genuinely inapplicable — state "N/A" once, don't explain why.

## Output Format (strict — no deviation, no extra sections)

```
### Summary
1-2 sentences. What changed + overall verdict signal. No praise unless load-bearing to the verdict.

### Critical (must fix)
- file:line — problem — fix (code only if non-obvious)
[or: "None."]

### Improvements (should fix)
- file:line — issue — recommendation
[or: "None."]

### Nitpicks
- file:line — note
[or: "None."]

### Verdict
APPROVE | APPROVE WITH CHANGES | NEEDS REWORK
```

## Rules

- One bullet per issue. No sub-explanations unless the fix is non-obvious.
- No restating correct code. No "good job" commentary. No summarizing what the diff does beyond the one-line Summary.
- Never quote large code blocks — reference `file:line` only; include a fix snippet only when critical and non-trivial.
- Do not post to PR/comment unless user explicitly confirms after the review is shown.
- If diff is empty or no target found, state that in one line and stop — do not ask clarifying questions unless target is truly ambiguous (e.g. both staged and unstaged exist and command is ambiguous — then ask once).
