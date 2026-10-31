# TikTok Autoposting · Sakura Content Lab

Vietnamese product carousel planning, TikTok Studio scheduling through computer use, and a local performance tracker. Built for **@saigomlia**, offline sales in Ho Chi Minh City and online sales across Vietnam.

## Current operating scope

- Voice research: [V-TTS review and correction memory](docs/V_TTS_REVIEW.md). V-TTS is not activated because its current license excludes commercial use without written permission. Sakura Voice Lab0.4 adds exact-profile feedback retrieval; no voice model has been fine-tuned. The [refined adoption prompt](prompts/v-tts-adoption-review.md) and `npm run voice:corrections -- status` are available.

- Latest priority: **100 videos total**, using supplied footage/images and Vietnamese narration. The user chose **20-minute spacing and carryover**, preserving accepted schedules and the standing30/day capacity. The private proposal prioritizes these videos across October31–November3. A local position is not a rendered file, native schedule or publication. See [video priority](docs/VIDEO_PRIORITY_100.md).
- The broader rolling window remains October31–November29, up to900daily positions including accepted reservations. Keep the registered immutable1,000-intent500photo/500video source plan. Do not restart its initializer or run the legacy daily planner over it.
- New content is **evergreen/no discount** until actual publication-time eligibility and remaining-order evidence are verified. Historical accepted offers stay unchanged. Public text has no internal IDs, inbox CTA, invented phone number or clickable-link claim. Use **Gọi số điện thoại trong bio để được tư vấn.**
- Location: **Vựa Sầu Riêng Cô Ba,322 Đ.HuỳnhThịHai**; offlineTP.HCM and onlineVietnam. Keep AI and own-brand disclosures. Stock/generated scenes are illustrative; they do not demonstrate Sakura efficacy.
- Local RAG now checks required current evidence before new scale-video production. Vietnamese editorial review, exact narration acceptance, actual encoded playback, native music and posting receipts remain separate. Neither content nor voice has been fine-tuned. [Knowledge limits](docs/KNOWLEDGE_AND_TUNING.md).
- **Herk Edit Kit** is pinned and its15skills are installed on this machine. The Sakura bridge exports actual footage/audio/ASR into a private editing draft and runs the pinned footage validator. HyperFrames rendering and cloud services are not enabled by that installation. [Editing integration](docs/HERK_EDIT_KIT.md), [production prompt pack](prompts/video-creative-research.vi.md).

## Historical pilot and expansion notes

The dated instructions below explain earlier accepted artifacts. Current rules above and AGENTS.md supersede their old cadence, promotion and inquiry-code wording.

- Latest expansion: **1,000 additional posts:500carousels and500videos**,20/day with10ofeach format including preserved reservations. [Scale campaign operations](docs/SCALE_CAMPAIGN.md) documents the private plan, real readiness gates and receipt-based progress. Current allocation spans October29–December18;1,000 intent rows are not1,000 produced or scheduled posts. New discounts appear only while eligibility is verified; without an order ledger, new media is evergreen/no-discount. The account's photo calendar currently exposes dates through November27, so later dates require rolling preparation and native scheduling.

- Operating KPI: **20 receipt-verified published posts per Vietnam calendar day (UTC+7)**, starting October 27, 2026. This replaces the earlier stop-after-20 pilot restriction. The first 100 remains a cumulative milestone, not a daily limit.
- The user changed the pilot from scheduling to **publish now** on October27. Nine items were already scheduled; Studio disables changes to commercial posts and requires the TikTok app. The latest user decision is **keep the nine schedules unchanged**. The remaining11 are immediate submissions. Never silently duplicate scheduled items.
- New immediate posts use **Vựa Sầu Riêng Cô Ba — 322 Đ. Huỳnh Thị Hai** as their TikTok location.
- Promotion for all new posts: **Mua 1 tặng 1, chỉ khi mua qua TikTok**. The first scheduled post retains its earlier Mua3tặng1 offer under the explicit keep decision.
- Latest October28 refinement for unsubmitted tests and future content: **Mua1tặng1 cho50đơn đầu tiên từTikTok**, spoken at the start of the voice-over. Accepted posts remain unchanged; redeemed/remaining orders are unknown. See [current terms and hook strategy](docs/PROMOTION_TERMS.md).
- Latest October28 publish-now instruction covers **five videos101–105 and ten photo carousels201–210**, with a different suitable sound for each. It supersedes the earlier ten-video immediate batch;106–110 remain deferred drafts. Preserve accepted/scheduled items. Submission, moderation and verified publication remain distinct; this documentation does not assert all15 are published.
- Posts19–20 introduce original human-story covers and recommended music. Printed AI wording was removed from the new covers; the platform AI disclosure stays enabled. Music on the existing18 was not changed: Studio's commercial-post edit/Delete restriction requires the TikTok app.
- Ten content angles, two caption-hook variants each. Paired variants reuse the same verified image set; this is an observational pilot, not a causal A/B test.
- The daily backlog adds 28 original painpoint/story hypotheses with post-specific inquiry codes. Generated characters are illustrations, not customer testimonials. Reused covers are identified in the private asset manifest; 28 concepts does not mean 28 new image sets.
- Native photo scheduling, local uploads, commercial disclosure, AI labels and account avatar changes have been verified in the signed-in browser. The original October27 19:00 schedule was subsequently verified live. Scheduling receipts live outside Git; other scheduled items still require publication verification.

## Run the tracker

Requires Node.js 22 or later.

```powershell
npm ci
npm test
npm start
```

Open [the local tracker](http://127.0.0.1:4318) or [carousel review](http://127.0.0.1:4318/review). The read-only server binds to loopback, checks the Host header, and refreshes displayed state every 15 seconds. TikTok metrics change only when new observations are imported; this is not an installed TikTok analytics API integration.

Canonical private data: `%USERPROFILE%\.codex\data\tiktok-autoposting\campaign.json`. Override with `TIKTOK_CAMPAIGN_FILE`. The repository's ignored `state/` directory stores working upload manifests and browser evidence journals; it is not the canonical campaign database.

```powershell
npm run campaign -- init
npm run campaign -- sakura "C:\absolute\product-folder"
npm run campaign -- ingest "C:\absolute\other-products" --area "TP.HCM · online toàn quốc"
npm run campaign -- import "C:\absolute\observations.json"
npm run campaign -- status
node scripts/reconcile-pilot.mjs
node scripts/configure-daily.mjs
```

Do not run preparation commands against an active campaign without checking existing receipts and the latest instructions. `scripts/prepare-pilot.mjs` prepares this dated Sakura pilot, preserves verified submissions and requires an absolute product folder plus a verified promotion image. It does not upload or schedule anything. `scripts/reconcile-pilot.mjs` imports verified local scheduling journal entries and rejects conflicting receipts.

`scripts/configure-daily.mjs` prepares remaining slots for today and tomorrow, subtracting verified schedules and accepted moderation-pending submissions. It preserves receipts and blocks on uncertain submissions; it does not post to TikTok. Proposed windows are experiments, not proven audience peaks. The existing Codex follow-up **Sakura · 20 posts per day** prepares content at05:30 and checks results at22:30 local time. It requires an available computer, app and signed-in browser; a background publishing run has not yet been verified. The running dashboard URL is recorded in private campaign.trackerUrl when it differs from the default port.

## Content, skills and agents

The product folder supplies authentic references and nine cleaning-product carousel sets. The fabric-spray set is a different product and is excluded. Painpoint covers and a generated TikTok-only promotion card are visually checked before upload. Never invent cleaning results, prices, certifications, delivery terms or testimonials.

Six reusable skills are included in `skills/`: Vietnamese research, angle experiments, carousel creative, product video, voice-over and performance posting. Four role profiles are in `.codex/agents/`: researcher, creative producer, performance analyst and posting operator. Profiles do not mean four agents are running. They inherit the active model; no model or cost substitution is automatic.

```powershell
npm run campaign -- install-skills "C:\absolute\deer-flow"
npm run campaign -- install-agents
npm run build:plugin
npm run campaign -- register-plugin
```

Installers preserve existing differing definitions rather than overwriting them. Refresh/restart Codex and install `sakura-content-lab` from the personal plugin source to load it into a new runtime. Local packaging and MCP stdio behavior are tested; registration alone does not prove the desktop has connected the plugin.

The plugin exposes four **read-only** MCP tools: campaign summary, angle performance, schedule recommendations and creative briefs. Publishing remains a browser workflow. The bundled server runs without a separate `node_modules` installation after building.

The separate **Sakura Voice Lab0.3** plugin prepares Vietnamese story scripts and renders offline WAV previews with duration and waveform checks. It supports VieNeu-TTS v3 Turbo presets,1.0–2.0x speed and the actual reference-code selector. The selected B profile is **Thùy Dung1.2x, referenceStyle=speaker-only**, activated privately. The accepted101 script/WAV remains v6;102–105 use shorter colloquial v7 scripts with GIỌNG codes retained in captions/video instead of the long spoken ending. The user approved the exact shorter102–105 v7 audio samples: “Use these shorter versions.” Private approvals bind WAV hashes; changed audio requires renewed review. Model downloads happen during setup; narration then runs in a network-disabled worker. See [voice setup and music rotation](docs/VOICE_AND_MUSIC.md) and [local voice research](docs/LOCAL_VOICE_RESEARCH.md). The daily planner requests distinct, freshly verified Vietnam commercial-use sounds instead of repeating one recommendation.

The [current narration prompt book](prompts/VOICE_TEST_OCTOBER28.md) records the five active scripts and source-carousel IDs;106–110 remain historical drafts. Media receipts explicitly distinguish rendered voice previews, music selection, listening review and verified publication.

The [footage workflow](docs/FOOTAGE_EDITING.md) edits reviewed stock intervals with authentic product photography, Vietnamese overlays and local Southern female narration. See the [executed footage/RAG prompt set](prompts/FOOTAGE_RAG_EXECUTION.md). Stock scenes are illustrative and do not establish Sakura efficacy or endorsement.

The image-footage slice has prepared ten distinct RAG-grounded photo briefs and rendered40slides at1080×1440. [Prepare briefs](scripts/prepare-footage-carousels.mjs) reads current facts through local LangChain/E5; [render carousels](scripts/render-footage-carousels.mjs) applies reviewed stock images, accurate scene copy and authentic Sakura packshots. Their private manifests retain codesẢNH201–210, hashes and review status. Rendered files are not publication receipts, and neither a content LLM nor a fine-tuned model produced the copy.

[Narration captions](docs/VIDEO_SUBTITLES.md) use actual local Whisper ASR timestamps, the reviewed script, measured speech activity and exact WAV/model hashes. Current preparations have about61–78% lexical coverage; phrase previews require playback review and do not establish word-perfect alignment. The burn step copies the original audio stream and updates only an authorized unsubmitted local preview. Accepted101 audio and its earlier caption layout remain immutable. The user approved the exact shorter102–105 v7 audio samples: “Use these shorter versions.” Private approvals bind WAV hashes; changed audio requires renewed review. These use the native-UI-safe caption layout.

```powershell
# Add --download-model only if the pinned public ASR assets are missing.
node scripts/prepare-video-subtitles.mjs sakura-102 sakura-103 sakura-104 sakura-105
node scripts/burn-video-subtitles.mjs sakura-102 sakura-103 sakura-104 sakura-105
```

The current burn renderer places phrase captions at y1330 above the native UI, while the reusable ASR ASS template defaults to y1620. It preserves hash-bound timing receipts and normalizes displayed Sakura/TikTok names without changing speech. Inspect the final video, actual music mix and platform disclosures before a single reconciled submission.

The [local knowledge system](docs/KNOWLEDGE_AND_TUNING.md) implements real LangChain retrieval with BM25 and optional local multilingual E5 embeddings. It returns source-grounded prompts and abstains on missing facts; no content LLM is attached. Both [content tuning](docs/KNOWLEDGE_AND_TUNING.md#content-fine-tuning-readiness) and [voice tuning](docs/VOICE_TUNING.md) have dataset preparation, training and evaluation entry points. Neither has trained a model: approved content examples and consented human recordings are missing, and voice training also requires suitable CUDA hardware. Generated media is not a substitute training corpus.

## DeerFlow and model providers

[DeerFlow](https://github.com/bytedance/deer-flow) was cloned separately at `f443f107a3919872346a12ed6a31f35b1e407dae`; custom skills use its extension directories. Its full service is not running: required Python/runtime dependencies and provider credentials are not configured. See [integration notes](docs/DEERFLOW_INTEGRATION.md).

Built-in image generation produced the account avatar and promotion images. Local footage editing, narration and RAG-grounded carousel preparation are implemented; final media review, music selection and publication remain separate. Gemini can be used through a separately configured supported provider and plan; no Gemini API account, key or paid generation is configured by this repository. Recheck current official model availability before configuring any model.

## Measurement and posting

The next creative prototype has a complete [six-slide sales funnel](docs/SALES_FUNNEL.md) and [executed BẾP301 image prompts](prompts/CAROUSEL_FUNNEL_301.md): six reviewed3:4 redesigned images, separate from published media. [Story voice prompts](prompts/STORY_VOICE_FUNNEL.md) provide three new Vietnamese story scripts; one21.061-second Southern female preview was rendered locally and still needs listening review. The funnel includes manual inquiry qualification, verified price/terms, order confirmation and after-sale replies. These drafts do not create platform posts, customers or orders.

Attribute every post to product, angle, variant and immutable platform ID. Import cumulative metric snapshots with observation times; the engine uses the latest snapshot rather than adding repeated totals. It compares the same product, format, distribution and promotion at comparable24–72-hour age; the preserved Mua3tặng1 post cannot act as a control for Mua1tặng1. Limited evidence is a signal, not a proven winner. Missing engagement data stays missing.

Fresh daily covers are registered by product/story after visual QA and remain attached when the unsubmitted plan is refreshed. From sakura-029 onward a library fallback alone is not ready. See the [executed October28 prompt set](prompts/OCTOBER_28_STORIES.md) and [daily operations](docs/DAILY_OPERATIONS.md).

The existing account audience mainly watched durian content. Its historical peak is not proof of cleaner-product demand or posting time. Reassess angles after comparable 24–72-hour observations, accounting for the first post's different promotion, small sample size and content reuse. Daily volume is user-authorized; an angle is not a winner just because it was posted.

Qualified inquiries require an observed cleaning need and surface/material, attributed by a post-specific code or direct reply context. Import only pseudonymous event IDs, post ID, timestamps and status; keep customer identities and messages outside this repository. See [daily operations and lead import](docs/DAILY_OPERATIONS.md).

Follow [operations](docs/OPERATIONS.md) for UI verification, disclosure settings, duplicate prevention and recovery. A timeout after Schedule requires reconciliation, never a blind retry. A browser session or scheduled follow-up is not an unattended publishing guarantee. Keep the computer and Codex app running for local automations.

## Privacy and validation

Private campaign data, product media, credentials, cookies, screenshots and receipts are excluded from Git. Do not export the browser login. The repository contains code, example schemas, prompts and reusable instructions only.

`npm test` covers attribution, snapshot deduplication, evidence thresholds, validation, local state concurrency, server boundaries, campaign planning and MCP tool behavior. `npm run build:plugin` creates the distributable MCP server. See [specification](docs/CONTENT_ENGINE_SPEC.md), [tool review](docs/TOOLING_REVIEW.md), and [implementation prompt](prompts/IMPLEMENTATION.md).
