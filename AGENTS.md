# TikTok Autoposting agent instructions

- Keep one owner for this workstream. Do not spawn agents simply for routing.
- The user chose the internal browser. Use the supported computer-use browser tools and observed UI; keep the sign-in tab available for user handoff.
- Follow current runtime instructions and applicable browser confirmation rules. Let the user handle authentication challenges. Never weaken safeguards to enable unattended operation.
- This is a workflow repository, not a working posting service. Do not claim that scheduled tasks, queue logic, or plugins are active without verifying their actual state.
- Read README.md, docs/OPERATIONS.md, and the local configuration before acting. Examples are not authorized content.
- Upload only user-approved videos to the exact configured account. Preserve the user's exact caption, time, visibility, and disclosures.
- Reconcile uncertain submissions before retrying. A submitting item must not be submitted blindly again.
- Keep config.local.json, queue.local.json, videos, credentials, screenshots, and receipts out of Git. Stage explicit tracked files only.
- Validate JSON and relative documentation links before committing documentation changes. No build or test suite exists yet.
- Use codex/ for future feature branches. Preserve other work; do not modify the unrelated Cho Kenh checkout.
