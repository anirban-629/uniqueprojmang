# PR Status Review

Invoked after `post-pr` confirms a given PR's `state != "MERGED"` (still open, or closed without merging). Expects a PR number already identified.

## Step 1: Gather PR Details

```bash
gh pr view <pr-number> --json title,body,state,isDraft,reviewDecision,statusCheckRollup,url,mergeStateStatus
```

Summarize for the user:

- Title, current state (open/draft/closed-unmerged), and URL.
- **Review decision** (approved / changes requested / review required / none yet).
- **Status checks** (CI passing/failing/pending) — call out failures specifically, since these often block merge regardless of review state.
- **Merge state** (e.g., blocked by required checks, has conflicts with base branch) — flag conflicts prominently, since that's actionable and often the actual blocker.

## Step 2: Fetch and Show Latest Comments

```bash
gh pr view <pr-number> --comments
```

and, separately, inline code review comments:

```bash
gh api repos/{owner}/{repo}/pulls/<pr-number>/comments --jq '.[] | {author: .user.login, path: .path, line: .line, body: .body, created_at: .created_at}'
```

- Present the **most recent comments first**, summarized concisely — don't dump raw JSON at the user. Group inline code comments by file if there are several.
- If there are no comments yet, say so plainly rather than presenting an empty section.
- If comments request specific changes, list them as a clear bulleted set — this becomes the basis for Step 3's options if the user wants to act on them.

## Step 3: Ask the User What They Want to Do

Do not assume. Present the choice explicitly:

> *"PR #<n> is still open. Here's where it stands: [summary from Step 1] and here's the latest feedback: [summary from Step 2].*
>
> *Would you like me to:*
> *1. Continue development / make further changes now,*
> *2. Put together an improvement plan based on the feedback above (without making changes yet), or*
> *3. Hold off for now?"*

## Step 4: Act Only on the Explicit Choice

- **"Continue development"** → ask what specifically to work on if not obvious from the feedback (e.g., "should I address all the review comments, or focus on the failing checks first?"), then proceed under the project's standard file-change permission rules (per `GEMINI.md` — show the diff, ask before writing). This skill does not bypass those rules; it only gets you to the point of knowing what to work on.
- **"Improvement plan"** → produce a written plan (in chat, not a file, unless the user asks to save it) mapping each piece of feedback to a proposed fix/approach, without making any code changes yet. End by asking if they'd like to proceed with any of the plan's items now or hold.
- **"Hold for now"** → acknowledge and stop. Do not schedule a follow-up or silently revisit this later — if the user wants another check, they'll ask (likely via `post-pr` again).

## Notes

- If `reviewDecision` is "CHANGES_REQUESTED", lead with that in Step 3's summary — it's usually the most actionable signal and shouldn't be buried under CI status or comment counts.
- If status checks are failing, mention whether the failure looks fixable from the PR alone (e.g., lint/type errors visible in the log) or needs more investigation — but don't start investigating uninvited; that's covered by the user's Step 3 choice.
