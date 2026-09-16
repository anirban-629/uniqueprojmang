# PR Merge Sync

Invoked after `post-pr` confirms a given PR's `state == "MERGED"`. Do not trigger this directly from user phrasing alone — it expects a PR number and base branch already identified.

## Mandatory Human-in-the-Loop Rule

Never run `git checkout` or `git pull` as part of this skill without an explicit go-ahead. This is a state-changing action (switches your working branch) even though it feels like routine cleanup — it still requires permission per the project's standing guardrails (see `GEMINI.md`).

## Step 1: Confirm and Ask Permission

State clearly what merged and what you're proposing to do:

> *"PR #<n> (\"\") was merged into `<base-branch>`. Would you like me to:*
> *1. Switch your local branch to `<base-branch>`, and*
> *2. Pull the latest changes (including this merge)?"*

Wait for explicit confirmation. If declined, stop here — do not perform any git action, and do not ask again unless the user brings it up later.

## Step 2: Check for Local Uncommitted Changes First

Before switching branches, always check:

```bash
git status --porcelain
```

- If there are uncommitted changes on the current branch, **stop and warn the user** — switching branches with uncommitted changes can carry them over unexpectedly or block the checkout entirely. Ask whether they want to stash, commit, or discard those changes first. Do not decide this for them.
- Only proceed to Step 3 once the working tree is clean or the user has explicitly told you how to handle the pending changes.

## Step 3: Switch and Pull (only after confirmation from Step 1 and a clean tree from Step 2)

```bash
git checkout <base-branch>
git pull origin <base-branch>
```

Report the result: confirm the branch is now on `<base-branch>` and show the latest commit (`git log -1 --oneline`) so the user can see the merge landed.

## Step 4: Offer Cleanup (ask, don't assume)

If the merged PR's source branch still exists locally, ask:

> *"The branch `<merged-branch-name>` has now been merged and is no longer needed locally. Would you like me to delete it? (`git branch -d <merged-branch-name>`)"*

Only run the delete command if explicitly confirmed. If the remote already auto-deleted the branch (per the repo's "automatically delete head branches" setting), mention that the remote copy is already gone and this would just clean up the local reference.

## Step 5: Ask What's Next

Once synced, ask a simple open question rather than assuming continuation:

> *"You're synced up on `<base-branch>` with the latest merge. Want to start something new, or is there something specific you'd like to work on next?"*

Do not automatically start a new branch or task — this skill's job ends at "you are now up to date."
