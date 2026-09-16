---
name: git-branch-and-push
description: >-
  Interactive Git workflow for creating meaningful branches, authoring Husky/Bracket-format
  commit messages ([TYPE](scope): message), running a mandatory code review before publishing,
  and pushing to GitHub with mandatory user confirmation at every critical step.
---
# Git Branch and Push Workflow

This skill guides the agent through an **interactive, human-in-the-loop Git workflow**. It ensures branch names are meaningful, commit messages strictly adhere to the project's Husky `commit-msg` hook format (`[TYPE](scope): description`), changes are reviewed before publishing, and **no destructive or remote Git actions occur without explicit user permission**.

---

## Mandatory Human-in-the-Loop Rules

You must **NEVER** run branch creation, commits, code review, or pushes autonomously in the background. You **MUST** stop and ask the user for confirmation at each of the 4 checkpoints:

1. **Checkpoint 1 — Branch Creation Permission:**
   - Propose a semantic branch name based on the changes.
   - **Ask the user for permission** to create/checkout the branch with that specific name before running `git checkout -b <branch>`.
2. **Checkpoint 2 — Commit Message & Staging Permission:**
   - Present the staged files and the formatted Husky commit message (`[TYPE](scope): description`).
   - **Ask the user for confirmation** before running `git commit`.
3. **Checkpoint 3 — Mandatory Code Review Before Publish:**
   - Before any push can happen, the committed diff **must** be reviewed via the `code-reviewer` skill.
   - Present the review verdict to the user. If `NEEDS REWORK`, the user must explicitly acknowledge pushing anyway or choose to fix issues first.
4. **Checkpoint 4 — Publish / Push Permission:**
   - Inform the user that the branch has been reviewed and is ready to be published to GitHub.
   - **Ask the user for permission** before running `git push -u origin <branch>`.

**Push is never permitted to run before Checkpoint 3 has completed.** There are no exceptions to this ordering, even if the user asks to "just push" — in that case, run the review first, show the result, then proceed to Checkpoint 4.

---

## Step-by-Step Execution Protocol

### Step 1: Analyze Changes & State

1. Run `git status` and `git diff --stat` to understand all modified and untracked files.
2. Determine:
   - Primary **Type**: `FEAT`, `FIX`, `DOCS`, `STYLE`, `REFACTOR`, `PERF`, `TEST`, `BUILD`, `CI`, `CHORE`, `REVERT`, `DEPS`.
   - Primary **Scope**: `web`, `api`, `auth-svc`, `worker-svc`, `ui`, `types`, `hooks`, `mock-db`, `db`, `config`, `root`, `docs`, etc.
   - Concise **Summary**: What was actually accomplished.

---

### Step 2: Propose Branch Name & Request Permission (Checkpoint 1)

1. Formulate a semantic branch name using the standard prefix:
   - `feat/<short-name>`: New feature or capability
   - `fix/<short-name>`: Bug fix
   - `docs/<short-name>`: Documentation additions/updates
   - `refactor/<short-name>`: Code refactoring
   - `chore/<short-name>`: Dependencies, configs, maintenance
   - `perf/<short-name>`: Performance enhancements
2. **STOP AND ASK THE USER:**
   - Present the proposed branch name (e.g. `feat/board-virtualization` or `docs/architecture-hub`).
   - Ask: *"Would you like me to create and switch to branch `<branch-name>`, or would you prefer a different name?"*
   - **Wait for user confirmation** before executing `git checkout -b <approved-branch-name>`.

---

### Step 3: Stage Files & Format Commit Message (Checkpoint 2)

1. Run `git add <files>` (or `git add -A`).
2. Compose the commit message strictly according to the Husky hook format:

```text
[TYPE](scope): <imperative mood summary>
```

#### Valid Types (Must be UPPERCASE):

`FEAT`, `FIX`, `DOCS`, `STYLE`, `REFACTOR`, `PERF`, `TEST`, `BUILD`, `CI`, `CHORE`, `REVERT`, `DEPS`

#### Valid Scopes:

* Apps: `(web)`, `(api)`, `(admin)`, `(service-desk)`
* Microservices: `(auth-svc)`, `(notify-svc)`, `(worker-svc)`, `(realtime-svc)`
* Packages: `(ui)`, `(types)`, `(hooks)`, `(mock-db)`, `(db)`, `(config)`
* Monorepo Global: `(root)`, `(docs)`, `(ci)`, `(deps)`, `(infra)`, `(security)`

3. **STOP AND ASK THE USER:**
   - Display the exact list of staged files and the proposed commit message.
   - Ask: *"Please confirm if you want to commit these changes with message: `[TYPE](scope): <summary>`"*
   - **Wait for user confirmation** before executing `git commit -m "..."`.

---

### Step 4: Mandatory Code Review (Checkpoint 3)

1. Check whether the `code-reviewer` skill has already been run against this exact commit/diff earlier in the session.
   - If yes, ask the user: *"This diff was already reviewed earlier — would you like me to re-run the review, or use the existing result?"*
   - If no, proceed to invoke it automatically — this step is not optional and does not require a separate user request to trigger.
2. Invoke the `code-reviewer` skill against the committed changes on this branch (compare against the base branch, e.g. `git diff <base>..HEAD`).
3. Present the full review output (Summary, Critical, Improvements, Nitpicks, Verdict) to the user.
4. Branch on the verdict:
   - **APPROVE** → proceed directly to Checkpoint 4.
   - **APPROVE WITH CHANGES** → ask the user: *"The review suggests non-critical improvements. Proceed to push as-is, or address these first?"*
   - **NEEDS REWORK** → explicitly warn the user: *"The review found critical issues. I do not recommend pushing until these are addressed."* Require an explicit, unambiguous confirmation (e.g. "push anyway") before allowing Checkpoint 4 to proceed. Do not treat silence or an unrelated reply as confirmation.

---

### Step 5: Publish & Push to Remote (Checkpoint 4)

1. **STOP AND ASK THE USER:**
   - Summarize: branch name, commit message, and the review verdict from Checkpoint 3.
   - Ask: *"Are you ready for me to push and publish branch `<branch-name>` to `origin`?"*
   - **Wait for user confirmation** before executing `git push -u origin <branch-name>`.
2. If the push fails due to GitHub permissions or authentication (e.g. 403 Forbidden), provide clear instructions on switching accounts, SSH keys, or Personal Access Tokens (PAT).
