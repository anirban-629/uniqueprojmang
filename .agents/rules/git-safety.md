# Git Safety Guardrails

## Never Chain Git Actions Automatically

Every git action is its own checkpoint requiring explicit user confirmation.

- **Committing does not imply pushing.** After a commit is made (with permission), STOP. Do not run `git push` unless separately asked and confirmed.
- **Pushing does not imply opening a PR.** After a push, STOP. Do not run `gh pr create` unless separately asked and confirmed.
- **Creating a branch does not imply committing to it.** Each git action — `checkout -b`, `add`, `commit`, `push`, `pr create`, `merge`, `rebase` — is its own checkpoint requiring its own explicit go-ahead.
- If the user says something like *"commit and push this"* in one message, that IS sufficient permission for both — but still narrate each step as you do it (*"Committing now... Pushing now..."*) rather than silently doing both and reporting after the fact. If the user says just *"commit this"*, do NOT push afterward — wait to be asked.
- Never run destructive git commands (`reset --hard`, `push --force`, `rebase`, `clean -fd`, branch deletion) without explicitly calling out that they're destructive/irreversible in your confirmation ask, even if the user's phrasing sounds casual about it.
