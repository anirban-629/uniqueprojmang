---
name: code-reviewer
description: >-
  Automated and interactive code review skill. Triggers when the user asks to "review my changes,"
  "review this code," "review PR #<number>," or requests a code quality and security evaluation.
---

# Code Reviewer Skill

Perform a thorough, actionable, and multi-dimensional code review on local changes or pull requests.

---

## Trigger Conditions
Activate this skill when:
- The user requests: *"review my changes"*, *"review this code"*, *"review diff"*, *"audit these files"*.
- The user specifies a PR: *"review PR #<number>"*, *"review PR <URL>"*.
- A pre-merge or pre-commit code quality sanity check is requested.

---

## Review Workflow

### 1. Detect Review Target
- **Pull Request (PR # / URL):**
  - If a PR number or URL is provided, fetch and inspect the PR diff:
    ```bash
    gh pr diff <pr-number>
    # or checkout the PR branch if deep file inspection is needed:
    gh pr checkout <pr-number>
    ```
- **Local Changes:**
  - Check both staged and unstaged modifications:
    ```bash
    git status
    git diff
    git diff --staged
    ```

### 2. Optional Test / Lint / Build Verification
- If changes are substantial or touch core architecture, **ask the user before running tests/lints**:
  > *"The changes are substantial. Would you like me to run the project's type check, linter, or tests (`npm run check-types` / `npm test`) before completing the review?"*
- Run verification only upon explicit approval.

### 3. Multi-Pillar Analysis
Evaluate the diff across the following 6 core pillars:
1. **Correctness:** Logic errors, off-by-one errors, null/undefined hazards, unhandled edge cases, race conditions.
2. **Security:** Injection vulnerabilities, unvalidated inputs, authentication/tenant bypass, exposed secrets or credentials.
3. **Readability & Maintainability:** Clear naming, proper modularization, cognitive complexity, code duplication.
4. **Performance:** Inefficient loops, unnecessary re-renders/computations, unbounded queries, missing pagination or virtualization.
5. **Best Practices:** Idiomatic use of the language/framework (e.g. Next.js App Router Server vs Client components, TypeScript strict typing).
6. **Testability:** Missing test coverage, tightly coupled code, hard-to-mock dependencies.

---

## Feedback Structure

Always format the final review output following this exact structure:

### 1. Summary
*1–3 concise sentences summarizing what the diff accomplishes and the overall quality of the changes.*

### 2. Critical Issues (Must Fix)
*Blockers that cause bugs, security risks, memory leaks, or data corruption.*
- **File & Location:** `[file_path:line]`
- **Problem:** Clear explanation of the bug or risk.
- **Suggested Fix:** Concrete code snippet demonstrating the fix.

*(If none, state "None detected.")*

### 3. Improvements (Should Fix)
*Refactoring opportunities, edge case resilience, performance optimizations, or architectural alignment.*
- **File & Location:** `[file_path:line]`
- **Description & Recommendation:** Why and how to improve.

*(If none, state "None detected.")*

### 4. Nitpicks (Optional / Style)
*Minor formatting, naming suggestions, or comment clarity.*

*(If none, state "None detected.")*

### 5. Final Verdict
Select one:
- **`APPROVE`** — Code is production-ready.
- **`APPROVE WITH CHANGES`** — Non-critical improvements recommended before merge.
- **`NEEDS REWORK`** — Critical issues or security vulnerabilities must be resolved first.
