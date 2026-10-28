# Vietnamese narration and music

The user requested spoken stories and a different suitable trending sound for each carousel. Existing accepted commercial posts remain unchanged: the account's Studio view does not offer sound editing, and the user asked to preserve the original schedules. Do not delete and recreate them to change audio.

## Sakura Voice Lab

The separate local plugin is in [plugins/sakura-voice-lab](../plugins/sakura-voice-lab). It provides three MCP tools: voice_status checks the optional engine and model hashes; voice_brief prepares an attributed Vietnamese script; render_voice writes a local WAV preview with technical QA. Rendering does not post, attach audio, change a schedule, or approve pronunciation.

```powershell
# Prefer an already-installed Vietnamese Windows voice.
.\scripts\setup-voice.ps1
# Optional alternative: actual Python3.12, not the Windows Store alias.
# python scripts/setup-voice.py
npm run build:plugin
npm run campaign -- register-voice-plugin
node scripts/voice-batch.mjs sakura-047
```

The Windows setup selects an enabled vi-VN stock voice already installed on the computer; Microsoft An was verified here. It uses System.Speech locally at a slower reading rate. No engine download or cloud speech request is needed. The optional Python installer creates an isolated environment under `%USERPROFILE%/.codex/data/tiktok-autoposting/voice`, installs piper-tts1.8.0 from PyPI and downloads the63MB Vietnamese VAIS1000 voice from a pinned Hugging Face revision. It verifies the model's published LFS SHA-256. There are no paid provider calls or cloud speech submissions. Rerunning setup reuses the environment/model; a corrupt checksum stops it. Runtime/model files are private, outside Git. TIKTOK_VOICE_HOME can select another absolute local directory.

Piper is an optional [GPL-3.0 engine](https://github.com/OHF-Voice/piper1-gpl), installed separately rather than embedded in the Node plugin. The [voice model card](https://huggingface.co/rhasspy/piper-voices/blob/5041a7a49ae5b3a0f30e6837769eb03fdbb231bd/vi/vi_VN/vais1000/medium/MODEL_CARD) identifies Vietnamese, one speaker,22,050Hz and a CC-BY-4.0 dataset. Render receipts retain the model source and an attribution notice to accompany public use. No voice cloning or Southern-accent claim is made.

Listen to each preview before use: verify tones, names, inquiry code, pace, and offer. Waveform duration/RMS/clipping checks only detect technical failures. The saved status is rendered_needs_listening. A20–35-second target is editorial guidance; the receipt reports actual duration. Audio generation alone never marks a queue item ready or published.

The browser photo composer was verified with TikTok library music, not imported voice WAVs. The user explicitly authorized ten additional narrated slideshow videos on October28, separate from the original20 reservations. `node scripts/prepare-voice-tests.mjs` creates idempotent drafts101–110 from the first ten chronologically scheduled October28 carousels, without rewriting them. Each has a distinct GIỌNG101–110 code, sourceQueueId and video angle cohort. The daily carousel planner excludes these special test drafts.

Run `.\scripts\setup-video.ps1` once to download and integrity-check the pinned local video toolchain. Then `node scripts/render-voice-tests.mjs sakura-101` creates a1080×1440 H.264/AAC MP4 from the five intact source cards and stock narration. The local FFmpeg/ffprobe executable is selected with TIKTOK_FFMPEG or the ignored state/video-toolchain/package/ directory. The toolchain used here is @remotion/compositor-win32-x64-msvc4.0.506 from the npm registry; binaries are not redistributed in Git. Each preview is22seconds or longer to leave a short closing beat. The actual clip is probed for format, dimensions, streams and duration, but remains needs_listening_and_music. It contains no music yet; musicAdded:false is explicit in its receipt. Visual playback, pronunciation, background sound selection and browser publication still require verification. Do not call this a completed voice-and-trending-music post.

## Music rotation

Use [TikTok's Creative Center](https://ads.tiktok.com/creative/creativeCenter/trends) with Vietnam, a recent time window and business-use eligibility. Cross-check the exact sound ID in this account's picker. TikTok [recommends its Commercial Music Library for promotional content](https://support.tiktok.com/en/business-and-creator/creator-and-business-accounts/commercial-use-of-music-on-tiktok); account recommendation alone does not establish commercial clearance or a national trend rank.

The private musicCatalog stores soundId, title, artist, region:VN, checkedAt, trendRank, sourceUrl, businessUseVerified, availableInAccount and optional moods. These fields require observed evidence, not guesses. The planner accepts records checked within seven days, prefers story mood, and excludes the previous19 assigned sound IDs. This permits20 distinct sounds in a daily batch. If none qualifies, it returns needs_selection; it never silently repeats Chốt Đơn Ngay.

Final picker verification is required even for a selected catalog record. Keep music below speech when narration is used. Record sound ID and selection evidence with the post receipt. Compare impressions, reads and attributed inquiries at comparable post age; changing music is an experiment, not a guarantee of more impressions.
