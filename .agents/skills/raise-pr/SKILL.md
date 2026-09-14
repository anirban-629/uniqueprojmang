---
name: raise-pr
description: >-
  Interactive skill dedicated to raising Pull Requests to master. Formulates professional PR titles,
  detailed summaries, component change breakdowns, and comprehensive test strategies with mandatory user confirmation.
---

# Pull Request Creation Workflow (Target: `master`)

Use this skill when asked to *"raise a PR"*, *"create a pull request"*, *"open a PR to master"*, or *"submit these changes for review"*.

---

## Scope & Rules

1. **Target Base Branch:** Always target **`master`** as the base branch.
2. **Interactive Approval:** Always present the generated PR title, body, and test strategy to the user for confirmation before raising the PR.
3. **No Emojis:** Do not include emojis in generated PR titles or descriptions. Use clean, professional rich-text Markdown formatting.
4. **High-Quality PR Standards:** Every PR must include:
   - Clear context & problem statement.
   - Grouped bullet points of changes by workspace package/app.
   - Concrete test strategy (automated test results + manual testing steps).
   - Verification checklist.

---

## Step-by-Step Procedure

### Step 1: Pre-Flight Branch & Diff Inspection
1. Check the current branch:
   ```bash
   git branch --show-current
   ```
   *If on `master`, stop and notify the user that a PR cannot be created from `master` to `master`.*
2. Ensure all local changes are committed and pushed to `origin`:
   ```bash
   git status
   git log master..HEAD --oneline
   ```
3. Inspect the full diff between `master` and the current branch:
   ```bash
   git diff master..HEAD --stat
   ```

---

### Step 2: Formulate PR Title & Body

Draft the PR content using the standardized template (strictly without emojis):

#### 1. Title Format
`[TYPE](scope): Clear and concise title of the PR`

#### 2. Body Template
```markdown
## Summary & Context
<!-- Provide a 2-4 sentence overview of what this PR accomplishes and why it is needed. -->

## Key Changes
<!-- Group changes by application, package, or domain -->
### `apps/web` (or other app)
- Change item 1
- Change item 2

### `packages/*`
- Change item 1

### Documentation & Config
- Change item 1

## Test Strategy & Verification
### Automated Tests & Checks
- [x] `npm run check-types` passed (0 errors across monorepo)
- [x] Husky pre-commit and commit-msg hooks validated
- [ ] Automated tests (`npm test` if configured)

### Manual Verification Steps
1. Step-by-step instructions for reviewer to test locally:
   - Run `npm run dev`
   - Navigate to `http://localhost:3000/...`
   - Verify specific UI/API behavior.

## Review Checklist
- [x] Follows monorepo code conventions and Husky commit guidelines
- [x] Architectural documentation / ADR updated (if applicable)
- [x] No breaking API changes without backward compatibility
- [x] No exposed secrets or hardcoded tokens
```

---

### Step 3: Present for User Confirmation (Checkpoint)
1. **STOP AND ASK THE USER:**
   - Display the proposed PR Title, Base Branch (`master`), Head Branch (`<current-branch>`), and complete PR description.
   - Ask: *"Would you like me to raise this Pull Request to `master` with the above description and test strategy?"*
   - Wait for user confirmation or adjustments.

---

### Step 4: Execute PR Creation
1. Create the PR via GitHub CLI:
   ```bash
   gh pr create --base master --head <current-branch> --title "<title>" --body "<body_content>"
   ```
2. Return the resulting GitHub Pull Request URL directly in the chat.
