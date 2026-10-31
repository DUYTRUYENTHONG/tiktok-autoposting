# V-TTS adoption review and voice-correction memory

Reviewed October31,2026 at commit [`e22eef3267869375e40a096b376cde94aa41e610`](https://github.com/tronghieuit/v-tts/tree/e22eef3267869375e40a096b376cde94aa41e610). The private checkout is `state/upstream/v-tts`; LFS smudge was disabled. Upstream inference, installers and executables were not run. No additional model download, cloning or training was performed.

**Decision: do not activate V-TTS for Sakura commercial content.** The [license](https://github.com/tronghieuit/v-tts/blob/e22eef3267869375e40a096b376cde94aa41e610/LICENSE) is CC BY-NC4.0; the [README](https://github.com/tronghieuit/v-tts/blob/e22eef3267869375e40a096b376cde94aa41e610/README.md) expressly requires written permission for commercial use. No such permission is available. A future commercial permission would also need to cover the intended code, weights, voices and outputs; this review does not establish those rights. Upstream code/media are not vendored into our plugin.

## Fit for the demand

| Need | Source observation | Decision |
| --- | --- | --- |
| Southern female voice | README identifies preset `SF`; five multi-speaker voices are documented | Candidate metadata only; no listening-quality evaluation |
| Faster short narration | [`v_tts/tts.py`](https://github.com/tronghieuit/v-tts/blob/e22eef3267869375e40a096b376cde94aa41e610/v_tts/tts.py) passes `speed` to VITS `length_scale` | Lower values are faster. A desired1.2× rate would start near0.8333, followed by duration/listening checks; do not reuse our current1.2 parameter directly |
| Expressive delivery | README describes prosody transfer in the separate zero-shot reference-audio architecture | Does not prove an emotion control or expressive SF preset; no consenting reference speaker is available |
| Offline operation | Constructors auto-download missing models; text code also lazily loads a PhoBERT tokenizer | Not a verified offline package. Explicit local assets, dependency review and pinned hashes would be needed before any future isolated run |
| Reels/videos | Synthesis APIs return audio arrays/WAVs | Suitable interface shape in principle; no rendered test or benchmark executed |
| Photo carousels | Local audio output is separate from TikTok's composer | Do not promise WAV attachment. A narrated slideshow video is a distinct native format |
| Existing LoRA | Our configuration targets VieNeu v3Turbo backbone; V-TTS uses a VITS-family synthesizer | Existing adapters/trainer are not drop-in compatible. No V-TTS training workflow was validated |

README parameter counts, realtime factors and subjective voice descriptions remain author claims, not measurements on this computer. Package metadata uses loose dependency bounds while requirements pin another set; a source-path import of the root `infer.py` also needs installation testing. [`infer.py`](https://github.com/tronghieuit/v-tts/blob/e22eef3267869375e40a096b376cde94aa41e610/infer.py) uses `torch.load(...,weights_only=False)` and permissive state loading. An eventual trial requires reviewed trusted checkpoints in isolation; none were loaded here.

Direct model-page checks for the documented pretrained and ONNX repositories were unavailable/unauthorized through the research tool. This does not prove that the repositories are absent; their current accessibility and separate weight/output license terms remain unverified. No login, download or alternate model was substituted.

## Implemented in our kit

[voice-corrections.mjs](../src/knowledge/voice-corrections.mjs) is original provider-independent negative-review memory. CLI:

```powershell
npm run voice:corrections -- record "C:\private\review-request.json"
npm run voice:corrections -- query "C:\private\query-request.json"
npm run voice:corrections -- status
```

A review request supplies an absolute exact narration receipt, account/product, issue, affected text, actual user feedback, source reference and review timestamp. Audio/script/receipt hashes are checked against the real files. Event identity is stable; conflicting reimports fail. The private ledger lives below the current voice home, outside Git. A changed source WAV, script or receipt causes retrieval to fail rather than reuse detached feedback.

Queries supply an absolute narration receipt and correction question. Retrieval filters exact provider, preset, speed, conditioning, model and runtime configuration, plus product/account and time. It uses lexical overlap through the existing genuine LangChain pipeline and returns source citations with unresolved feedback. It does not load embeddings, synthesize an answer, change the WAV, approve a replacement, train a model, authorize an offer or publish content. This corpus is separate from campaign facts. A query about pronouncing “giá” is not interpreted as evidence of the product's price.

Sakura Voice Lab0.4 adds read-only `voice_provider_review` and `voice_correction_context` tools. Existing voice tools remain. The build checks notices for dependencies entering either bundle, including a reviewed supplemental MIT notice omitted from one npm package. Rebuilding the plugin does not prove the current chat has reloaded its new tools.

## Fine-tuning and correction limits

The existing [training preparation](../voice-training/config.json) requires original consenting human speech, reviewed transcripts, at least100unique clips and600seconds, valid splits and suitable training hardware/environment. A user rejecting a synthetic take provides an evaluation observation, not correct target speech. Neither the content nor voice model has been trained by this work. No accepted pronunciation replacement exists for the currently rejected guest opening.

Executed non-training readiness check:0clips/0seconds, corpus unavailable, no qualifying local NVIDIA CUDA GPU detected by the existing trainer's probe, and trainingReady=false. This does not rule out CPU inference or other future hardware; it shows this configured trainer is not ready here. The report is stored outside Git at the private voice home's `reviews/v-tts/training-preflight/readiness.json`. Actual feedback ingestion and a local LangChain query retrieved the user's first-sentence rejection, with approvedCorrection=null and modelTrained=false.

RAG helps retrieve what was rejected, the precise affected wording, current product facts and later genuinely accepted corrections. Vocal prosody and phoneme realization still come from the synthesizer. RAG is not a fine-tuned voice and cannot guarantee naturalness. Our installed VieNeu normalizer has separately been observed to replace punctuation on very short questions; that finding is not automatically a V-TTS normalization rule.

The [refined review prompt](../prompts/v-tts-adoption-review.md) was executed through the clone, source review, original correction-memory implementation, tests and real local feedback retrieval. Private execution artifacts remain under `state/v-tts-review/`; consult their actual results rather than treating this design as proof that V-TTS synthesis or training ran.
