# Vietnamese narration and music

The user requested spoken stories and a different suitable trending sound for each carousel. Existing accepted commercial posts remain unchanged: the account's Studio view does not offer sound editing, and the user asked to preserve the original schedules. Do not delete and recreate them to change audio.

## Sakura Voice Lab

The separate local plugin is in [plugins/sakura-voice-lab](../plugins/sakura-voice-lab). Its four MCP tools are voice_status, voice_presets, voice_brief and render_voice. They check local assets, list preset voices, prepare attributed Vietnamese scripts and render WAV previews. Rendering does not post, attach audio, change a schedule, or approve pronunciation.

The user rejected both Windows An and the Piper VAIS1000 preview as robotic, requested faster speech, and then chose **our own local system without ElevenLabs**. Sakura Voice Lab0.3 integrates the local [VieNeu-TTS v3 Turbo](https://huggingface.co/pnnbao-ump/VieNeu-TTS-v3-Turbo) backend and its real reference-code selector. The plugin is our integration around existing open-source weights, with upstream attribution retained. It uses the CPU/ONNX backend, built-in presets and pitch-preserving speed adjustment; no cloud speech request or customer voice cloning is exposed.

Use a real Python3.12 installation and the existing pinned FFmpeg toolchain:

```powershell
python scripts/setup-vieneu.py --ffmpeg "C:\absolute\ffmpeg.exe" --activate
node scripts/voice-batch.mjs sakura-101 --voice "Thùy Dung" --speed 1.2 --reference-style speaker-only
```

Setup pins SDK3.8.3, model revision61b85e3d937fbbacb387714180e8182823512523 and codec revisionceff0d0749bfb3fa2d61149794ec6feef0d1e1ae. It downloads assets once into private storage, records SHA-256 values and backs up a previous runtime when activating. Without --activate it writes a candidate configuration only. Each render verifies those hashes, disables network connections in the Python worker and produces a new cache key for the selected preset, speed, referenceStyle and script. Allowed speed is1.0–2.0. The accepted B profile is Thùy Dung1.2x with referenceStyle=speaker-only, activated privately; prior rejected versions remain rejected. New setup/profile choices still require listening. See [research and local execution evidence](LOCAL_VOICE_RESEARCH.md).

The latest dated publish-now batch is videos101–105 plus photo carousels201–210, with different suitable music for all15. The older106–110 drafts are deferred. Keep the rejected browser draft separate from an approved revision; its saved music does not update when a local WAV changes. No new narration is publication-ready merely because a model loads or waveform QA passes.

October28 update: the user accepted the earlier Thùy Dung1.2x sample, then requested stronger hooks and rejected the new footage delivery for emphasis. A shorter Thùy Dung script and Thục Đoan storytelling sample also remained below the requested naturalness. The user has no consenting recording speaker and chose continued local preset experiments. Keep these actual feedback records; do not publish the rejected versions or call either model fine-tuned.

Voice Lab0.3 adds the real v3Turbo `use_ref_codes` choice as `referenceStyle`: `preset` retains the built-in reference codes; `speaker-only` keeps the built-in speaker embedding while omitting those style codes. This is an experiment, not an emotional-style guarantee. No reference recording, voice cloning, new weight or cloud request is involved. The selection is included in the audio cache key and receipt. CLI: `--reference-style speaker-only`; MCP render_voice: `referenceStyle: "speaker-only"`. The old `style=` argument is still ignored by upstream and is not exposed as a working control.

The user subsequently selected B (Thùy Dung1.2x, speaker-only). The accepted101 script/WAV remains exactly v6;102–105 now use shorter colloquial v7 dialogue, with printed GIỌNG codes retained and the long spoken code ending omitted. Remaining delivery/pronunciation revisions and actual clip listening for102–105 remain pending; no exact wrong word has been identified. Preserve the accepted101 WAV. Profile approval is recorded independently of each clip approval. No content or voice adapter has been trained.

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

The browser photo composer was verified with TikTok library music, not imported voice WAVs. The original `scripts/prepare-voice-tests.mjs` prepares historical drafts101–110 from source carousels without rewriting them; it is not fresh publication authorization. The latest user instruction narrows the immediate video batch to101–105 and adds ten new photo carousels201–210. Preserve sourceQueueId and GIỌNG101–105/ẢNH201–210 attribution, all accepted/scheduled items and deferred106–110 drafts. The daily planner excludes these special voice-test drafts.

Run `.\scripts\setup-video.ps1` once to download and integrity-check the pinned local video toolchain. Then `node scripts/render-voice-tests.mjs sakura-101` creates a1080×1440 H.264/AAC MP4 from the five intact source cards and stock narration. The local FFmpeg/ffprobe executable is selected with TIKTOK_FFMPEG or the ignored state/video-toolchain/package/ directory. The toolchain used here is @remotion/compositor-win32-x64-msvc4.0.506 from the npm registry; binaries are not redistributed in Git. Each preview is22seconds or longer to leave a short closing beat. The actual clip is probed for format, dimensions, streams and duration, but remains needs_listening_and_music. It contains no music yet; musicAdded:false is explicit in its receipt. Visual playback, pronunciation, background sound selection and browser publication still require verification. Do not call this a completed voice-and-trending-music post.

## Music rotation

Use [TikTok's Creative Center](https://ads.tiktok.com/creative/creativeCenter/trends) with Vietnam, a recent time window and business-use eligibility. Cross-check the exact sound ID in this account's picker. TikTok [recommends its Commercial Music Library for promotional content](https://support.tiktok.com/en/business-and-creator/creator-and-business-accounts/commercial-use-of-music-on-tiktok); account recommendation alone does not establish commercial clearance or a national trend rank.

The private musicCatalog stores soundId, title, artist, region:VN, checkedAt, trendRank, sourceUrl, businessUseVerified, availableInAccount and optional moods. These fields require observed evidence, not guesses. The planner accepts records checked within seven days, prefers story mood, and excludes the previous19 assigned sound IDs. This permits20 distinct sounds in a daily batch. If none qualifies, it returns needs_selection; it never silently repeats Chốt Đơn Ngay.

Final picker verification is required even for a selected catalog record. Keep music below speech when narration is used. Record sound ID and selection evidence with the post receipt. Compare impressions, reads and attributed inquiries at comparable post age; changing music is an experiment, not a guarantee of more impressions.
