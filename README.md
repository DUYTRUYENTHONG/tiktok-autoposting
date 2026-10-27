# TikTok Autoposting

Schedule TikTok videos through computer use in the ChatGPT/Codex internal browser, with a local content queue and verified scheduling receipts.

**Status: setup prepared; posting is not active.** This repository contains an operating playbook, configuration templates, and a scheduled-task prompt. It does not contain a standalone posting service, installed custom skill, or running scheduler. Login, account eligibility, video access, captions, posting times, and an end-to-end test are still required.

## How it works

1. You sign in to TikTok Studio in the internal browser.
2. You provide the account handle, local videos, exact captions, visibility, disclosures, and publication times.
3. The agent uploads approved queue items through the visible TikTok Studio interface and selects TikTok's native scheduling option.
4. After submission, the agent verifies each scheduled item in TikTok and records a receipt locally.
5. Once accepted by TikTok, TikTok handles publication. A recurring local task can replenish the queue after its browser/file access has been tested.

Scheduling an upload and publishing a video are separate events. A successful upload alone is not proof of either.

## Initial setup

1. Open [TikTok Studio](https://www.tiktok.com/tiktokstudio/upload) in the internal browser and sign in yourself.
2. Copy `config.example.json` to `config.local.json`. Fill in the account, absolute video folder, publication times, audience, and disclosure instructions. Keep `enabled` false until the first test succeeds.
3. Copy `queue.example.json` to `queue.local.json`. Replace the example with real items. Use explicit ISO 8601 dates with UTC offsets. Set `approved` true only for content you authorize for the named account.
4. Ask the agent to run [the first-post checklist](docs/OPERATIONS.md). Confirm that the browser can access the selected local video; local filesystem access does not establish browser upload access.
5. Verify the first scheduled item in TikTok, then activate a recurring task at your chosen preparation times using [the saved prompt](automation/PROMPT.md).

The timezone proposal is **Asia/Bangkok (UTC+7)**. Confirm the timezone shown by TikTok before scheduling. Templates deliberately contain no real account or publishable video.

## Scheduling choices

| Route | Role | Current status |
| --- | --- | --- |
| Internal browser + TikTok native scheduler | Primary computer-use workflow | Login page opened; eligibility and upload not tested |
| Local recurring task | Refill TikTok's scheduled queue | Prompt prepared; no automation created or activated |
| Metricool plugin | Optional managed scheduling integration | Found in plugin directory; not connected or tested |
| Custom TikTok Direct Post API | Separate developer integration | Not implemented; unsuitable for this private utility under current guidelines |

TikTok's published scheduler guide describes a 15-minute to 10-day scheduling window and a computer-based timezone default. Its account eligibility wording is inconsistent between creators and Business Accounts, so verify the actual signed-in UI. If scheduling is unavailable, report it; do not change account type automatically. [Official guide](https://ads.tiktok.com/business/en/blog/introducing-video-scheduler-now-you-can-plan-tiktoks-in-advance).

Local scheduled tasks require the computer on, the desktop app running, and the project accessible. Browser sign-in persistence, unattended browser availability, and local upload access must be tested before relying on automatic refills. [Official scheduled-task documentation](https://learn.chatgpt.com/docs/automations).

## Repository contents

- `config.example.json`: account and schedule configuration template.
- `queue.example.json`: one illustrative queue item; do not submit it.
- `automation/PROMPT.md`: durable instructions for a future recurring task.
- `docs/OPERATIONS.md`: setup, verification, duplicate prevention, and recovery.
- `docs/TOOLING_REVIEW.md`: skills, agent roles, plugin findings, and route decision.
- `AGENTS.md`: instructions for future agents working in this repository.

## Content and state

Keep videos, actual queues, configuration, receipts, screenshots, browser profiles, cookies, and credentials outside Git. The included `.gitignore` excludes common local paths and media formats. Never export a browser login session into the repository.

The queue workflow uses `pending`, `submitting`, `scheduled`, `published`, `needs_review`, and `failed`. These are operating conventions for the agent, not an implemented queue engine. Record `submitting` before clicking Schedule. If the outcome is uncertain, reconcile against TikTok before retrying; mark `needs_review` when it cannot be established.

## Next information needed

Account handle; video folder and first video; exact caption/hashtags; posting dates or recurrence; timezone; audience; interaction settings; commercial/AI disclosures where applicable. No posting cadence has been chosen on your behalf.

Reviewed on 2026-10-27. See [the tooling review](docs/TOOLING_REVIEW.md) for sources and verification limits.
