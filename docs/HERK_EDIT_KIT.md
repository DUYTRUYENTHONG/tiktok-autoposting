# Herk Edit Kit integration

Upstream: [nateherkai/herk-edit-kit](https://github.com/nateherkai/herk-edit-kit), pinned to `10511e5af86fc47756ea89803b397422e2d89284`. The full checkout is private at `state/upstream/herk-edit-kit`. Its15 Codex skills were installed through the standard skill-installer at the pinned revision; they become available on the next chat turn. The Sakura entrypoint is [vn-herk-edit](../skills/vn-herk-edit/SKILL.md), with provenance in [config/herk-edit-kit.json](../config/herk-edit-kit.json).

Read the upstream short-form-edit skill, editing playbook, storytelling and caption references from that checkout. Keep its root-relative helpers and sibling references intact. Global skill files alone are insufficient without the supporting kit root. The installed skills do not change the Sakura account, posting rules, voice approvals or source evidence.

The useful workflow is: source footage and reference review → three truthful hooks → story/payoff and call CTA → exact narration → source-mapped cuts and captions → purposeful movement and quiet music → encoded draft and actual listening/playback review. A structural validator cannot certify natural Vietnamese, commercial performance or cleaning efficacy.

## Local bridge

For a fresh Sakura checkout, obtain the complete supporting kit before using the bridge:

```powershell
git clone https://github.com/nateherkai/herk-edit-kit.git state/upstream/herk-edit-kit
git -C state/upstream/herk-edit-kit checkout --detach 10511e5af86fc47756ea89803b397422e2d89284
```

Preserve an existing checkout rather than overwriting it. Do not run upstream setup, cloud helpers or copy AIS branding as part of these commands. Skill installation was performed separately with the standard Codex installer using this same pin and all15 `.agents/skills/<name>` paths.

```powershell
npm run edit:kit -- inspect C:\private\scale-video-receipt.json --review C:\private\exact-listening-feedback.json
npm run edit:kit -- prepare C:\private\scale-video-receipt.json --review C:\private\exact-listening-feedback.json --run-footage-validator
```

The bridge checks actual input bytes, exact WAV/script/ASR bindings and the checkout pin. It copies source footage, product reference, narration, preview, raw ASR and a no-cut EDL into ignored `state/herk-edits/`. Original recognized text and timestamps remain unchanged; invalid ASR chunks are flagged and retained in the raw file. Crossfade overlap is declared. Missing word anchors/caption/event plans stay missing rather than being invented to pass the plan validator.

Actual smoke verification used the emphasis-rejected narration candidate: four copied footage assets passed the hash-checked upstream footage validator, exact narration bytes were preserved, and the draft stayed unready. No listening or publication approval transfers from the source. An export is editable preparation, not a new render or schedule.

Local Node/FFmpeg tools and existing local Whisper/VieNeu remain the production path. No upstream ElevenLabs/Kie/OpenAI cloud call was enabled. HyperFrames/GSAP/browser rendering have not been provisioned or validated by skill installation. Several storytelling QA names are prescriptions whose scripts are absent from this pin; do not report those as passing tests.

Original kit material permits commercial use while retaining LICENSE and pipeline permission. HyperFrames, GSAP, fonts and embedded media retain separate terms. AIS logos, brand tokens and example brand media are expressly excluded from Sakura output. Preserve the pinned checkout's LICENSE, THIRD_PARTY_NOTICES.md and licenses directory; do not copy unrelated brand assets into production.
