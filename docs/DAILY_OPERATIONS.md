# Daily posting and lead attribution

The active KPI is20 unique receipt-verified published posts per Asia/Ho_Chi_Minh day, starting2026-10-27. The first100 remains a cumulative milestone. Scheduled and under-review posts are shown separately. They reserve capacity but do not satisfy the publication KPI.

Preserve the nine original schedules. Reconcile the browser submission journal before planning. `node scripts/configure-daily.mjs` prepares today's and tomorrow's remaining experimental slots, excluding existing reservations and uncertain outcomes. It does not upload. Review local plans at http://127.0.0.1:4318/review. If a slot expires, replan only unsubmitted items. Never repeat an uncertain submission.

The existing recurring follow-up is **Sakura ·20 posts per day**,05:30 preparation and22:30 publication review in Vietnam time, attached to the current chat. Its maintained operating prompt is [automation/PROMPT.md](../automation/PROMPT.md). Background publishing has not yet been verified. Keep Codex, the computer and the signed-in internal browser available. Use private campaign.trackerUrl for the currently running dashboard if it differs from the default port.

## Creative and lead measurement

[src/content-bank.mjs](../src/content-bank.mjs) contains28 original illustrative story hypotheses: after-work kitchen fatigue, shared chores, small rentals, surface compatibility, familiar cookware, footwear, bathroom spots, aging plastic, vehicle trim, washer exterior and offer clarity. These model creator storytelling structure; they are not real customer testimonials or proven Vietnamese organic winners. New image production must preserve the real product reference and be visually checked.

Each daily queue item has a unique leadCode, for example BẾP021. The CTA asks for a surface photo, material and stain type. A direct reply can also establish attribution. An inquiry becomes qualified only after an actual need and material/surface are observed. An order requires real order evidence. Do not create a lead because someone viewed or liked a post.

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
