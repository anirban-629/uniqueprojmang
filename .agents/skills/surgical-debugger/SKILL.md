
---
name: surgical-debugger
description: Diagnoses bugs, performs root-cause analysis, and asks for explicit confirmation with the proposed diff before modifying any files.
triggers:
  - bug
  - error
  - fix
  - issue
  - regression
---
# Surgical Bug Triage & Permission-Gated Patching

## Execution Directives

### 1. Ingestion & Ambiguity Check

- Read the reported defect, stack trace, and reproduction steps.
- **Context Missing?** If the error location cannot be deduced:
  - Inspect the codebase first using read-only tools (`grep`, file search, view).
  - If critical business logic or reproduction parameters are still missing, ask **up to 3 concise diagnostic questions** and halt.
- **Context Clear?** Proceed to diagnosis.

### 2. Diagnosis & Blast-Radius Mapping (Read-Only Phase)

Before proposing or applying any edits:

1. **Isolate Root Cause:** Pinpoint the exact line, state, or condition causing the failure.
2. **Blast Radius Analysis:** Map caller functions, shared state, and downstream dependencies to guarantee unaffected business modules will not regress.
3. **Formulate Minimal Viable Patch:** Design the smallest possible diff that resolves the bug while keeping existing function signatures and core business logic untouched.

### 3. Confirmation Gate (MANDATORY HALT)

**STRICT RULE:** You MUST NOT edit, write, or touch any files yet.

Present your findings to the user using the template below, explain the intended fix, and explicitly ask for confirmation to proceed. Wait for the user's approval before calling any file modification tools.

---

## Response Output Schema (Prior to User Confirmation)

Output this structure when presenting the diagnosis:

### 1. Identified Root Cause

- **File & Location:** `path/to/file.ext:line_number`
- **Trigger:** The exact input/state triggering the breakdown.
- **Mechanism:** Why the logic fails at runtime.

### 2. Blast Radius & Core Logic Protection

- **Dependent Modules Checked:** Components/callers verified during analysis.
- **Integrity Guard:** How the patch isolates the fix so core business functionality remains unharmed.

### 3. Proposed Surgical Changes

Present the exact diff or snippet intended for modification:

```diff
- // lines to remove
+ // lines to add
```
