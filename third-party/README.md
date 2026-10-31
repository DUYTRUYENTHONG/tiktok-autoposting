# Supplemental dependency notice

The local motion engine adapts the closed-form spring from [cth9191/animate](https://github.com/cth9191/animate) at7e5eb56 and selectively calls read-only QC from [Digital Samba Video Toolkit](https://github.com/digitalsamba/claude-code-video-toolkit) ateddb488. Full MIT notices are in [animate-MIT.txt](animate-MIT.txt) and [digitalsamba-video-toolkit-MIT.txt](digitalsamba-video-toolkit-MIT.txt). Exact source hashes and enabled components are recorded in [video-toolkits.json](../config/video-toolkits.json). Upstream cloud, voice and score workflows are not activated.

`@cfworker/json-schema@4.1.1` declares MIT in its installed package metadata but its npm file list omits a license file. The full repository MIT notice is preserved in [cfworker-json-schema-4.1.1-LICENSE.txt](cfworker-json-schema-4.1.1-LICENSE.txt).

Source: [cfworker/cfworker LICENSE.md at reviewed commit](https://github.com/cfworker/cfworker/blob/2b2bf0be2bd84ee2c0d695f33314709caa7f868d/LICENSE.md), accessed October31,2026. SHA-256: `376944252ab78ca6b41aee44ddea8894927ee67891e77e61eb9d59af63e35094`.

The bundle builder accepts this exact notice only for that exact package name/version/license and verifies its bytes. Other missing notices remain build failures. No V-TTS code, binaries, voice samples or model assets enter the Sakura plugin bundle.
