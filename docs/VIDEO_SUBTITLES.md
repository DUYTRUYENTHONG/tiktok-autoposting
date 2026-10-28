# Local Vietnamese narration captions

The subtitle preparation reads the **current canonical** queue101–105 `voicePreview.receiptFile`, then that video receipt's `voice.path`, `voice.sha256` and exact reviewed `voice.script`. It verifies WAV/video bytes and the associated script file. It never synthesizes replacement narration, changes the voice profile, updates a queue/journal, uploads audio, or publishes a video. Accepted101 audio remains unchanged. Listening approval is copied only from the matching audio receipt;The user approved the exact shorter102–105 v7 audio samples: “Use these shorter versions.” Private approvals bind WAV hashes; changed audio requires renewed review.

## Actual timing and its limits

[src/video-subtitles.mjs](../src/video-subtitles.mjs) runs the already installed `@huggingface/transformers4.3.2` with [Xenova/whisper-small at revision2d67713f236afa48a18992566e7647f6ca848e13](https://huggingface.co/Xenova/whisper-small/tree/2d67713f236afa48a18992566e7647f6ca848e13), q8, CPU, two intra-op threads and one inter-op thread. This is a Transformers.js maintainer export of the [OpenAI multilingual Whisper-small base](https://huggingface.co/openai/whisper-small), not a newly trained model. Its quantized encoder and merged decoder total about249MB; published LFS SHA-256 values are pinned in code. Each downloaded metadata/tokenizer/model file receives an actual SHA-256 and a private asset manifest. Preserve the downloaded model README and upstream notices.

The first tested ONNX Community export, revision36050c46d777d46dc4b5f43f6d90574fc38f8732, loaded but lacked cross-attention outputs needed for word timestamps. It was rejected for this workflow. The compatible Xenova decoder exposes the required outputs; actual Vietnamese ASR then ran on each current WAV. No provider key, paid credits, PyTorch installation or changes to the VieNeu environment were needed.

Audio is decoded locally by the integrity-checked FFmpeg into mono16kHz float PCM. The model receives a `Float32Array`, never an audio URL. The pipeline uses `language:'vietnamese'`, `task:'transcribe'`, `return_timestamps:'word'`, greedy decoding and a bounded token limit, following the [official ASR pipeline API](https://huggingface.co/docs/transformers.js/api/pipelines#module_pipelines.AutomaticSpeechRecognitionPipeline). Both model loading and inference run with remote models disabled and a rejecting `fetch`; the model reloads from the pinned local directory.

Whisper mishears parts of this brisk synthetic narration. The five actual preparations have roughly **61–78% case/diacritic-insensitive lexical coverage**; the initial101 result had70.18%, including errors in the promotion and spoken code. Therefore the script is **never replaced by the ASR transcript**. Preparation preserves the reviewed script and offer. Matching aliases cover spoken numbers, `Sa cu ra`/`Sakura`, and `Tích Tóc`/`TikTok`. The separate burn step also normalizes displayed product/platform names and an actually spoken inquiry code; it never edits the source audio or invents a spoken code for102–105.

The strongest path aligns reviewed words with matching actual ASR timestamps. A weaker **phrase preview** may use genuine ASR substitution/exact anchors, measured20ms RMS speech activity and actual WAV boundaries when enough lexical/speech support exists. A brief trailing word can merge into its preceding phrase by taking the union of their actual timestamp bounds. No text is spread uniformly over total duration, and no word-level precision is invented. Missing/null timestamps, insufficient coverage, unmapped text, timing overlap, unreadably short cues or inability to fit two lines can still produce `needs_alignment_review` with no SRT/ASS.

For the phrase path, `usable:true` means **renderable playback preview only**. The receipt remains `needs_playback_review`; `alignmentConfidence`, original lexical `coverage`, `lowConfidencePhrases`, `criticalUnmatched`, `timingGaps`, measured `speechActivity`, and any clipping of ASR overrun to the actual WAV boundary remain visible. This is not forced alignment, a pronunciation pass, listening acceptance or publication approval. Inspect offers, names, codes and sentence transitions against the real final video.

## Prepare and inspect

```powershell
# Public model files are downloaded only when absent and this flag is explicit.
node scripts/prepare-video-subtitles.mjs sakura-101 --download-model
# Offline reuse/current102–105 inputs; one model process, sequential inference.
node scripts/prepare-video-subtitles.mjs sakura-102 sakura-103 sakura-104 sakura-105
node --test test/video-subtitles.test.mjs
```

Private storage defaults to `%USERPROFILE%\.codex\data\tiktok-autoposting\voice\subtitles`; `TIKTOK_SUBTITLE_HOME` may choose another directory outside the checkout. Resolved symlinks/junctions cannot redirect outputs into Git. Model assets live in `models/whisper-small-2d67713f`. Each hash-keyed `renders/<queueId>-<key>/` contains raw `asr.json`, `alignment.json`, `receipt.json`, and, when preview-usable, UTF-8 `voice.srt` and `voice.ass`.

Keys include exact WAV SHA-256, script SHA-256, model/revision/asset-manifest SHA-256, subtitle algorithm version and layout. A narration rerender invalidates the old asset even when the queue ID is unchanged. Corrupt subtitle/model bytes stop reuse. The CLI's optional `--reuse-asr <local-asr.json>` is restricted to one ID and verifies the exact audio/script/model/revision/duration before reusing previously measured timestamps; this avoids repeating inference when only cue grouping changes.

## Renderer integration

The editing owner burns subtitles using [scripts/burn-video-subtitles.mjs](../scripts/burn-video-subtitles.mjs). It checks the current canonical unsubmitted item and batch authorization, verifies the matching subtitle/audio/script hashes, preserves preview history and copies the existing audio stream with `-c:a copy`. It changes the local preview/assets to a review state; it does not publish, approve listening or add music. Accepted/published/uncertain items are rejected. Preserve101's exact accepted audio and existing published layout.

```powershell
node scripts/prepare-video-subtitles.mjs sakura-102 sakura-103 sakura-104 sakura-105
node scripts/burn-video-subtitles.mjs sakura-102 sakura-103 sakura-104 sakura-105
```

For another renderer, use the same current canonical source and preserve the original audio mapping:

```javascript
import {narrationSource, verifySubtitleReceipt} from './src/video-subtitles.mjs';
const source = await narrationSource(currentQueueItem);
await verifySubtitleReceipt(subtitleReceipt, source);
if (!subtitleReceipt.usable) throw Error('Caption timing needs review');
// Copy subtitleReceipt.assFile to the render folder as voice.ass.
// Add ass=filename=voice.ass after the existing picture/text filters.
// Final render remains needs_playback_review; preserve audio and its receipt.
```

For new preparation in an isolated Node process, call `ensureSubtitleModel({download:false})`, `createSubtitleTranscriber(assets)`, then `prepareVideoSubtitles(q,{ffmpeg,transcriber,modelAssets:assets})`; dispose the transcriber after a sequential batch. The global fetch restriction is scoped to model loading/inference; avoid concurrent in-process network work while ASR runs.

The reusable ASR ASS template uses1080×1920 coordinates, Arial48 bold, white text with a dark backing, at most two38-character lines and default bottom-center position `(540,1620)`. The current burn renderer explicitly overrides that position to `(540,1330)` and records the override, display aliases and ASS hash in its own receipt. New v6safe-text source videos place the inquiry CTA at y214, stock disclosure at y532 and the closing product line at y1340, keeping captions above the observed native TikTok UI. Original promotion/hook overlays remain above. Accepted101 retains the earlier lower-caption layout; do not regenerate or duplicate it to retrofit this layout.

SRT and prepared ASS retain the reviewed cue text/times. Burning applies display aliases `Sa cu ra`→`Sakura`, `Tích Tóc`→`TikTok`, and an actually spoken lead phrase→its printed code without changing timestamps or audio. For102–105 v7, codes remain in the existing visual CTA/caption rather than being fabricated as speech. Inspect the final video in the actual composer; safe coordinates alone do not certify playback or naturalness.

Actual101 phrase-preview intervals were0.08–0.82,0.82–2.50,2.80–4.64,4.92–6.34,6.34–8.30,8.60–9.78,9.78–10.72,10.72–11.64 and11.64–12.2807seconds. Unequal durations follow ASR/speech anchors. The source WAV hash is `cf8ad3eb2c59539e9dbb5524bc2b9f512ea9f2bf7837a17b38938ae9d4a1c880`. These are preview timings requiring playback, not certified word boundaries. Later audio revisions require fresh preparation.

## Verification scope

Focused tests cover irregular ASR anchors, exact script retention and aliases, abstention on poor/missing timestamps, overlap/bounds, Vietnamese SRT/ASS output and default caption placement, changed WAV/script/version keys, phrase-preview confidence, measured PCM activity and stale narration rejection. Actual local inference/offline reload and all five source/hash/model checks were exercised; all five current inputs received phrase-caption preparations and local burned outputs. The editing owner inspected the four new safe-layout contact sheets and a full102frame. The user approved the exact shorter102–105 v7 audio samples: “Use these shorter versions.” Private approvals bind WAV hashes; changed audio requires renewed review. Final playback/mix review remains required; no ASR confidence or render flag substitutes for that evidence. Publication is recorded separately in private platform receipts.
