---
name: git-branch-and-push
description: >-
  Interactive Git workflow for creating meaningful branches, authoring Husky/Bracket-format
  commit messages ([TYPE](scope): message), and pushing code to GitHub with mandatory user confirmation at every critical step.
---

# Git Branch and Push Workflow

Use this skill when preparing to create a new Git branch, stage changes, commit with Husky-compliant `[TYPE](scope): message` format, and push changes to GitHub.

---

## 🔒 Mandatory Human-in-the-Loop Rules

You must **NEVER** run branch creation, commits, or pushes silently. You must ask the user for confirmation and feedback before taking any major Git action:

1. **Ask before creating/switching branches:** Propose the branch name and get explicit user approval before executing `git checkout -b <branch>`.
2. **Ask before committing:** Present the formatted Husky-compliant commit message `[TYPE](scope): description`, list of staged files, and ask for confirmation.
3. **Ask before pushing to remote:** Confirm the target remote and branch name before executing `git push`.

---

## 📋 Step-by-Step Procedure

### Step 1: Inspect Repository State
1. Run `git status` and `git diff --stat` to review changed and untracked files.
2. Analyze the nature of the changes (feature, bugfix, documentation, refactor, chore, etc.).

### Step 2: Propose Branch Name & Ask for Confirmation
1. Generate a meaningful branch name following the naming pattern:
   - `feat/<short-description>`: For new features
   - `fix/<short-description>`: For bug fixes
   - `docs/<short-description>`: For documentation updates
   - `refactor/<short-description>`: For code restructuring
   - `chore/<short-description>`: For build, dependencies, or configuration changes
   - `perf/<short-description>`: For performance improvements
2. **Do NOT run git checkout yet.** Present the proposed branch name to the user and request confirmation or an alternate name.
3. Once approved by the user, run `git checkout -b <approved-branch-name>`.

### Step 3: Stage Changes
1. Stage the relevant files: `git add <files>` (or `git add -A` if all changes are intended).
2. Verify staged items with `git status`.

### Step 4: Author Husky-Compliant Commit Message
Commit messages **MUST** satisfy the project's Husky `commit-msg` hook format:

```text
[TYPE](scope): <short summary in imperative mood>

[optional body explaining context, changes, and rationale]

[optional footer(s) / issue references]
```

#### Allowed Types (Must be UPPERCASE):
* `FEAT`: A new feature
* `FIX`: A bug fix
* `DOCS`: Documentation only changes
* `STYLE`: Formatting, white-space, CSS polish
* `REFACTOR`: Code restructuring without behavioral change
* `PERF`: Performance optimizations
* `TEST`: Adding or correcting tests
* `BUILD`: Build system, bundlers, or toolchains
* `CI`: CI/CD pipelines and workflows
* `CHORE`: Routine tasks, configs, maintenance
* `REVERT`: Reverting a previous commit
* `DEPS`: Dependency upgrades or package changes

#### Standardized Monorepo Scopes:
* **Apps:** `(web)`, `(api)`, `(admin)`, `(service-desk)`
* **Microservices:** `(auth-svc)`, `(notify-svc)`, `(worker-svc)`, `(realtime-svc)`
* **Shared Packages:** `(ui)`, `(types)`, `(hooks)`, `(mock-db)`, `(db)`, `(config)`
* **Global / Infra:** `(root)`, `(docs)`, `(ci)`, `(deps)`, `(infra)`, `(security)`

#### Examples:
* `[FEAT](web): add board virtualization for 50k+ issues`
* `[FIX](api): handle nullable companyId in issue route handler`
* `[FEAT](auth-svc): implement JWT token rotation with Upstash Redis`
* `[CHORE](types): sync OpenAPI DTO definitions`
* `[DOCS](architecture): add system overview diagram and ADR-0001`
* `[CHORE](root): bump turbo version`

#### Present for Confirmation:
Present the exact commit message to the user for confirmation before executing `git commit`.

### Step 5: Push to Remote with Confirmation
1. Ask the user: *"Are you ready to push `<branch-name>` to `origin`?"*
2. Upon approval, run `git push -u origin <branch-name>`.
3. If remote authentication or permissions fail, provide clear diagnostic instructions (SSH vs PAT/HTTPS).
