# One-item evergreen scale-video preview

[render-scale-video-preview.mjs](../scripts/render-scale-video-preview.mjs) produces **one existing authorized video intent**, not a batch or a TikTok schedule. It reads the private scale plan, verifies its policy/plan/intent checksums, requires the intended account/product, a unique existing inquiry code, `planned` status with no receipt, and `evergreen_no_discount`. It also reads canonical state to stop if that ID is already accepted, scheduled or uncertain. It never writes canonical queue, journals, the scale plan, approvals or scheduling state.

The latest scale instruction permits discounts only while eligibility is verified. There is no verified order ledger. This producer therefore allows **no printed/spoken promotion, discount, countdown or remaining-order assertion**, including material inherited from older previews. Historical accepted posts remain unchanged. Even a future discount-bearing intent is rejected by this evergreen producer.

## Run the concrete prototype

```powershell
node scripts/render-scale-video-preview.mjs --self-test
node scripts/render-scale-video-preview.mjs --id sakura-scale-10002
```

The input defaults to the immutable manifest currently registered in private `campaign.scaleCampaign`. Its exact file bytes, registered plan hash and intent checksums must match. An explicit `--plan FILE` must select that same active version; stale preserved revisions are rejected. Keep unchanged pending-review previews rather than rendering another narration merely because the calendar version changed. Only one ID is accepted per invocation; there is no `--all`, publishing, scheduling or approval mode. The existing global101–105 voice/subtitle gates and the older promotion-based editor remain unchanged.

The curated script covers the first video's existing `chia-viec` hypothesis. A different angle requires `--brief FILE`, explicitly bound to that intent's ID/hash, rather than automatically repeating the same story. Such a brief must contain `intentId`, `intentHash`, `script`, four distinct `clipIds`, `headline`, `tension`, `decision`, `identity`, `questions`, `price` and `stockLabel`. All fields pass the evergreen text gate. A brief is still a creative candidate, not listening or publication approval.

## Original story used for10002

```text
Người nấu xong, ai nhận phần dọn?

Cả nhà vừa đứng lên, một người đã quay lại bếp. Ngoài kia còn hỏi: “Ủa, còn việc gì nữa hả?” Nghe vậy mới thấy mệt, chớ đâu phải vì một cái bàn.

Thôi, người gom chén, người cất đồ, việc chia cho rõ. Còn chọn nước lau, mình coi bề mặt trước. Đây là chai Sa cu ra năm trăm mi li.

Chụp ảnh chỗ cần lau, ghi tên vật liệu với lớp phủ nếu biết. Nhìn giống nhau, chưa chắc cùng chất liệu. Nhắn shop hỏi giá và điều kiện mua hiện tại. Rõ rồi mình hẵng chốt nha.
```

The108-word illustrative story moves from shared-household tension to a small decision, actual product identity and material/current-price questions. It invents no customer testimonial, cleaning result, price, product compatibility, deadline or available order allowance. The unique existing `GIỌNG10002` is printed rather than added as a long spoken code. `Sa cu ra` is pronunciation text; the rendered identity and subtitle display use Sakura.

## Actual local production

`--voice-receipt FILE` may reuse rendered narration only when actual bytes, exact script, accepted profile and runtime/model hashes match. It retains the source receipt and copies the WAV without synthesis; listening approval remains separate. Narration may be18–25seconds; the final edit stays20–25seconds with a closing beat. Before rendering, the CLI verifies the installed VieNeu runtime/model/codec bytes and demands the accepted profile: Thùy Dung,1.2×, temperature0.8, `speaker-only`. It invokes the existing offline Python worker directly, creating a fresh WAV for this specific story. It never borrows a previous promotional WAV or silently selects a different voice/model. The new audio remains `rendered_needs_listening`; acceptance of an older profile/clip does not approve it.

The source interval manifest and every chosen video byte hash are checked. Four reviewed three-second stock intervals—V090,V001,V043,V042—show household context only. Quarter-second fades lead to the user-supplied authentic Sakura500ml reference image, product identity, material/layer questions, and a current-price/conditions inquiry. Stock people/bottles are not Sakura applications or endorsements. The reference poster contains manufacturer label text; displaying it identifies the supplied package and does not verify those claims. No efficacy demonstration is created.

The full pinned FFmpeg9.0.2 build renders1080×1920 H.264/AAC with narration and no music. WAV QA checks PCM16/mono, level, clipping and actual duration. ffprobe checks codecs, dimensions and final duration. Source plan/intent/footage/product, voice runtime/helper, script, WAV and MP4 hashes are retained privately. The intermediate video is preserved when captions are added.

## Actual phrase captions

The isolated scale bridge calls the existing [subtitle implementation](VIDEO_SUBTITLES.md) at its lower-level APIs. It does not widen the historical queue-ID validators. It uses the cached pinned Whisper-small q8 model with two CPU threads and downloads disabled, then compares the exact new narration script with real ASR timestamp anchors and measured RMS speech/WAV boundaries. It never allocates words uniformly across the whole duration or claims forced/word-perfect alignment.

Subtitle receipts bind the new WAV/script/model hashes, preserve raw ASR and mismatch/low-confidence data, and retain `needs_playback_review`. Insufficient anchors yield `needs_caption_review` without invented timing. An explicitly supplied `--captions RECEIPT` must pass those exact source/asset hash checks. Neither an earlier code's subtitle file nor an older narration's timings can be reused.

Usable phrase SRT/ASS is burned at bottom-center y1330 into a separate captioned sibling. Display-only aliases normalize Sakura without changing the original voice. `-c:a copy` preserves the intermediate AAC stream; a separate packet-stream SHA-256 comparison checks that it stayed unchanged. Caption intervals, offers/names/material words, text placement and final playback still need review. Chapter/hook cards are editorial overlays, not claimed word timings.

## Scope and review state

All generated media, text inputs, raw ASR, receipts and review frames stay in ignored `state/scale-video-preview/`. The CLI generates five still frames for inspection; this does not certify full movement or pronunciation. It retains `status: needs_listening`, `listeningVerified:false`, `visualPlaybackVerified:false`, `publicationReady:false`, `scheduled:false`, `published:false`, and `musicAdded:false`. Suitable music must be selected/verified later in the account's native commercial library. Any scheduling horizon and final acceptance remain the posting owner's work.

The `--self-test` path exercises24 deterministic registered-plan/prepared-audio/identity/promotion/story/unsupported-claim gates without loading models or rendering media. Syntax checks, the real one-item render, ffprobe, source/output checksums and still-frame review provide bounded execution evidence. They do not establish a winning angle or1000 independently rendered assets. This step produces exactly one video intent's local preview.

## Executed first video ·28October2026

- Intent: `sakura-scale-10002`; printed inquiry code`GIỌNG10002`; planned intent retained, no schedule created.
- Private output folder: `state/scale-video-preview/sakura-scale-10002-55a05091a0b8c4ab/`.
- Fresh voice: `voice.wav`, **20.830seconds**, monoPCM16/48kHz; waveform RMS0.108655, clipping0. Exact actual values remain in `voice-receipt.json`; naturalness/listening is unapproved.
- Full intermediate: `sakura-scale-10002.mp4`,22seconds, retained with its own receipt and exact producer-source snapshot.
- Final captioned preview: `captioned-d2b7b666a8933274/sakura-scale-10002-captioned.mp4`,22seconds,1080×1920 H.264/AAC. SHA-256`76d02946633d00d4e001f63ddd39e515cd5ea8f8afb85550b51e7c843dfc75a0`.
- WAVSHA-256:`aefd0a642ccc3a24cd8b8004c11377cdfe0f8fa95247289f9c774c344a175556`.
- Actual timing: `timing/voice.srt`, original ASS and timing receipt; burned display ASS and final receipt live beside the captioned preview. Eleven real-anchor phrase cues; **69.44% lexical coverage**, five lower-confidence phrases including the product/volume wording. It needs actual playback rather than a word-perfect claim.
- The AAC packet-stream SHA-256 matched before/after burn:`8f21ca54baf5e9f76a33c9cc5846f7b4323e3f8878dd07d7fa34ee50695c9c81`.
- Five final frames at1/5/10/14/20seconds were visually inspected. Hook/identity/material/current-price cards and unique inquiry code were readable; captions appeared at y1330; no discount overlay appeared. This is still-frame QA, not full playback or listening acceptance.

The local render receipt remains `needs_listening`, with captions`needs_caption_playback_review`. Root subsequently uploaded the same captioned bytes to an unsubmitted Studio draft, selected Countless at -24dB with0.4s/0.6s fades, and setOctober29at08:50UTC+7. Separate private draft evidence and progress binding preserve those observations. Listening and final playback/mix remain unapproved; there is no schedule or verified publication for this video. Exact source/runtime/script/model/output hashes and source snapshots remain in private receipts. Later production must re-read current authorized intent and eligibility; this artifact does not make the remaining499videos ready.

## Current pacing revision

The user rejected the initial10002pacing and requested the same speed with clearer pauses and emphasis. The rewritten93-word script keeps Thùy Dung1.2x/speaker-only. Its exact19.637-second WAV, SHA-256`64faadd286bea93a9ff9bd1e90eb4d284d42b4c5e007637da31f0382dfa32fcf`, was played in chat and approved: Use this narration. Preserve that audio rather than synthesizing another candidate. A separate21-second edit reuses those bytes and rebuilds captions. Narration approval does not approve obsolete captions or a changed music mix. See [creative variation](TREND_VARIATION.md) for the footage/music testing request.
The revised21-second captioned video was then submitted once and verified scheduled for2026-10-29at08:50UTC+7, platform`7701645926267424001`, account`saigomlia`. Native Countless / Official Sound Studio (`6692683186809359108`) is set to-24dB with0.4s/0.6s fades. Everyone, Cô Ba location, AI and own-brand disclosures were checked. The private progress bridge recorded submitting before the click and reconciled the actual scheduled receipt. Scheduled is not published; the rejected first edit remains unused.