# 1,000 additional Sakura intent posts

October29 public-copy rule: keep internal IDs and inquiry codes private. New planner drafts use the call-only CTA without a code. For the active campaign, `campaign.publicPostCodes:false` makes creative binding accept nonempty code-free captions and reject internal identifiers in captions or supplied narration. `evidence.publicPostCodes:false` enables the same check in isolated preparations. Private IDs, uniqueness checks and immutable historical plans remain available for reconciliation; accepted posts are preserved. Image text still requires visual review. The older code-bearing examples and executed snapshots below are historical, not current public copy.

The user authorized1,000 new posts:500photo and500video, at20/day with discounts shown only while eligibility is verified. This planner creates **intent and creative drafts**, not1,000 rendered assets, ready posts, TikTok schedules or publications. The root posting owner alone handles browser preflight, canonical registration and submission.

Latest executed status: root registered the reviewed five-minute revision `plan-275a17c6f22a597a.json` after verifying all1,000slots, unchanged identities/creative, and the first accepted postHash. The previous immutable plan remains in private history. Actual progress is **998planned,2scheduled,0published** for this expansion. BẾP301 / `sakura-scale-10001` has native platform ID`7701629446087920948`, scheduled forOctober29at08:00UTC+7. GIỌNG10002 / `sakura-scale-10002` is verified scheduled forOctober29at08:50UTC+7, platform`7701645926267424001`, using the exact approved19.637-second narration in a21-second captioned edit and Countless at-24dB. The remaining998intents still require production/review; the planner has not generated their assets or schedules.

## Planning contract

| Rule | Implementation |
| --- | --- |
| New count | Exactly1,000 additional rows:500photo +500video; existing publications/receipts are never relabelled as new work |
| Account | `saigomlia`; a different configured account fails validation |
| Earliest date |2026-10-29Vietnam time, also excluding past/nearby slots at execution |
| Daily ceiling |20total,10photo and10video including accepted reservations |
| Time window | Experimental08:00–22:15UTC+7; not a proven audience peak |
| Spacing | New posts use Studio's observed five-minute grid, at least20minutes apart and at least20minutes from actual accepted times |
| Existing state | Published observations, verified schedules and moderation-pending receipts reserve their actual day/time/format; platform IDs are deduplicated |
| Uncertainty | Incomplete/conflicting accepted receipts, unknown format or submitting/needs_review outcomes require reconciliation |
| New IDs | `sakura-scale-10001` onward, outside the original queue range; collision with a queue or published observation fails |
| Inquiry codes | First photo isBẾP301; remaining photo/video codes use uniqueẢNH/GIỌNG numbers, checked against queue and published records |
| State distinction | `planned` → actual hash-bound `ready` → receipt-verified `scheduled` / `under_review` / `published`; readiness never implies submission |

The date allocator first computes available capacity, then uses dynamic programming to spread feasible slots across the window without losing capacity around fixed reservations. It fills as early as the known per-format capacities permit and continues beyond50days when needed. Existing over-capacity days are preserved and identified; the planner cannot undo historical receipt or spacing violations. It never overwrites an accepted item to repair a quota.

The actual canonical-state preparation found six preserved future photo reservations at12:00/19:00onOctober29,30and31. This leaves8new photos +10new videos on each of those days. The1,000new intents therefore span **51days,2026-10-29 through2026-12-18**. Day51contains the remaining six photos. Fifty days would suffice only with empty capacity. Later-day dates remain a projection until the actual Studio scheduling window is verified.

The first photo slot is **2026-10-29T08:00:00+07:00**, ID **sakura-scale-10001**, code **BẾP301**. Root has bound the six-slide evergreen creative, registered this one canonical item and verified its actual native scheduled receipt. The immutable intent artifact still marks its draft planned; live progress derives from canonical proof, not that snapshot. No discount is inherited from the earlier301prototype offer card.

OnOctober28, this account's actual photo and video date pickers allowed dates through **November27**; November28 was disabled. Separate screenshots preserve each observation. These are account-observed windows, not official fixed scheduling limits. Both format-specific window evidence and the displayed time must be rechecked before submission.

## Private artifacts and CLI

```powershell
node scripts/prepare-scale-campaign.mjs
node scripts/prepare-scale-campaign.mjs --start 2026-10-29
```

Default output: `%USERPROFILE%/.codex/data/tiktok-autoposting/scale-campaign/`. `TIKTOK_SCALE_HOME` may select another absolute directory outside the Git checkout. Each version has JSON and CSV files with hashes. Re-running the same initializer reuses unchanged files, while a modified artifact is preserved and rejected rather than overwritten.

The original executed plan is `plan-e15430e2cc63c891.json` plus its CSV in that private directory. Its snapshot contains500photo/500video,1,000planned; it remains immutable. Root subsequently registered this goal and verified the first schedule: live progress is998planned/2scheduled, not1,000unsubmitted posts. The JSON retains full draft copy and blockers; CSV provides one inspectable row per intent.

Only after inspecting a plan, the owner may explicitly attach goal metadata:

```powershell
node scripts/prepare-scale-campaign.mjs --register
```

That option changes only `campaign.scaleCampaign` plus the store's normal `updatedAt` bookkeeping. It does not append/edit a queue, receipt, journal, publication or automation. It rechecks current reservations/identities before registering. Root has registered the actual goal. Tests use isolated synthetic campaign files.

Initialize/register before any scale ID is entered into the canonical queue. Once an intent is registered/submitted, reuse the existing goal artifact and reconcile its actual progress; do not restart the initializer to request another1,000rows. Colliding IDs/codes intentionally stop initialization. Accepted-item replanning and bulk canonical queue ingestion are outside this slice.

### Explicit native-time revision

The initial spread used a one-minute grid. Studio's actual native time wheel only supports minutes00,05,…55. New planning uses five-minute candidates. For an already registered goal, use:

```powershell
node scripts/prepare-scale-campaign.mjs --normalize-times
```

This verifies the registered source byte hash and internal checksums, then writes a **new private version** by rounding only unsubmitted draft times to the nearest five minutes. It preserves every ID, code, format, copy and accepted item; unchanged intent hashes remain identical. It rechecks current accepted reservations, daily/format quotas and20-minute spacing, and refuses conflicts, uncertain registrations or source changes. Changed times get new intent hashes; `previousPlanHash` links the revision. It does not register the revision, edit the original, or update canonical state/journals. Root must review and explicitly switch manifest metadata before using it. A separate progress journal must match the selected immutable version; never reset an existing journal to migrate.

The actual prepared revision is `plan-275a17c6f22a597a.json` plus CSV:40time changes, same1,000identities,51-day horizon. The first accepted08:00item and second08:50item retain their intent hashes; the accepted first postHash remains valid. The original artifact remains unchanged. Registration of this revision belongs to the root owner.

## Creative structure and honest demonstration

Every row is `creative_draft`, `hypothesisStatus:untested`, `generativeLLMUsed:false`, `fineTunedModelUsed:false`. The controlled scenario/question matrix derives from existing pain-point hypotheses, excluding discount-bearing source hooks. A distinct matrix key does not establish an independently researched angle, winning copy, unique media or better performance. There is no attached content LLM or asset-generation call.

Each draft follows hook → honest product walkthrough → offer-policy gate → CTA. Photo drafts have six suggested slides: hook, friction, authentic product identity, material objection, current-information invitation, inquiry CTA. Video drafts have an evergreen spoken outline and require later real narration/captions/playback. BẾP301uses the after-work/shared-chores story and the actual Sakura500ml identity.

There is **no verified actual Sakura cleaning-efficacy demonstration**. `efficacyDemoEvidence:null`, `efficacyDemoAvailable:false` and `stockIsProductDemo:false` remain explicit. The supported alternative is an authentic product/label closeup and material-question walkthrough (`demoKind:product_identity`). Stock footage is labelled illustration, not a Sakura demo or customer endorsement. A requested efficacy demo remains blocked without actual evidence; a label walkthrough is not proof of cleaning results or compatibility.

All rows initially lack rendered assets, bound visual/content review, real music selection and native schedule-window evidence. Videos additionally lack exact voice/listening and caption/playback proofs. No row becomes ready because an ID, filename or64-character string exists. Existing three-digit voice/MCP queue-ID validators do not yet accept the scale namespace; bulk production needs a separately reviewed integration rather than pretending500voice renders ran.

## Discount gate

The current campaign has no verified order ledger. All1,000future rows therefore use **evergreen_no_discount**: ask about the product, price and conditions at the time of purchase. Public draft copy does not repeat Mua1tặng1/first50orders. A previously reviewed promotion card or today's positive-looking remaining count cannot authorize a static future image/audio discount.

`promotionEligibility` requires an explicit owner-verified order-ledger attestation with all of:

- `verified:true`, `source:verified_order_ledger`, an identified ledger and its SHA-256;
- exact Sakura product/promotion, TikTok channel,50orders, integer redeemed/remaining counts that sum to50and remaining>0;
- verification no more than15minutes old, not in the future, on the actual Vietnam publication day;
- `validForPublishAt` equal to that actual timestamp and `validUntil` covering it;
- actual publication-time check, not a future scheduled timestamp. A check more than5minutes after the stated publication time also expires.

This is a restrictive policy over explicit evidence, not an order API or independent audit of a seller's attestation. The owner must verify the real ledger/order records and hash before supplying that evidence. Unknown, exhausted, stale, inconsistent or future-only proof produces evergreen fallback. Preparing future discount variants requires a new reviewed intent/asset decision and a publication-time recheck; flipping a readiness flag or copying an old approval is insufficient. No prices, remaining counters, deadline, shipping promise or results are invented.

## Bind the actual BẾP301 creative

The module exports `scalePostHash`, `bindScaleCreative` and `validateScaleReceipt`. They return objects; none writes canonical state or calls TikTok. Read the currently registered immutable plan, choose its first item, and provide actual six-image evidence in exact upload order:

```javascript
const evidence = {
  account: 'saigomlia',
  location: item.location,
  caption: actualEvergreenCaptionWithBEP301,
  assets: orderedSixFiles.map((file, index) => ({
    path: file.absolutePath, sha256: file.actualSha256, order: index + 1
  })),
  demoKind: 'product_identity',
  authenticProductReferenceVerified: true,
  music: {
    soundId: actualNativeSoundId, businessUseVerified: true,
    availableInAccount: true, selectedInUi: true, verifiedAt: observedAt
  },
  scheduleWindow: {
    verified: true, account: 'saigomlia', format: item.format, verifiedAt: observedAt,
    earliest: actualEarliestAllowedTimestamp, latest: actualLatestAllowedTimestamp
  }
};
const postHash = scalePostHash(item, evidence);
evidence.visualReview = {verified: true, postHash, verifiedAt: observedAt};
evidence.offerReview = {
  verified: true, containsDiscount: false, postHash, verifiedAt: observedAt
};
const bound = await bindScaleCreative(item, evidence, {state: currentState, now});
```

Only set review flags after the actual inspection. Hashes verify bytes and bind human review to the specific post; they do not machine-prove visual truth. The binder checks six distinct files/order, actual filesystem SHA-256, account/location/caption/code, authentic reference attestation, supported demonstration type, bound visual/discount reviews, current music and observed native date window. It rereads accepted reservation metadata supplied in `currentState` to reject new quota/spacing conflicts. A changed caption, order, sound, voice or asset invalidates the postHash-bound review.

Video evidence additionally needs the real voice file/hash, exact spoken script hash and selected Thùy Dung1.2/speaker-only profile; a listening approval for this exact item/audio, never a global profile or101approval; current subtitle file/hash bound to that audio/script; and final postHash-bound playback/mix review. Caption prep/ASR confidence alone is not listening approval. Music/window checks must be fresh at review, and the actual final composer still needs verification.

`ready` means these explicit local prerequisites passed. It does not guarantee a platform will offer the date or accept the post. Before one final UI action, root must recheck current state, asset bytes/order, caption, sound, disclosures, location and displayed timestamp. The root owner registers the first canonical queue item only at that preflight, using its original stable ID/code.

After an actual platform response, `validateScaleReceipt` requires the ready postHash, matching account, unique string platform ID, observed evidence/timestamp and the correct scheduled time or actual publication day. It rejects a platform ID already present in queue/published observations, stale mutated bound metadata and future-claimed publication. `scheduled` is not published; accepted moderation is `under_review`; only a verified live receipt is published. Never manufacture these transitions from a local render or retry an uncertain submission.

## Durable per-item progress bridge

```powershell
node scripts/scale-progress.mjs status
node scripts/scale-progress.mjs bind sakura-scale-10002 C:/private/actual-evidence.json
node scripts/scale-progress.mjs submitting sakura-scale-10002
# Root performs exactly one actual UI action, then supplies its observed receipt:
node scripts/scale-progress.mjs receipt sakura-scale-10002 C:/private/actual-receipt.json
```

These commands never operate TikTok. `bind` writes only private hash-bound readiness. `submitting` rechecks actual bytes, current reservations, fresh native music/window and preflight, durably records uncertainty **before** registering exactly one canonical queue item and its product/angle cohort. It refuses accepted/uncertain retry. No bulk queue registration occurs. `receipt` records only supplied actual proof, guards unique platform identity/account/postHash/time and permits scheduled→under_review→published progression. Exact receipt replay is idempotent; an interrupted canonical apply can be completed by replaying that same proof. Later verified publication of an already accepted platform ID is retained even when moderation delays the actual day.

Binding evidence extends the example above with `preflight`: `verified:true`, exact `postHash`, `account`, `format`, `location`, `scheduledAt`, `audience:'Everyone'`, `disclosures:{aiGenerated:true,ownBrand:true}`, `verifiedAt` within10minutes, and `evidence:{path,sha256}` pointing to the actual private screenshot bytes. The bridge requires `scheduleWindow.format` for this item. A recorded ready status still requires these fresh submission checks; it is not a reusable global voice approval or discount entitlement.

The default separate private journal is `progress-<registered-plan-hash-prefix>.json` beside the registered manifest. `TIKTOK_SCALE_PROGRESS_FILE` may select another absolute path outside Git. Checksums, a chained event ledger, locks and atomic journal replacement detect accidental modification and serialize work. They are not cryptographic signatures against an actor who can rewrite all files. There is no atomic transaction spanning journal and campaign JSON: write-ahead records plus explicit `canonicalApplyPending`/`journalAcknowledgementPending` flags make interruptions visible and fail closed. Reconcile the actual UI before supplying proof; never reset uncertainty to enable another click.

`status` is read-only, creates no journal, and merges existing phase-scale canonical receipts with private records. It bootstraps the already scheduled first item without replaying its receipt or copying the legacy submission journal. A matching legacy bound-ready file is read only for exact binding; later metadata updates preserve its path. Counts are derived from records, never reset to the plan's initial1,000planned snapshot. The original registered manifest/hash is checked on every command. Missing legacy binding does not erase an accepted receipt; further receipt transitions need its original bound evidence.

## Verification and remaining work

`node --test test/scale-campaign.test.mjs` exercises exact counts,50/51-day horizons, actual-time spacing, accepted-ID deduplication, collisions/uncertainty, idempotency, stale/unknown/future/exhausted offer proof, false-hash readiness, bound six-slide review, noninherited voice approval, reservation changes and unique receipt transitions. CLI fixture checks prove default no-write behavior, metadata-only explicit registration and tamper rejection. Test media/receipts are synthetic technical fixtures, not campaign assets or positive training examples.

`node --test test/scale-progress.test.mjs` covers canonical bootstrap, private binding, per-item registration, replay/progression, fresh byte/disclosure/audience/window checks, crashes before/after write-ahead records, same-status evidence reconciliation, atomic replacement failure, concurrency, tampering and duplicate IDs. All mutating progress tests use isolated fixtures; this implementation task does not replay or mutate the actual first receipt.

Remaining work includes producing/reviewing the other998creatives, real voice/caption/music work, final per-post preflight, actual native scheduling and later publication reconciliation. The time revision is registered and both format windows have been inspected. No paid provider, browser automation,1,000asset generation, training, leads or order data are created by this planner.
