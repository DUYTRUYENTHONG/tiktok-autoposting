# Sakura JavaScript animation engine

Codex can now edit a local scene plan and JavaScript composition, then export a real vertical MP4. The first implemented production preset uses two reviewed photographs, an authentic Sakura product crop and an existing approved Vietnamese narration. These are animated photo stories; they are not newly filmed product demonstrations or a trained generative-video model.

Set `burnCaptions` to `false` in a private plan to omit narration captions from the rendered frames. It defaults to `true`; timing evidence and the exact approved audio remain required either way. This option does not enable native TikTok captions or approve a post, and this two-photo renderer does not implement the requested six-image, 30-second format.

## Components and upstream adoption

- [Canvas composition](../src/motion-canvas.mjs): measured Vietnamese text, photograph motion, spring-driven product continuity, question cards, crossfades and phrase captions.
- [Renderer](../src/motion-render.mjs): frame-by-frame offline Chromium rendering, FFmpeg encoding, source snapshots, text bounds and copied-audio verification.
- [Production adapter](../scripts/render-photo-story.mjs): registered intent and journal checks, exact approved voice, real ASR timing, reviewed crops and current RAG coverage.
- [MCP tools](../src/motion-mcp.mjs): `motion_status`, `motion_inspect`, `motion_quality`, `motion_render`. The latter writes local artifacts; none posts to TikTok.
- [Animate](https://github.com/cth9191/animate): MIT closed-form spring and deterministic Canvas patterns, pinned at7e5eb56. Its full style engine, score and voice generation are not activated.
- [Digital Samba](https://github.com/digitalsamba/claude-code-video-toolkit): hash-verified `probe_video`, `measure_loudness` and `check_frames`, pinned ateddb488. No audio repair/normalization, global skill migration, Remotion/cloud setup or external provider calls are run.

Exact commits, Python file hashes and the FFprobe hash are in [video-toolkits.json](../config/video-toolkits.json). Full upstream notices are retained in [Animate MIT](../third-party/animate-MIT.txt) and [Digital Samba MIT](../third-party/digitalsamba-video-toolkit-MIT.txt). Supplied media retains its own licensing and provenance requirements.

## Runtime and commands

Requires Node22+, `npm ci`, Playwright1.64.1 and `npx playwright install chromium`. Rendering uses an isolated headless process solely for local media, with network requests aborted and no user profile/cookies. This does not reconnect or control TikTok. FFmpeg is the existing hash-verified local9.0.2 runtime registered in private `state/footage-toolchain/runtime.json`.

Quality measurement additionally requires the pinned private Digital Samba checkout and an existing Python with NumPy. The default is Sakura's local VieNeu Python; `SAKURA_QC_PYTHON` can select an existing runtime. Nothing automatically installs packages or downloads source/model weights.

```powershell
npm run motion -- status
npm run motion -- render "C:\absolute\private-state\story\plan.json"
npm run motion -- inspect "C:\absolute\private-state\story\receipt.json"
npm run motion -- quality "C:\absolute\private-state\story\receipt.json"
```

Use actual paths beneath this checkout's ignored `state/` directory. `quality` optionally writes a new `quality-report.json` beside the receipt; it refuses to overwrite it. All input receipt/video paths are resolved through real paths to prevent junction escapes. A render lock or existing output is an inspection boundary, not permission to overwrite.

`npm run build:plugin` builds the second MCP server registered in `.mcp.json`. Reload the installed plugin before expecting new tools in a live chat. The existing campaign MCP remains read-only; the motion server explicitly distinguishes its local rendering mutation. The checkout, runtime, config, scripts and private assets remain required; this motion bundle is not a standalone portable renderer.

## Private production plan

A plan is data, not executable JavaScript. Create a new sibling directory for each revision. Required fields:

| Fields | Binding |
| --- | --- |
| `intentId` | One existing authorized, unsubmitted scale video intent; accepted/uncertain queue and journal records are preserved |
| `briefFile` | Exact validated Vietnamese script/public caption and intent hash |
| `voiceReceiptFile`, `voiceApprovalFile` | Exact full approved WAV and script; no replacement synthesis |
| `timingReceiptFile`, `timingReceiptSha256` | Genuine verified phrase alignment for that same WAV/script |
| `audioBaselineReceiptFile`, `audioBaselineReceiptSha256` | Existing MP4 receipt containing the same approved narration, used only to copy unchanged AAC packets |
| `photoReviewFile`, `photoReviewSha256` | Exact source/crop review with `accepted` and `visuallyInspected` |
| `photos` | Exactly two image entries: `key`, absolute `source`, actual `sha256`, normalized `[x,y,width,height]` crop; no video input in this adapter |
| `productImage` | Authentic unchanged product source matching the baseline receipt |
| `boundaryCueIndices` | Four increasing actual ASR cue indexes; cuts are anchored to their start times |
| `durationFrames` |600–750 at30fps; retain full speech plus at least250ms; each beat at least24frames |
| `contextHeader`, `hook`, `bodyHeading`, `bodyDetail`, `questions` | Nonempty bounded consumer copy; exactly three questions, no IDs/offers/unsupported results |
| `accent` | Explicit six-digit `0x` color |
| `outputDirectory`, `outputName` | New private directory and plain lowercase `.mp4` filename |

The five initial roles are context hook → context detail → authentic identity → need/material questions → call CTA. New compositions can extend the renderer, but should earn each transition and be checked with actual media before expanding a visual pattern. Do not just randomize the same preset and call it a winning creative.

## Outputs and limits

Each successful export includes MP4, editable `scene-plan.json`, silent `index.html` preview, actual frame samples, local crop derivatives, exact renderer/curve/producer snapshots, text audit, RAG record and private receipt. Audio is copied from the same-WAV baseline and checked against packet hashes; the output is not normalized or retimed. A clean text audit means checked bounds passed, not that every creative decision is good.

The first three examples each rendered600frames/20seconds using the user's new image folder and approved narration. Their initial sampled QC found no black gaps, empty opening or long still stretches. This is local production evidence, not user approval of the new edit, music selection, a TikTok schedule or conversion evidence. The current recipe has been exercised with images; its low-level video-decoding branch is not an approved moving-footage production workflow.

Final playback, native commercial music identity/mix, account, current schedule horizon, location and platform disclosures remain separate posting checks. Preserve accepted posts. No voice/content fine-tuning has been run.
