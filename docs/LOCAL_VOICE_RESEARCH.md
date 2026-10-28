# Local Vietnamese voice research · October28,2026

The user wants faster, natural Vietnamese speech on this computer, without ElevenLabs. Windows An and Piper VAIS1000 failed listening review. The Kim Thanh VieNeu sample prompted further requests for speed and naturalness. No test video has been published from these samples.

## Repository evidence and decision

| Project | Evidence checked | Current decision |
| --- | --- | --- |
| [VieNeu-TTS](https://github.com/pnnbao97/VieNeu-TTS) | CPU/ONNX runtime, Vietnamese presets and voice-specific reading character. The style argument is ignored in v3 Turbo. | Installed and actually rendered offline here. Compare different natural-delivery presets before adding another engine. |
| [Kokoro-Vietnamese](https://github.com/iamdinhthuan/Kokoro-Vietnamese) | Dedicated Vietnamese G2P, named voicepacks and a documented CPU/ONNX command. [Model artifacts](https://huggingface.co/contextboxai/Kokoro-Vietnamese) identify Apache-2.0. | A local alternative for a subsequent trial; not installed or benchmarked here. No claim that its sound is better. |
| [VoxCPM2](https://github.com/OpenBMB/VoxCPM) | Vietnamese among supported languages;2B parameters. Standard deployment documents CUDA and about8GBVRAM; a separate GGUF CPU/Vulkan path exists. | This machine has15.5GBRAM and Intel Arc graphics. The GGUF path would require separate setup and measurement; not the first trial while the working CPU engine has untested presets. |

Repository popularity and model claims do not establish listener preference. Hardware fit above is an operating decision, not an audio-quality benchmark.

## Presets actually available in SDK3.8.3

| Preset | Installed metadata | Reason to test |
| --- | --- | --- |
| Kim Thanh | Female, Southern, story reading | Earlier sample; not selected as a conversational winner. |
| Adam | Male, Southern, natural reading | A regional candidate for HCMC product stories. |
| Ngọc Huyền | Female, Northern, natural reading | A contrasting natural-delivery candidate. |
| Thùy Dung | Female, Southern, news reading; upstream editor's pick | Selected B profile:1.2x, speaker-only reference style. Per-clip listening remains separate. |

These labels come from the installed SDK's preset JSON. They do not certify the perceived accent or naturalness. Use the same Sakura101 script to compare them. Measure duration rather than assuming the same speed multiplier yields the same pace across speakers. Keep Vietnamese tones, the first50orders offer, Sakura and GIỌNG101 intelligible.

The user rejected the Adam and Ngọc Huyền comparison as insufficiently natural, then specifically requested a Southern female voice. Retain those rejections; do not call either preset a winner. The later accepted B selection supersedes Thùy Dung's initial candidate status.

Later feedback supersedes that initial trial status: the earlier Thùy Dung1.2x profile was accepted, but revised footage narration still lacked the requested natural emphasis. Thục Đoan, the installed Southern female storytelling preset, was also rejected. No consenting training speaker is available. Further local experiments compare Mỹ Duyên's built-in Southern female reading preset and Thùy Dung with `use_ref_codes=False` while retaining its built-in speaker embedding. Same speed multiplier does not establish identical perceived pace. These are listening candidates, not trained voices or verified naturalness improvements.

The pinned SDK3.8.3 source was checked: short exclamations may normalize to periods; short chunks merge; the old style parameter is ignored. Only the documented nonverbal cues are mapped; invented emphasis tags can be spoken as text. The supported reference-code choice changes actual conditioning. See the [official SDK implementation](https://github.com/pnnbao97/VieNeu-TTS/blob/04044e1b8f822f946bafb2c88b716459f4164152/src/vieneu/v3turbo.py).

Latest decision: the user selected B, Thùy Dung1.2x with referenceStyle=speaker-only, and that profile is activated privately. The accepted101 script/WAV stays v6; only102–105 use shorter colloquial v7 copy, omitting the long spoken code ending while retaining printed caption/video attribution. Remaining delivery/pronunciation revisions in102–105 are pending; no exact wrong word has been identified. Preserve the accepted101 WAV. This profile decision does not approve every generated clip, establish naturalness metrics or train a new voice. The current dated immediate batch is five videos101–105 plus ten photo carousels201–210, preserving all accepted/scheduled items.

The [upstream model card](https://huggingface.co/pnnbao-ump/VieNeu-TTS-v3-Turbo) states that the bundled presets may generate commercial audio and that their rightsholders consented. Preserve its attribution and notices. The local plugin exposes presets only; it does not enroll or clone a person's voice.

## Local execution evidence

- SDK3.8.3; model revision61b85e3d937fbbacb387714180e8182823512523; codec revisionceff0d0749bfb3fa2d61149794ec6feef0d1e1ae.
- Model/config/voice assets have SHA-256 records in private storage. Inference ran with Python networking disabled and ONNX telemetry disabled.
- Real plugin stdio smoke test returned provider:vieneu, language:vi-VN and a rendered WAV. This verifies the packaged server, not that the desktop has loaded it into this chat.
- Kim Thanh1.15x produced20.953seconds. Retiming that same native waveform to1.30x produced18.527seconds; the user requested faster again.
- Audio checks measure waveform integrity, duration and clipping. Listening acceptance, final music mix and publication receipts remain separate.

See [voice operations](VOICE_AND_MUSIC.md) for setup and [the narration prompt book](../prompts/VOICE_TEST_OCTOBER28.md) for the scripts. Private WAVs and feedback receipts stay outside Git.
