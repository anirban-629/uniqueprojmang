
---
name: post-pr
description: >-
  Orchestrator skill for post-PR follow-up. Triggers on "check my PR", "what's the status of my PR",
  "check PR #<n>", "is my PR merged", or similar. Checks whether the PR is merged and routes to
  pr-merge-sync (if merged) or pr-status-review (if not merged).
---
# Post-PR Orchestrator

Use this skill when asked to check on a previously raised PR's status and act on it — as opposed to `raise-pr`, which creates a new one.

## Trigger Conditions

- *"Check my PR"*, *"check PR #<n></n>"*, *"is my PR merged"*, *"what's happening with my PR"*, *"follow up on the PR"*.
- Also trigger automatically as a natural follow-up if the user asks this shortly after using `raise-pr` in the same session, without requiring them to re-specify the PR number.

## Step 1: Identify the PR

1. If a PR number was given, use it directly.
2. Otherwise, detect it from the current branch:
   ```bash
   gh pr list --head "$(git branch --show-current)" --json number,url,title,state,isDraft
   ```
3. If no PR is found for the current branch and none was specified, ask the user which PR they mean (by number or by branch name) — do not guess.

## Step 2: Check Merge Status

```bash
gh pr view <pr-number> --json state,mergedAt,mergeStateStatus,baseRefName,title,url
```

- **`state == "MERGED"`** → hand off to **`pr-merge-sync`** (pass the PR's `baseRefName` and number).
- **`state == "OPEN"`** or **`"CLOSED"` without merge** → hand off to **`pr-status-review`** (pass the PR number).

Do not duplicate either sub-skill's logic here — this skill's only job is identifying the PR and its merge state, then routing. Keep this orchestrator thin so the two outcomes stay independently maintainable.

## Step 3: Route

Explicitly state which path is being taken before proceeding, e.g.: *"PR #42 has been merged — checking with you before syncing your local branch."* or *"PR #42 is still open — let me pull the latest details and comments."* Then invoke the corresponding skill (`pr-merge-sync` or `pr-status-review`).
