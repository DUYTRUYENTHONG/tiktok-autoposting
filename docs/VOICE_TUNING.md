# Southern female voice adapter workflow

The user accepted the local **Thùy Dung, 1.2×** synthetic preset sample. That acceptance permits its use in reviewed previews; it does not establish that we trained a voice. This workflow prepares a separate single-speaker VieNeu LoRA experiment. It never changes the active voice runtime, uploads recordings, uses provider keys, starts a cloud job, or publishes content.

**Actual readiness on October 28, 2026:** no consented human corpus exists at the configured private path; validation found **0 clips / 0 seconds**. This Intel Ultra 5 / Arc computer has no detected NVIDIA CUDA GPU. Training and adapter deployment are blocked. No adapter was trained, no training extras were installed, and no naturalness improvement is claimed. Thùy Dung and earlier generated previews are synthetic output, never human training data.

## Compatible, pinned upstream

- [VieNeu source and training README at commit 04044e1b8f822f946bafb2c88b716459f4164152](https://github.com/pnnbao97/VieNeu-TTS/blob/04044e1b8f822f946bafb2c88b716459f4164152/finetune/README.md), SDK 3.8.3.
- [Training loop](https://github.com/pnnbao97/VieNeu-TTS/blob/04044e1b8f822f946bafb2c88b716459f4164152/finetune/train_lora.py) and [LoRA module](https://github.com/pnnbao97/VieNeu-TTS/blob/04044e1b8f822f946bafb2c88b716459f4164152/finetune/vieneu_lora/lora.py). This is the v3 Turbo codec/phoneme/speaker-embedding architecture, not a generic text SFT trainer or a v1/v2 recipe.
- [Base model revision 61b85e3d937fbbacb387714180e8182823512523](https://huggingface.co/pnnbao-ump/VieNeu-TTS-v3-Turbo/tree/61b85e3d937fbbacb387714180e8182823512523), PyTorch weights in `update/`. The small [artifact lock](../voice-training/base-artifacts.json) records published Git blob SHA-1 for regular files and LFS SHA-256 for weights/encoders. It contains metadata, not weights.
- [MOSS ONNX codec revision ceff0d0749bfb3fa2d61149794ec6feef0d1e1ae](https://huggingface.co/OpenMOSS-Team/MOSS-Audio-Tokenizer-Nano-ONNX/tree/ceff0d0749bfb3fa2d61149794ec6feef0d1e1ae). The existing runtime manifest additionally verifies cached ONNX graphs and codec bytes. No latest-branch resolution happens during training/evaluation.

Upstream requires CUDA and estimates roughly 6 GB VRAM for default LoRA training; available memory and bfloat16 are checked again at execution. CPU/ONNX preparation is supported, but **upstream merged fine-tunes currently run on GPU/PyTorch only**. The existing CPU ONNX graphs do not load an adapter. Intel Arc and 15.5 GB system RAM do not satisfy the pinned trainer's CUDA requirement. There is no paid/cloud fallback or unverified ONNX export step here.

## Private corpus contract

Copy [corpus.example.json](../voice-training/corpus.example.json) to `%USERPROFILE%\.codex\data\tiktok-autoposting\voice\training\corpus.json` and populate it only from original recordings by one consenting adult Southern Vietnamese female speaker. The example declares `example-only` and cannot pass readiness. Use `purpose: "human-training"` only for an actual reviewed human corpus. Keep audio, transcripts, consent evidence, embeddings, datasets, weights and listening reports outside the repository. Preparation rejects paths inside the checkout, including resolved symlinks. Do not place private media or identity documents in Git.

For each speaker, retain nonempty signed evidence covering local TTS training and commercial synthesis, a matching SHA-256, a non-future signing date and `revoked:false`. Review the evidence manually; the validator verifies supplied attestations and bytes, not legal authenticity or identity. A revocation blocks subsequent encoding/training/evaluation. Remove previously prepared derivatives manually when permission is withdrawn; revalidation does not itself erase them.

Each clip requires `sourceKind: "human-recording"`, speaker/consent IDs, original `sourceId`, recording `sessionId`, and a `textGroup` shared by repeated or paraphrased scripts. Transcripts and clean speech must be listened to and explicitly reviewed. Record conversational Southern delivery, varied hooks, questions, pauses, prices, offer limits and product names accurately; record no invented product performance claims. Unknown online speakers and generated preset speech are excluded.

Use original lossless recordings. Intake requires **PCM16 mono 48 kHz WAV**, **3–15 seconds**, **10–600 characters / 3–100 whitespace words** per clip. Preserve the original if converting a lossless recording; transcoding an MP3 to WAV does not make its source lossless. Validation checks the WAV header, complete PCM bytes, RMS, clipping and excessive silence. Listening must still catch background music, echo, wrong accents and transcript mismatch.

Policy minimum: **100 distinct clips and 10 minutes** after rejection/deduplication, consistent with upstream's 10–30 minute single-speaker guidance. This is a starting threshold, not a quality guarantee. Exact normalized transcripts and decoded PCM duplicates fail validation. Session, original source, declared script family and near-duplicate transcript components stay in one split. Deterministic grouped allocation reserves approximately 10% validation and 10% untouched test, depending on group sizes. At least three independent groups are mandatory; one long session is insufficient. Same speaker across splits is intentional for a single-speaker adapter. Test is never used for training, early stopping or enrollment.

## Run preparation now

Use the already installed Python executable, not the Windows Store alias:

```powershell
$py = "$env:USERPROFILE\.codex\data\tiktok-autoposting\voice\vieneu\runtime\Scripts\python.exe"
& $py scripts/prepare-voice-training.py
node --test test/voice-training.test.mjs
```

The validator uses only Python's standard library, writes the private `voice/training/prepared/readiness.json`, and exits **2** while full training preflight remains unverified. `TIKTOK_VOICE_HOME` changes the private root. Optional `--manifest` and `--output` must point outside the checkout. Missing data still produces an honest report with `dataReady:false`, `trainingReady:false`, `deploymentReady:false` and `naturalnessImprovement:null`. Valid data produces an immutable dataset directory named by its corpus/audio hash, grouped JSONL splits, `metadata.csv` and copied `raw_audio/`. `corpusAndHardwareReady` distinguishes those two gates from full environment readiness; only `run.py` can mark `launch-readiness.json` training-ready after verifying pinned source/assets/dependencies/CUDA and loading the model, training data and optimizer. Dataset IDs include consent attestations and source/audio hashes. Transcript histograms report whitespace words, explicitly not phoneme tokenizer tokens; the runner validates the actual tokenizer length budget and refuses silently dropped rows.

## Optional local CUDA experiment, after corpus and hardware exist

The following is an executable path for a separately available, authorized local CUDA machine. **Do not run setup on this CPU/Arc host expecting training to work.** No such machine or permission to procure one is assumed. Keep the current inference environment intact. Preparation/tests never install these dependencies or download weights.

Clone the source into private storage and check out exactly the commit above. Retain its Apache-2.0 license. Create a separate Python environment; install CUDA PyTorch using the command in the pinned upstream README, then its training extras and [direct version pins](../voice-training/requirements-training.txt). For example, inside that separate environment:

```powershell
python -m pip install torch==2.8.0 torchaudio==2.8.0 --index-url https://download.pytorch.org/whl/cu128
python -m pip install -e "C:\private\VieNeu-TTS[finetune]"
python -m pip install -r voice-training/requirements-training.txt
python -m pip freeze > C:\private\training-environment.txt
```

The entry checks direct package versions, the exact clean Git checkout, pinned local model bytes, existing runtime/codec hashes and offline cache refs. Transitive dependencies and GPU execution still require acceptance on the target machine; they were not exercised here. Supply a **complete local pinned snapshot** containing both the current CPU ONNX assets and `update/` PyTorch files. The current inference-only snapshot lacks the training weights/encoders; do not describe it as a training install. The entry refuses missing files and disables network connections before loading the SDK. There are no automatic model downloads.

```powershell
$common = @('--manifest','C:\private\voice\training\corpus.json',
  '--prepared','C:\private\voice\training\prepared',
  '--upstream','C:\private\VieNeu-TTS',
  '--base','C:\private\complete-pinned-base-snapshot',
  '--runtime-config','C:\private\voice\runtime.json')
python voice-training/run.py encode @common --output C:\private\voice\encode-receipts
python voice-training/run.py train @common --output C:\private\voice\runs\southern-001
python voice-training/run.py evaluate @common --adapter C:\private\voice\runs\southern-001\adapter --render-comparison --output C:\private\voice\eval\southern-001
```

`encode` calls the pinned upstream phonemizer, MOSS codec and 192-dimensional speaker encoder on CPU, then restores the preassigned splits. It fails if any row was skipped. Cached encodings bind the current source/codec/config revisions, original split hashes, exact filename membership and transcripts; mismatches require rebuilding. Dataset fingerprints include the split policy. `train` uses the upstream data/loss/LoRA modules with explicit splits, preventing upstream's random row holdout from leaking related recordings. [config.json](../voice-training/config.json) records every hyperparameter: backbone attention/MLP rank16, alpha32, dropout0.05, learning rate0.0002, AdamW weight decay0.01, cosine schedule, 5% warmup, batch1/accumulation16, non-reentrant gradient checkpointing (required with frozen embedding inputs), clip norm1, max length1024, bf16 and at most3epochs. A small backbone-only adapter limits capacity and preserves the acoustic decoder. It saves only validation improvements and stops after two unimproved evaluations; test data is inaccessible to the training loop. Logs distinguish mean training loss per example from token-weighted validation loss, codebook-0 accuracy, text/audio-code perplexity and learning rate. Adapter provenance binds exact weight/config hashes and every split hash. No improvement over initial validation means no accepted adapter.

## Paired evaluation and listening

`evaluate` verifies adapter/corpus/base/config/split provenance and exact adapter bytes, then compares the same untouched test rows with base and adapter. It reports held-out weighted loss, text/audio loss, codebook-0 accuracy, text perplexity, audio-code perplexity and teacher-forced runtime. Cross-entropy and accuracy are weighted by actual supervised target counts across the corpus; utterance-average losses are not presented as corpus perplexity. Audio-code perplexity is diagnostic; it is not a speech naturalness score, and teacher-forced runtime is not synthesis speed.

With `--render-comparison`, it privately exports derived weights with the upstream license/model card, then renders at most five pairs of held-out sentences. Both models receive the **same training-only speaker embedding**, no reference codes, equal temperature/seed and speed1.0. This compares adaptation on the consented speaker, not an unrelated stock voice. Receipts record actual WAV hashes, duration, clipping and warmed synthesis latency/real-time factor separately. Loading/warmup is excluded explicitly. Outputs remain `needs_listening`; no voice is activated.

Listen to randomized A/B order with a Vietnamese Southern listener; keep model labels concealed while scoring where practical. Complete `listening-review.template.json` with actual heard transcripts, 1–5 naturalness, Southern accent and pronunciation ratings, and offer/name correctness. Include the current first50-order offer and difficult names in the corpus/test material; never infer their correctness from loss alone.

```powershell
python voice-training/score-listening.py --manifest C:\private\voice\training\corpus.json --prepared C:\private\voice\training\prepared --comparison C:\private\voice\eval\southern-001\base-vs-adapter.json --review C:\private\voice\eval\southern-001\listening-review.json --output C:\private\voice\eval\southern-001\listening-results.json
```

Scoring revalidates current corpus/consent and its dataset fingerprint, then verifies exact audio hashes, unique complete pairs with matching reference scripts and a timezone-aware review timestamp that is not in the future. It computes word error rate from human transcriptions and compares mean ratings. Lower held-out loss, improved reviewed naturalness, accent/pronunciation at least4/5, no WER regression and correct offers/names only produce `candidateForUserListening`. A five-sentence comparison cannot establish broad improvement. User listening acceptance, wider edge-case review and supported inference hardware are still required. `deploymentReady` remains false; this workflow has no automatic merge into the active Sakura runtime or CPU ONNX deployment.

## Verification completed here

`node --test test/voice-training.test.mjs` executes twenty-two bounded synthetic technical fixtures for audio format/levels, duration, private paths, missing corpus, synthetic exclusion, consent revocation/hash/empty-evidence checks, filename collisions, transcript/audio duplicates, deterministic grouped splits, near-duplicate leakage, cached holdout/transcript/config binding, changed prepared splits, adapter checksums, token-weighted perplexity, paired listening integrity and scoring-time consent revalidation. The CLI help runs without importing GPU training dependencies. The checked-in fixture generator never qualifies as a human corpus. Python compilation, these fixture checks and an actual blocked readiness run validate preparation/control flow; GPU encoding, training and rendered base/adapter quality remain unexecuted because the required corpus/hardware are absent.
