# Vietnamese content engine specification

User authorization: 2026-10-27 request to prepare and execute the implementation prompt. Proceed with reversible local implementation; actual product research depends on the user's folder and area. No fictional campaign results.

## Capability map and build order

| ID | Responsibility | Depends on |
| --- | --- | --- |
| intake | Product folder manifest, supplied facts, assets | — |
| research | Source-linked Vietnamese audience and creative evidence | intake |
| creative | Testable angles, image prompts, video briefs | research |
| measurement | Snapshot imports, attributed angle signals | intake |
| schedule | Activity-based recommendations, exploration allocation | measurement |
| tracker | Vietnamese local dashboard, freshness and blockers | creative, schedule |
| delivery | Browser scheduling with verified receipts | creative, schedule |

Build intake → measurement/schedule → creative/skills → tracker → delivery acceptance.

## Implementation contract

Use Node.js 22+ built-ins for the engine/dashboard and the official MCP SDK plus Zod for plugin tools; esbuild bundles the plugin. JSON local state and loopback-only read-only HTTP dashboard. Separate DeerFlow clone remains upstream-clean except ignored custom skill copies. No provider credentials are assumed. Product facts originate from the user's files. Templates produce hypotheses, not evidence-backed winners. Customer-facing copy and UI are Vietnamese.

Commands: `npm test`, `npm start`, `npm run campaign -- init`, `npm run campaign -- ingest <absolute-folder> --area <area>`, `npm run campaign -- import <absolute-json>`, `npm run campaign -- brief`, `npm run campaign -- install-skills <absolute-deerflow-root>`.

Structure: src/ = state/domain/CLI/server, public/ = dashboard, test/ = Node tests and synthetic fixtures, skills/ = source skill packages, prompts/ = implementation and operating prompts. Root *.example.json files are legacy setup examples, not the active queue. state/ remains ignored.

Code style: ESM, pure calculations separated from filesystem/network, explicit validation errors, UTF-8, escaping through DOM textContent. Example: `const rate = views > 0 ? interactions / views : null;`.

Tests must prove missing-data handling, no snapshot double counting, attribution validation, same-product/format comparison, explicit timezone handling, incomplete sample rejection, path boundaries, private local state, and dashboard endpoints. Verify the UI in a real browser.

## Success criteria

- Clone DeerFlow and record exact commit/license/runtime blockers.
- Ingest a user-selected folder without uploading it; recurse through product subfolders and skip symlinks/private hidden directories.
- Build Vietnamese research questions and asset-generation briefs tied to immutable angle IDs and product references; external research retains source, access date, and paid/organic context.
- Import real per-post snapshots and audience activity through a documented local JSON contract. Deduplicate snapshots and show freshness, missing attribution, and sample size.
- Compare 24–72-hour observations within product/format/distribution/promotion cohorts. The preserved Mua3tặng1 post is not a control for Mua1tặng1 posts. Flag exploratory signals only after 3 posts and 500 total views; 20% uplift is a configurable operating heuristic, not statistical significance.
- Prefer measured local audience activity when fresh; otherwise label proposed slots as experiments. No universal best-time claim.
- Dashboard refreshes local state every 15 seconds and explicitly shows that automated TikTok metrics ingestion and publishing are not connected.
- Install reusable research/angle/image/video/performance skills in the user's skill directory and ignored DeerFlow custom directory without overwrites.
- Actual media generation and posting remain blocked until product references/provider access/scheduling controls are verified. No background recurring task is activated without a cadence and successful posting acceptance.

## Boundaries

Current operating contract:20 receipt-verified published posts/day by Asia/Ho_Chi_Minh calendar. Scheduled and under_review counts remain separate; reserved schedules and accepted submissions reduce new preparation to prevent duplicates. Uncertain submissions block replanning. Preserve the nine original schedules. The daily target supersedes the original pilot stop;100 is a cumulative milestone. Background publication remains unverified until an actual unattended run succeeds.

Lead events use pseudonymous immutable ID, postId and firstSeenAt, with monotonically updated observedAt/status (inquiry, qualified, order). Only published attributed posts are eligible. No events means unknown, not zero. Never infer leads or orders from views/likes. See docs/DAILY_OPERATIONS.md for the import contract.

Always validate imports, preserve historical snapshots, record source provenance, keep private data ignored, and verify tests before push. Ask only for missing inputs or actions whose applicable policy requires it. Never invent product claims, testimonials, scarcity, customer activity, attribution, results, or integrations. No core DeerFlow changes or paid provider submissions in this first slice.
