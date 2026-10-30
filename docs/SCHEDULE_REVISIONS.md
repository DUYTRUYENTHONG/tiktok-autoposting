# October 30 schedule revisions

The immutable 1,000-intent manifest remains unchanged. A dated revision is an event in the private progress journal. It replaces the effective publish time for one unregistered, unsubmitted intent while retaining its original ID, intent hash, creative draft, and history. A previously ready private binding is discarded, so the actual creative, reviews, native scheduling window and preflight must be bound again to the revised time.

This override applies only to **October 30, 2026 in Vietnam (UTC+7)** for `@saigomlia`: 30 additional revisions, 40 total accepted/allocated posts, at least five minutes between posts, from 08:00 through 23:55. There is no per-format cap for these dated revisions. All other dates keep the immutable plan's existing policy. A revised slot must be on a native five-minute boundary and at least 30 minutes ahead of the server clock. Studio must independently show that the selected format and time are actually schedulable.

The policy attestation is a private JSON file outside the Git checkout:

```json
{
  "kind": "scale-day-override",
  "account": "saigomlia",
  "day": "2026-10-30",
  "dailyTotal": 40,
  "additionalAuthorized": 30,
  "minSpacingMinutes": 5,
  "windowStart": "08:00",
  "windowEnd": "23:55",
  "verifiedAt": "2026-10-30T19:00:00+07:00",
  "source": "user",
  "policyReference": "2026-10-30 user: still need30posts more for today; answer Five-minute spacing tonight in call_f551da25c867465c87e34a607f80a12a"
}
```

Use the actual verification timestamp. Compute the SHA-256 of this exact file. For each intended post, prepare a private revision JSON file:

```json
{
  "intentId": "<existing-intent-id>",
  "account": "saigomlia",
  "originalIntentHash": "<hash-from-immutable-plan>",
  "revisedPublishAt": "2026-10-30T20:00:00+07:00",
  "policyFile": "<absolute-private-policy-file-path>",
  "policySha256": "<sha256-of-policy-file>"
}
```

Run `node scripts/scale-progress.mjs revise <intentID> <absolute-revision.json>`. The command validates the immutable plan, policy file, account, source hash, date and time, current canonical accepted reservations, and other journal/canonical allocations before saving an event. Then use `bind`, `submitting`, and `receipt` with the existing bridge. `status` shows both original and effective times and the revision hash. A revised ready binding and canonical submission include that revision in the post hash, while the original intent hash remains intact.

An accepted, submitting, needs-review, or otherwise registered target cannot be revised. If an unregistered revised slot becomes too close or expires before submission, run the same `revise` command with a new revision JSON and a new eligible time. The original intent hash, account and policy file/hash must match; the prior revision stays in `scheduleRevisionHistory` and the next revision points to its hash. The old slot is released, the latest slot alone reserves capacity, and re-revision does not consume another of the 30 unique revised intents. Any private ready binding is invalidated and must be redone for the new time. A repeated identical slot is rejected.

An uncertain submission elsewhere requires reconciliation before binding; the revision allocation check reserves its timestamp. The bridge checks allocation again at binding and immediately before canonical submission. The policy file's bytes are checked against the journal on every reload. No revision command edits a published/scheduled receipt or the immutable manifest.
