# Operations

## First-post acceptance

1. Confirm the user is signed in to the expected account in the internal browser. Verify its handle in the UI, not just the local configuration.
2. Obtain real video/photo assets, caption, publish-now or date/time instruction with timezone, visibility, location, interaction settings and disclosures. Verify user authorization for this account.
3. Verify the local file exists, calculate its SHA-256, and confirm that the browser's supported file chooser can access it. If the internal browser cannot access the local path, report that boundary and ask the user to select the file. Do not copy it to a third-party hosting service.
4. Verify scheduling is available in the current account and inspect the actual allowed date range. Confirm TikTok's displayed timezone. Do not switch account type or alter security settings to make it work.
5. Check TikTok's scheduled/published items for a matching prior receipt, file/caption, account, and target time before any upload. Reconcile any item already marked `submitting` or `needs_review` first.
6. Upload through the observed UI. Wait for processing. Set only the specified caption, cover if supplied, audience, interactions, disclosures, and schedule.
7. Review the full form. Follow applicable confirmation requirements at the consequential action; do not invent additional approvals where authorization is already sufficient.
8. Record `submitting` in the local queue immediately before final submission. Click Schedule once.
9. Verify the item appears in TikTok's scheduled-content list with the correct account and time. Save a local screenshot and receipt with queue ID, file hash, exact caption, requested timestamp, displayed timezone/time, verification time, and TikTok item ID/URL if exposed. Mark `scheduled` only after this evidence exists.
10. Confirm the scheduled item later becomes published before marking `published`. A scheduled receipt alone does not prove publication.

## Enable recurring preparation

Only after the first-post test passes, choose preparation times and the maximum batch size with the user. Preparation runs should happen before publication, within the actual native scheduling window. Keep later items pending until eligible.

Use the app's scheduled-task tool to create a task returning to the existing chat, using `automation/PROMPT.md` and the absolute repository location. Choose the user's requested cadence; do not assume daily posting. Test an actual background run before calling the workflow unattended-ready. A prompt file by itself does not create an automation.

Keep the computer on, the desktop app running, and the project accessible for local runs. If browser access, uploads, login, or required confirmation is unavailable in a background run, stop and request the necessary user action. Do not substitute a different browser or export cookies silently.

## Queue and recovery

| State | Meaning | Next action |
| --- | --- | --- |
| pending | Not yet submitted | Process only when approved and eligible |
| submitting | Submission about to occur or result uncertain | Reconcile in TikTok before any retry |
| scheduled | Verified in TikTok's scheduled list | Check publication later |
| published | Verified live | Record URL if available; do not resubmit |
| under_review | TikTok accepted immediate submission but moderation is pending | Record platform ID; check later, never re-upload blindly |
| needs_review | Account, settings, or outcome unclear | Ask user; preserve evidence |
| failed | Confirmed failure with no accepted post | Record cause; resolve before retry |

Run only one preparation owner at a time. Do not start a second run while a first run may still be submitting. These conventions do not provide software-enforced locking or exactly-once delivery.

For expired login or CAPTCHA, hand off to the user. For unsupported dates, keep the item pending. For rate limits or upload failures, record the displayed error and avoid repeated retries. For a timeout after Schedule, inspect TikTok before deciding whether it failed.

Do not publish an expired slot automatically. For the authorized20/day workflow, replan only unsubmitted items within the same Vietnam day; otherwise obtain a new time. Preserve the nine existing schedules. Studio disables commercial edit/Delete and requires the TikTok app; do not bypass its controls or duplicate existing posts to change music. See [daily operations](DAILY_OPERATIONS.md).
