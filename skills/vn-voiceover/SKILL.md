---
name: vn-voiceover
description: Prepare and render Vietnamese product-story narration with Sakura Voice Lab, preserving product attribution and requiring pronunciation review before use.
---

# Lời kể sản phẩm tiếng Việt

Use the selected product, angle and queue ID. Write a short spoken hook, one everyday situation and one clear CTA. Speak numbers naturally; do not read hashtags, URLs or long captions. Preserve the verified offer and explain that the character is illustrative in the accompanying caption. Never invent a testimonial, result or person's voice.

The user chose our own local voice system, without ElevenLabs. Windows An and the Piper VAIS1000 candidate were rejected as robotic; faster delivery is requested. Prefer the configured VieNeu-TTS v3 Turbo preset engine after checking actual readiness. Use voice_presets for the installed catalog, then render_voice with a preset and speed chosen from the actual sample duration. Regional labels come from upstream metadata, not a verified listener judgment. Do not fall back to a rejected voice or call a style parameter expressive when the engine ignores it.

Latest preference: a Southern female voice. Adam and Ngọc Huyền samples were rejected as insufficiently natural. Trial Thùy Dung, a Southern female preset in the installed metadata, at a brisk but intelligible pace;1.2x is a starting candidate. Do not infer listening approval from a gender/accent choice.

The latest Sakura hook starts with “Mua một, tặng một! Chỉ năm mươi đơn đầu tiên từ Tích Tóc.” It refers to50orders, not customers; redemption counts are unknown. Follow with a provocative but honest pain point, then a useful response and post-specific inquiry code. Debate household habits or mistaken assumptions; do not invent efficacy, fake urgency, personal testimony or competitor accusations. Existing accepted posts keep their older terms.

Use Sakura Voice Lab's voice_brief and render_voice tools when connected. Otherwise use the repository's scripts/voice-batch.mjs CLI after checking the local runtime. scripts/setup-voice.ps1 selects an already-installed Vietnamese Windows stock voice. The optional scripts/setup-voice.py installs Piper and its pinned VAIS1000 model. Neither stock voice is a verified Southern accent or a premium human performance. Never treat an installed skill as an installed audio engine.

scripts/setup-vieneu.py installs a pinned SDK and model/codec revisions into private storage. Rendering uses preset voices, cached models and a network-disabled subprocess; it exposes no cloning or cloud provider calls. Preserve model notices and asset hashes. A new setup or voice/speed choice creates a fresh listening candidate. See the repository's docs/VOICE_AND_MUSIC.md for setup and acceptance.

Keep generated audio and receipts private, retaining model revision, license attribution, script, checksum and duration. Technical waveform checks do not prove natural pronunciation. Review the actual sound for Vietnamese tones, Sakura, the lead code, pacing and offer meaning; rendered_needs_listening is not ready_to_publish. Include the supplied model credit when using audio publicly. Keep TikTok AI and commercial disclosures.

A WAV file does not attach itself to a photo carousel. Verify the selected TikTok composer's supported audio controls. Existing commercial posts have app-only editing restrictions; do not delete/recreate them. The user authorized ten additional narrated slideshow videos on October28, separately from the original20 reservations. Those drafts retain sourceQueueId and use new GIỌNG101–110 inquiry codes and video angle attribution. Other conversions still require applicable authorization. Keep music quiet under speech and use a currently verified commercial-use track; do not promise impressions from trend status.
