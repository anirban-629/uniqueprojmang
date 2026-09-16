
---
name: raise-pr
description: >-
  Interactive skill dedicated to raising Pull Requests. Detects the correct base branch,
  formulates professional PR titles and summaries, verifies checklist claims before marking
  them complete, and requires mandatory user confirmation before creating the PR.
---
# Pull Request Creation Workflow

Use this skill when asked to *"raise a PR"*, *"create a pull request"*, *"open a PR"*, or *"submit these changes for review"*.

---

## Scope & Rules

1. **Base Branch Detection:** Never hardcode `master`. Detect the repo's actual default branch:

   ```bash
   gh repo view --json defaultBranchRef --jq .defaultBranchRef.name
   ```

   Fall back to checking for `main` then `master` locally only if the above command fails (e.g., no `gh` auth).
2. **Interactive Approval:** Always present the generated PR title, body, and test strategy to the user for confirmation before raising the PR.
3. **No Emojis:** Do not include emojis in generated PR titles or descriptions. Use clean, professional Markdown formatting.
4. **No Fabricated Checkmarks:** Never mark a checklist item `[x]` unless the corresponding command was actually run in this session and passed. Unverified or skipped items must be shown as `[ ]` with a note (e.g., `(not run)`), never asserted as done.
5. **Respect Existing Templates:** If `.github/PULL_REQUEST_TEMPLATE.md` (or `.gitlab/merge_request_templates/`) exists in the repo, use its structure instead of the default template below.
6. **High-Quality PR Standards (default template only):** Every PR must include:

   - Clear context & problem statement.
   - Grouped bullet points of changes by workspace package/app.
   - Concrete test strategy (actual automated results + manual testing steps).
   - Verification checklist reflecting only what was actually checked.
7. **Cross-Check Branch & Staging State Against `git-branch-and-push`:** Before doing anything else, consult the conventions defined in the `git-branch-and-push` skill to verify the current state is actually PR-ready:

   - Confirm the current branch is a proper feature/fix branch created per that skill's naming convention (`feat/...`, `fix/...`, `docs/...`, etc.) — **not** `main`/`master` itself.
   - Confirm all intended changes are actually committed (not merely staged or sitting as uncommitted edits) — a PR should reflect committed history, not a dirty working tree.
   - If the current state doesn't match what `git-branch-and-push` would consider "ready" (e.g., still on the base branch, or there are uncommitted/unstaged changes), **stop and tell the user**, pointing them to run through `git-branch-and-push` first rather than proceeding with a PR against an incomplete or improperly-branched state. Do not silently fix this yourself (e.g., don't auto-commit or auto-branch) — that's `git-branch-and-push`'s job, with its own permission checkpoints, not this skill's.

---

## Step-by-Step Procedure

### Step 1: Pre-Flight Branch & Diff Inspection

1. Determine the base branch (see Rule 1 above).
2. Check the current branch:

   ```bash
   git branch --show-current
   ```

   *If the current branch equals the base branch, stop and notify the user that a PR cannot be created from the base branch to itself.*
3. Check for uncommitted changes:

   ```bash
   git status
   ```

   If there are uncommitted changes, ask the user whether to commit them before proceeding.
4. Inspect commits and diff relative to the base branch:

   ```bash
   git log <base>..HEAD --oneline
   git diff <base>..HEAD --stat
   ```
5. Check for an existing PR on this branch:

   ```bash
   gh pr list --head <current-branch> --json url,title,state
   ```

   If one exists and is open, ask the user whether to update it instead of creating a new one. If they confirm, skip to Step 4 using `gh pr edit` instead of `gh pr create`.

### Step 2: Run Verification Checks (only with user confirmation)

Ask once: *"Would you like me to run type-check/lint/tests/secret-scan before drafting the PR?"*

If confirmed, run whichever of these are configured in the repo, and record actual pass/fail:

```bash
npm run check-types   # or equivalent
npm run lint
npm test
gitleaks detect --no-banner   # or equivalent secret scanner, if available
```

Only checks that were actually run and passed may later be marked `[x]` in the PR body. Anything not run, skipped, or failed stays `[ ]` with a short note.

### Step 3: Formulate PR Title & Body

If a repo-specific PR template exists, populate that instead. Otherwise use:

#### Title Format

`[TYPE](scope): Clear and concise title of the PR`

#### Body Template

```markdown
## Summary & Context
<!-- 2-4 sentence overview of what this PR accomplishes and why. -->

## Key Changes
### `apps/web` (or other app)
- Change item 1
- Change item 2

### `packages/*`
- Change item 1

### Documentation & Config
- Change item 1

## Test Strategy & Verification
### Automated Checks
- [ ] Type check — <result or "(not run)">
- [ ] Lint — <result or "(not run)">
- [ ] Tests — <result or "(not run)">
- [ ] Secret scan — <result or "(not run)">

### Manual Verification Steps
1. Step-by-step instructions for the reviewer to test locally:
   - Run `npm run dev`
   - Navigate to `http://localhost:3000/...`
   - Verify specific UI/API behavior.

## Review Checklist
- [ ] Follows repo code conventions
- [ ] Architectural documentation / ADR updated (if applicable)
- [ ] No breaking API changes without backward compatibility
- [ ] No exposed secrets or hardcoded tokens (verified via scan, not assumed)
```

Only tick boxes that were actually verified in Step 2. Leave everything else unchecked.

---

### Step 4: Present for User Confirmation (Checkpoint)

**STOP AND ASK THE USER:**

- Display the proposed PR Title, Base Branch, Head Branch (`<current-branch>`), and complete PR description exactly as it will be submitted.
- Ask whether this should be a **draft PR** or ready for review.
- Ask: *"Would you like me to raise this Pull Request with the above description and test strategy?"*
- Wait for explicit confirmation or requested adjustments before proceeding.

---

### Step 5: Execute PR Creation

1. Push the branch if not already pushed:

   ```bash
   git push -u origin <current-branch>
   ```
2. Create the PR (add `--draft` if requested in Step 4):

   ```bash
   gh pr create --base <base-branch> --head <current-branch> --title "<title>" --body "<body_content>"
   ```
   Or, if updating an existing PR from Step 1:

   ```bash
   gh pr edit <pr-number> --title "<title>" --body "<body_content>"
   ```
3. Return the resulting GitHub Pull Request URL directly in the chat.
