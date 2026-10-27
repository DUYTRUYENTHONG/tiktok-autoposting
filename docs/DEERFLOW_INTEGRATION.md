# DeerFlow and creative-provider integration

Reviewed October27,2026. Local sibling checkout: `C:\Users\CROSSIAN\Downloads\deer-flow`. Upstream [bytedance/deer-flow](https://github.com/bytedance/deer-flow), revision `f443f107a3919872346a12ed6a31f35b1e407dae`, version2.2.0-dev, MIT. No upstream core code was modified. Five original Vietnamese skills were installed in `skills/custom/` and Codex's personal skills directory.

The full DeerFlow runtime was not started. Python>=3.12, uv, make, nginx/Docker and provider configuration were unavailable in the inspected environment. The independent Node tracker works without this runtime. Recheck upstream setup requirements before installing dependencies; do not present the clone as a running orchestrator.

Existing `awesome-copilot` reference checkout was reviewed at `d106008300bd4c8396e9c3c085c7c8e3ed976d48` (GitHub, MIT). Its image-generation skill describes OpenAI/Gemini provider routes but contains model references requiring current verification. No reference code was copied into this project. Built-in image generation was available and was used for actual artifacts.

Gemini video is a possible later provider, not configured here. The [official video documentation](https://ai.google.dev/gemini-api/docs/video) inspected on October27 recommended `gemini-omni-1.1-flash` after the Veo3.1 preview shutdown on October22. Verify current docs again before implementation; model availability, API billing and the Gemini app subscription are separate setup concerns. No video was generated and no provider spend was authorized by this integration.

Local plugin packaging follows the [official plugin layout](https://developers.openai.com/plugins/build/plugins). The MCP bundle and stdio tools are tested locally. Personal marketplace registration is completed separately from installation into the desktop runtime. A restart/refresh and installation from the personal plugin source may be required. Existing connections and permissions are not expanded by the read-only server.
