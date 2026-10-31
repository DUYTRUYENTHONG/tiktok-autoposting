# Gwen-TTS training preparation

Reviewed [Gwen source](https://github.com/ggroup-ai-lab/gwen-tts/tree/f0f24d8636596dc635323e02f41bee42bb64385e), [Gwen model card](https://huggingface.co/g-group-ai-lab/gwen-tts-0.6B) and [official Qwen single-speaker SFT](https://github.com/QwenLM/Qwen3-TTS/tree/022e286b98fbec7e1e916cb940cdf532cd9f488e/finetuning) on October31,2026. Source checkouts stay private under `state/upstream`. No upstream model inference/training code was executed or model weights downloaded.

Gwen's model card declares MIT; source package metadata also says MIT, although no standalone license file was present in the reviewed Gwen checkout. This is a better commercial-adoption candidate than the noncommercial V-TTS review. Model licensing does not establish consent to imitate the named people in its bundled reference recordings. Those recordings and the README's TikTok-crawled training-data claim are not our consented training corpus. No bundled reference speaker is activated.

Gwen is derived from Qwen3-TTS-0.6B. Its own repository supplies inference, not a trainer. The reviewed Qwen trainer supports single-speaker full-parameter SFT; it is not the VieNeu LoRA implementation. Its documented input rows contain `audio`, `text`, `ref_audio`. `prepare_data.py` adds real tokenizer `audio_codes`; the SFT script trains parameters and saves a custom-voice checkpoint. Compatibility of the specific Gwen checkpoint with that trainer has not yet been smoke-tested, so the bridge is preparation-only.

## Implemented bridge

```powershell
npm run voice:gwen:prepare
# Optional: -- --manifest C:\private\human-corpus.json --output C:\private\gwen-prepared
```

The wrapper uses the already configured local Python. It loads only our standard-library corpus validator/exporter, not Gwen/Qwen/PyTorch. It never downloads dependencies, models, encodes audio, trains or activates a voice.

The existing validator first requires original human recordings, consent, transcript/listening review, waveform checks, at least100unique clips and600seconds, and source/session/text-group-separated train/validation/test splits. These are our inherited corpus gates, not a claimed universal Qwen minimum. Validated splits export to upstream-compatible raw JSONL, with one consistent reference taken only from train. Audio hashes and split hashes are checked again; changed sources, synthetic rows, speaker mixing and duplicate audio fail. Stable dataset/config fingerprints preserve versioned exports. Held-out rows remain separate; the upstream trainer has no integrated held-out evaluation in the reviewed script.

The bridge records `trainingReady:false` even after successful raw export. Training additionally needs reviewed local Gwen/tokenizer snapshots, an isolated pinned dependency environment, appropriate hardware, explicit execution authorization and a held-out evaluation runner. The official trainer hardcodes bf16/FlashAttention2 and updates all parameters. README's4GB VRAM statement describes tested inference, not a verified training minimum. No CPU/Intel Arc training fallback is claimed.

Current execution: no consented corpus is available; the preparation command reports blockers and exports no training rows. The existing local trainer's hardware probe found no qualifying NVIDIA CUDA device. No voice model has been trained or replaced. [gwen-config.json](../voice-training/gwen-config.json) pins model, tokenizer and source revisions without downloading weights.

## RAG and pronunciation correction

The [voice correction memory](V_TTS_REVIEW.md) remains separate from acoustic training. It retrieves exact-profile feedback to guide a new script/review prompt. Feedback from VieNeu does not transfer as a pronunciation judgment to Gwen; the profile/model filter abstains. Accepted synthetic previews are not human training positives. Each eventual Gwen recording needs its own provenance and listening approval. Photo carousel WAV attachment still depends on the native composer; a narrated slideshow video is a separate format.

Voice Lab's read-only `voice_provider_review` now accepts `provider: "gwen-tts"` and reports preparation-only status. The active renderer remains the accepted local VieNeu profile.
