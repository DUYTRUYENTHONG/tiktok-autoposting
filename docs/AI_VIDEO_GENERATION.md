# AI video generation skill source and use

The requested `ai-video-generation` skill is installed at `C:\Users\CROSSIAN\.codex\skills\ai-video-generation\SKILL.md`. It is available to Codex on the next turn. Installation copied only the upstream Markdown skill; it did not install or run a video provider.

## Pinned source

- Requested repository: [101-skills/skills](https://github.com/101-skills/skills), which redirects to `inference-sh/skills`.
- Installed file: [tools/video/ai-video-generation/SKILL.md at commit `0cbf91c26ada28702c79962406286f0c14292150`](https://github.com/inference-sh/skills/blob/0cbf91c26ada28702c79962406286f0c14292150/tools/video/ai-video-generation/SKILL.md).
- Upstream Git blob: `8614f8c62f58b3d548d89acb3e325b77dd830063`; installed file SHA-256: `30521e6262ed22b6f548c9dd636b667fee916bc3ce9c747a208b8daa46aff427`.
- The skill directory contains one `SKILL.md` file. The repository has no root `LICENSE` file, and GitHub reports no declared license. Check usage terms before redistributing or modifying the source.

The skill lists text-to-video, image-to-video, reference-to-video, video editing, lipsync, upscaling, sound effects and merging through inference.sh `belt` app IDs. These are upstream claims and examples, not locally verified model availability or output quality. Its commands require the `belt` CLI, account authentication and provider access. `belt` is not installed in the current environment; authentication, pricing, credits and model access were not tested. No remote bootstrap, model weights, provider CLI, login, uploads or paid generation job was run during installation.

## Fit with the current Sakura workflow

Use the existing [footage editing workflow](FOOTAGE_EDITING.md) as the source of truth. If a future AI clip is generated, treat it as illustrative context. It cannot establish Sakura cleaning efficacy, a customer result, or an authentic product demonstration. Keep the verified Sakura packshot and label separate from generated or Pexels scenes, retain source and byte hashes, inspect the edited output, and disclose generated material as required in the posting workflow.

The locally accepted voice profile remains **Thùy Dung, 1.2×, speaker-only**. This skill does not change the accepted WAVs or their listening approvals. A new narration or changed mix needs its own review. Native TikTok music selection and the final browser preflight remain separate from video rendering; installing this skill creates no scheduled or published post.
