# Daily posting and lead attribution

Latest November1 scope: [mixed rollout](MIXED_ROLLOUT_NOVEMBER.md),30 five-image carousels and20 videos within50/day, November1–21,15-minute spacing and30-minute lead. Canonical campaign.rollingGoal supersedes older format/cadence examples below. Preserve accepted items. CapCut has a3-use free total allowance, not a daily entitlement; first scene settled0 credits and remains on visual hold for label distortion. Proposals, private drafts and generated scenes are not schedules or publications.

Latest customer-offer execution: conditional scheduled offers for November1–10 are authorized in call_297ccc4180d841f88c8587bfadf08034. All50allowances were confirmed available before scheduling; this is a dated attestation, not future availability. Check conditions and availability when callers contact the shop; captions must say “Gọi để kiểm tra ưu đãi còn áp dụng không và điều kiện nhận quà.” Read the latest TEN_DAY_CAROUSEL_CAMPAIGN section and canonical customer ledger. Older strict publication-time instructions below do not override this explicit decision for this campaign.

Latest October31 scope is [50native five-image carousels/day for November1–10](TEN_DAY_CAROUSEL_CAMPAIGN.md),15-minute spacing and varied suitable native music. The user approved keeping voice-over separate. Use canonical rollingGoal and its latest allocation; older20/day50-day/video-production paragraphs below are historical. The tested native-five-photo-v1 adapter preserves the source intent and binds title, exact ordered bytes and no-attached-voice contract. One new carousel is verified scheduled forNovember1at08:00GMT+7; count it only as scheduled. New captions require #duytruyenthong. Preserve all accepted content and use evergreen variants while the new50-customer promotion capacity is unverified.

Check `campaign.pendingAnimationReview` before uploading an animation. Its exact native-draft receipt identifies the current private review item and selected music. Reopen that draft after its edit/mix review; do not upload a duplicate, inherit a new audio approval or count a private draft toward daily publications/reservations. The approved narration remains unchanged. An elapsed source slot still needs an explicit checked revision before submission.

Latest October29 rule: internal post IDs and inquiry codes stay private. New public images, captions, narration and CTAs omit them, and progress updates describe the content in plain language. The call CTA remains “Gọi số điện thoại trong bio để được tư vấn”; ask for the cleaning need and material/surface. Earlier code-based examples below are historical schemas, not instructions to print codes. Keep existing accepted posts unchanged. Attribute calls only when evidence identifies a post; otherwise leave attribution unknown.

The current KPI is20 unique receipt-verified published posts per Asia/Ho_Chi_Minh day for50days, October31–December19,2026inclusive. This supersedes30/day for30days. Preserve the100-video priority and accepted reservations; use the existing format mix where those permit. The first100 remains a cumulative milestone. Scheduled and under-review posts reserve capacity but do not satisfy the publication KPI. See [50-day rollout](FIFTY_DAY_ROLLOUT.md).

Check `campaign.pendingNarrationReview` before preparing another voice batch. Its private manifest/hash binds the actual candidate WAVs, scripts, receipts and profiles. Keep unanswered or rejected takes unpublished and preserve their bytes. An exact user listening decision applies only to its bound audio; grammar review, an ASR preview, profile acceptance and a local time proposal do not grant that decision. Reconcile the pending batch before spending time synthesizing duplicate candidates.

The dated tracker target is stored as `campaign.dailyTargetSchedule` with fromDay/throughDay/target. `dailyKpi` applies it only within that authorized window; the existing `dailyTarget` remains the fallback for historical/outside-window reporting. A target update does not prepare, schedule or publish content. Check that the tracker HTTP service is actually running before describing its URL as live; a saved trackerUrl is not service-health evidence.

For the active1,000-post expansion, use the registered immutable500photo/500video plan and [scale progress workflow](SCALE_CAMPAIGN.md). Do not run the legacy daily planner to add extra rows on top of that plan. Preserve accepted reservations, use native five-minute slots, and bind actual reviewed media before submission. Discounts require verified current eligibility; unknown means evergreen/no-discount. The projected calendar extends beyond the current native window, so later posts remain unsubmitted until eligible.

Preserve the nine original schedules. Reconcile the browser submission journal before planning. `node scripts/configure-daily.mjs` prepares today's and tomorrow's remaining experimental slots, excluding existing reservations and uncertain outcomes. It does not upload. Review local plans at http://127.0.0.1:4318/review. If a slot expires, replan only unsubmitted items. Never repeat an uncertain submission.

The recurring follow-up uses **Sakura · 20 posts per day · 50 days**,05:30 preparation and22:30 publication review in Vietnam time, attached to the current chat. The maintained prompt is [automation/PROMPT.md](../automation/PROMPT.md); verify saved app configuration through the automation tool when changing it. Background publishing has not yet been verified. Keep Codex and the computer available; close task browser tabs after completed actions as requested. A saved campaign.trackerUrl does not establish a running service.

## Creative and lead measurement

Use the [native performance collection workflow](PERFORMANCE_COLLECTION.md) to collect watch time and completion from each post's actual Overview when available. The content table alone omits shares/saves/retention; missing fields are unknown. Keep retention summaries separate from measured three-second retention and import cumulative counters without adding repeated snapshots together.

[src/content-bank.mjs](../src/content-bank.mjs) contains28 original illustrative story hypotheses: after-work kitchen fatigue, shared chores, small rentals, surface compatibility, familiar cookware, footwear, bathroom spots, aging plastic, vehicle trim, washer exterior and offer clarity. These model creator storytelling structure; they are not real customer testimonials or proven Vietnamese organic winners. New image production must preserve the real product reference and be visually checked.

Each daily queue item has a unique leadCode, for example BẾP021. The CTA asks for a surface photo, material and stain type. A direct reply can also establish attribution. An inquiry becomes qualified only after an actual need and material/surface are observed. An order requires real order evidence. Do not create a lead because someone viewed or liked a post.

Starting with sakura-029, every new story requires a fresh reviewed cover. A library cover alone leaves it in needs_generation. After visually inspecting the final image, import a local JSON array of entries with id, absolute destination and visuallyVerified:true using `node scripts/register-covers.mjs <review-manifest.json>`. The importer hashes each image, checks product/story attribution and refuses changes to submitted or uncertain items. It preserves planned times and exports the remaining upload manifest. Replanning uses the stored creativeOverrides instead of replacing fresh covers with library images.

Import pseudonymous events with the existing command:

```powershell
npm run campaign -- import "C:\absolute\lead-observations.json"
```

Synthetic schema example, never import unchanged:

```json
{
  "leadEvents": [{
    "id": "local-random-inquiry-id",
    "postId": "VERIFIED_PUBLISHED_PLATFORM_ID",
    "firstSeenAt": "2026-10-28T10:10:00+07:00",
    "observedAt": "2026-10-28T10:15:00+07:00",
    "status": "qualified",
    "source": "Observed reply with post code and material/need"
  }]
}
```

Allowed statuses: inquiry, qualified, order. The post must already be registered as published. Event ID, post and firstSeenAt are immutable; a later observation can update its status. Repeated imports use the latest observation instead of adding another inquiry. Keep one event ID for the same buying inquiry across status changes. Do not store names, phone numbers, addresses, screenshots of private messages or full messages in the import. No events means unknown, not zero. Counts describe recorded attributed inquiries, not the entire inbox.
