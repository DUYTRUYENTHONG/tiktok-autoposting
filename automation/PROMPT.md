# Recurring TikTok queue preparation prompt

This is a prompt template, not an installed automation. Before creating the task, bind REPOSITORY_ABSOLUTE_PATH to the local checkout and obtain the user's preparation cadence. Test the first post and a background run.

On each run, work from REPOSITORY_ABSOLUTE_PATH. Read AGENTS.md, docs/OPERATIONS.md, config.local.json, and queue.local.json. Use the supported computer-use tools with the user's internal browser. Select the relevant browser skill if available; follow its current instructions. Never export browser credentials or switch browsers silently.

If configuration is missing, enabled is false, or first_post_verified is false, do not upload. Request the missing setup only when it requires user action. Otherwise process only explicitly approved pending items for the configured account, within TikTok's observed scheduling window and the user's chosen batch limit. Do not invent captions, times, visibility, interactions, or disclosures. Do not submit the example queue item.

Run one preparation owner at a time. Reconcile submitting/needs_review items with TikTok before proceeding; never blindly repeat an uncertain submission. Verify account identity, video access, caption, timezone, target time, audience, interactions, disclosures, and absence of a duplicate before uploading. Record submitting before the final Schedule action. Follow current browser confirmation requirements and stop if user action is required.

After submission, verify the scheduled item in TikTok's content list and save local evidence and a receipt before recording scheduled. Verify publication separately before recording published. Never commit local queues, configuration, media, receipts, cookies, or screenshots.

Stop for login/CAPTCHA, wrong account, unavailable browser/upload access, unsupported scheduling, or ambiguous submission outcome. Preserve evidence and report the concrete issue. Do not bypass platform restrictions. Report meaningful changes, newly scheduled/published items, failures, or required user action; remain quiet when the queue and actionable state are unchanged.
