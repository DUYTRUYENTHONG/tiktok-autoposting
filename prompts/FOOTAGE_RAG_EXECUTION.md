# Sakura footage, RAG and tuning · executed28October2026

## Creative execution prompt

Latest October28 instruction: prepare/publish-now five original Vietnamese footage videos101–105 and ten photo carousels201–210 for @saigomlia, each with a different suitable sound. This15-item batch supersedes the earlier ten-video immediate batch;106–110 remain deferred drafts. Inspect source catalogs, hashes and chosen intervals/images. Keep stock people and generic cleaners illustrative; never imply a Sakura result, endorsement or testimonial. Speak “Mua một, tặng một! Chỉ năm mươi đơn đầu tiên từ Tích Tóc.” first. Follow with an honest pain point, one useful response and GIỌNG101–105 inquiry codes. Use authentic Sakura500ml photography. Target offline TP.HCM and online Vietnam; location Vựa Sầu Riêng Cô Ba,322 Đ.Huỳnh Thị Hai. Do not invent prices, remaining orders, deadlines, delivery promises or efficacy. Preserve accepted/scheduled originals.

Edit1080×1920 H.264/AAC. Use five reviewed three-second contextual shots, quarter-second crossfades, readable Vietnamese offer and hook text, a second hook line, and a product/CTA ending. Keep the offer's50-order TikTok condition visible. Mark stock scenes as illustrative and not a Sakura efficacy test. Review actual narration, portrait crops, overlays, transitions and final playback. Then add suitable quieter music from the native commercially filtered account library; record track and mix. An account recommendation is not a verified national trend. Keep platform AI and own-brand disclosure. Reconcile before upload; one submission owner records submitting before one final click and verifies the platform receipt.

Executed: catalog/interval review, pinned full FFmpeg, local RAG grounding, authentic packshot,0.25-second crossfades, a second hook line and product-bound render hashes. Voice Lab0.3 exposes actual use_ref_codes conditioning. The user selected B: Thùy Dung1.2x with referenceStyle=speaker-only, activated privately. Preserve the exact accepted101v6script/WAV. Only102–105 use shorter colloquial v7 dialogue; printed inquiry codes stay in captions/video and the long spoken code ending is omitted. Remaining delivery/pronunciation revisions and listening for102–105 are pending; no exact wrong word has been identified. Prior rejected deliveries remain rejected. Local rendering, final playback, music/mix, submission, moderation and verified publication are separate facts. This prompt does not assert that all15 items are live.

```powershell
node scripts/knowledge.mjs index
node scripts/knowledge.mjs hybrid-query e5 "Chính sách video footage và giọng nữ miền Nam?"
node scripts/voice-batch.mjs sakura-102 --voice "Thùy Dung" --speed 1.2 --reference-style speaker-only
node scripts/prepare-footage-tests.mjs
node scripts/render-footage-tests.mjs sakura-102
node scripts/prepare-video-subtitles.mjs sakura-102
node scripts/burn-video-subtitles.mjs sakura-102
```

The renderer requires a private reviewed-footage manifest and verified local runtimes. These commands prepare local files, not TikTok posts. Continue only authorized IDs with actual listening/visual review and suitable music. A moderation-pending browser receipt is under_review, not published.

The [caption integration](../docs/VIDEO_SUBTITLES.md) was exercised on all five exact narration inputs and local burned videos. ASR lexical coverage is about61–78%; genuine phrase anchors, measured RMS speech activity and actual WAV boundaries support playback previews rather than word-perfect claims. The burn step stream-copies audio and binds source/video/ASS hashes, with display aliases for Sakura/TikTok and actually spoken codes. Remaining102–105 use native-UI-safe inquiryCTA y214, stock label y532 and caption-bottom y1330; the reusable ASR ASS default stays y1620. Preserve the accepted101audio and earlier published layout. Four safe-layout contact sheets and a full102frame were inspected; remaining listening feedback and final playback/mix remain pending, not automatically approved by a render.

## RAG execution prompt

Build an actual local LangChain retrieval pipeline over allowlisted verified facts. Preserve product/promotion/time/claim boundaries, exact current offer eligibility and source provenance. Use real local multilingual embeddings with lexical retrieval and RRF; do not fabricate semantic similarity from hashes. Abstain when price, stock, results or certifications are unknown. Prevent inherited tracing from exporting private prompts. Record corpus/model hashes, retrieved sources and latency. Return a grounded prompt without claiming an LLM generated an answer when none is attached.

Executed: local BM25 and two pinned multilingual ONNX models; multilingual E5 used for footage grounding. Four bounded factual source sections are indexed. Development retrieval cases and offline reload ran. Development cases informed implementation and do not establish independent production acceptance. See [knowledge implementation and evidence](../docs/KNOWLEDGE_AND_TUNING.md).

## Content fine-tuning execution prompt

Prepare a local LoRA path for Vietnamese hooks/captions using only consented, human editorial-approved examples linked to compatible verified sources. Never label generated drafts or high-view posts as winners automatically. Deduplicate before training while preserving all story/post family links across split allocation. Keep train/validation/untouched held-out groups separate. Bind source, dataset, tokenizer, chat-template and adapter hashes. Evaluate against the same base on untouched held-out data, with factual and editorial checks; do not deploy automatically.

Executed: preparation, training/evaluation entry points, leakage/privacy regression tests and actual readiness. The real reviewed dataset contains zero accepted examples. No content model, adapter or checkpoint has been trained; no local LLM is attached. Minimum preparation gate is50 reviewed distinct examples with sufficient independent groups, not a promise of quality.

## Southern female voice fine-tuning execution prompt

Implement consent-bound local single-speaker adaptation with accurate transcripts, original lossless clean recordings, grouped splits and pinned upstream/base/codec provenance. Exclude generated speech and unconsented online voices. Validate actual audio, hardware, dependencies and cached derivatives; fail closed on changed or revoked consent. Train backbone LoRA only with supported CUDA hardware. Evaluate untouched speech with token-weighted metrics and paired human listening, names/offers/tones and real synthesis latency. Never describe loss improvement as naturalness or an unsupported CPU ONNX adapter as deployed.

Executed: corpus validator, pinned trainer/evaluator, consent/provenance checks, paired-listening scorer and technical regressions. Actual readiness: zero consented clips; CUDA unavailable. Neither encoding nor training nor adapted inference ran. Current preset inference remains separate. See [voice training](../docs/VOICE_TUNING.md). Intake starting gate:100 distinct3–15-second clips, at least10minutes, one consenting adult Southern female speaker, multiple independent recording/script groups.

## Image-footage carousel execution prompt

Prepare ten distinct Vietnamese pain-point carousel drafts from supplied stock images, with source-grounded offer/product/material facts and unique inquiry codes. Use a four-slide sequence: promotion and pain hook, recognizable situation, useful question/response, authentic product and CTA. Inspect chosen images, crop and final typography. Do not present stock as a Sakura demonstration or customer. Keep generated drafts out of fine-tuning labels until real human editorial review. Record fineTunedModelUsed:false until a trained model exists. Preparation is not publication authorization or a platform receipt.

Executed: ten source-grounded editorial briefs,40rendered1080×1440 slides, codesẢNH201–210, per-angle niche hashtags, exact public location and area, and authentic product CTA. The207 scene was corrected to refrigerator exterior/coating guidance;208 was corrected to black footwear/material care. Every brief ran through actual local LangChain/E5, retaining source/model/corpus evidence, mode:retrieval-grounded-editorial-template, fineTunedModelUsed:false and generativeLLMUsed:false. No fine-tuned model or content LLM generated these drafts. Their private manifest/render receipts retain hashes and per-item review status; publication requires separate browser evidence.

```powershell
node scripts/prepare-footage-carousels.mjs
node scripts/render-footage-carousels.mjs "C:\private\carousel-footage\briefs-hash.json"
```

These commands prepare/render private drafts, not queue entries or uploads. The current user separately authorized this dated ten-carousel batch; the manifest itself grants no publication authority. No media, source catalog, consent document, customer message, credentials or model weights belong in Git.
