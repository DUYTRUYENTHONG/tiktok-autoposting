# Daily posting and lead attribution

Latest October29 rule: internal post IDs and inquiry codes stay private. New public images, captions, narration and CTAs omit them, and progress updates describe the content in plain language. The call CTA remains “Gọi số điện thoại trong bio để được tư vấn”; ask for the cleaning need and material/surface. Earlier code-based examples below are historical schemas, not instructions to print codes. Keep existing accepted posts unchanged. Attribute calls only when evidence identifies a post; otherwise leave attribution unknown.

The current KPI is30 unique receipt-verified published posts per Asia/Ho_Chi_Minh day during October31–November29,2026, aiming15photos/15videos where preserved reservations permit. This supersedes20/day. The first100 remains a cumulative milestone. Scheduled and under-review posts are shown separately. They reserve capacity but do not satisfy the publication KPI. See [30-day rollout](THIRTY_DAY_ROLLOUT.md).

For the active1,000-post expansion, use the registered immutable500photo/500video plan and [scale progress workflow](SCALE_CAMPAIGN.md). Do not run the legacy daily planner to add extra rows on top of that plan. Preserve accepted reservations, use native five-minute slots, and bind actual reviewed media before submission. Discounts require verified current eligibility; unknown means evergreen/no-discount. The projected calendar extends beyond the current native window, so later posts remain unsubmitted until eligible.

Preserve the nine original schedules. Reconcile the browser submission journal before planning. `node scripts/configure-daily.mjs` prepares today's and tomorrow's remaining experimental slots, excluding existing reservations and uncertain outcomes. It does not upload. Review local plans at http://127.0.0.1:4318/review. If a slot expires, replan only unsubmitted items. Never repeat an uncertain submission.

The existing recurring follow-up is **Sakura · 30 posts per day**,05:30 preparation and22:30 publication review in Vietnam time, attached to the current chat. Its saved app configuration was updated through the automation tool on October31. Its maintained operating prompt is [automation/PROMPT.md](../automation/PROMPT.md). Background publishing has not yet been verified. Keep Codex and the computer available; close task browser tabs after completed actions as requested. Use private campaign.trackerUrl for the currently running dashboard if it differs from the default port.

## Creative and lead measurement

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
