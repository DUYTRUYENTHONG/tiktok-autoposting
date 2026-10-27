# Skills, agents, and plugins review

Reviewed 2026-10-27 against this session's skill catalog, available roles/tools, selected skill files, plugin-directory results, and official documentation. This is a task-focused review, not an audit of every installed skill.

## Skills

| Skill | Assessment |
| --- | --- |
| computer-use:computer-use | Read its skill, guidance, API and confirmation files. Windows runtime initialized and app inventory returned successfully. User then explicitly selected the internal browser; use its supported browser interface for this task. No Windows UI input was performed. |
| dev-browser | Read skill. Alternative CLI controlling a separate Chrome session; not selected because the user chose the internal browser. |
| plugin-management:plugin-management | Read and used to discover scheduling integrations. |
| openai-docs | Read and consulted official scheduled-task documentation. |
| git-workflow-and-versioning | Read and applied to the new isolated repository. GitHub CLI authentication verified as DUYTRUYENTHONG. |
| ci-cd-and-automation | Read scope; applies to software build/deployment pipelines, not a TikTok content-posting schedule. Not selected. |
| playwright-expert / browser-testing-with-devtools | Useful if a custom app or automated test suite is implemented later; not needed for operating TikTok's existing UI now. |
| skill-creator | Available for a future reusable TikTok skill; no new skill requested or installed in this setup. |

## Agent roles and ownership

Available runtime roles are default, explorer, worker, and senior-product-designer. None is a dedicated TikTok posting integration. The local custom-agent directory contains a senior-product-designer definition; its internals were not audited because product design is outside this task.

Keep the current agent as the one owner. No subagents or new chats were created. Repository documentation and browser setup do not justify parallel agent work. Use tools directly for GitHub, JSON validation, and scheduling configuration.

The user's routing policy names GPT-5.6 Luna/Terra/Sol, while the session's available override list uses other exact IDs. Do not silently substitute models or claim savings; no model dispatch was made. A future task must select an actually available model under the user's policy.

## Plugins and tools

| Capability | Observed result | Decision |
| --- | --- | --- |
| Internal browser computer use | TikTok Studio URL opened; redirected to TikTok login | Selected; user will sign in |
| Windows Computer Use | Runtime imported and app inventory returned | Available alternative, not selected after user preference |
| Metricool | Directory describes analytics, scheduled-content review, and post creation/update; not installed/connected at discovery | Optional suggestion; TikTok account integration and posting support still need verification |
| TinyFish | Directory describes cloud browser automation; not connected | Alternative browser; not selected, previously suggested elsewhere |
| Canva | Installed according to directory | Optional content preparation, not the posting scheduler; account access not tested |
| Native TikTok connector | No dedicated connector returned by this search or exposed among current tools | Do not assume none exists globally; plugin results are not exhaustive |
| GitHub CLI | Authenticated to DUYTRUYENTHONG | Selected for repository creation and push |
| App scheduled-task tool | Available with recurring task support | Use after schedule and first-post test are established |

## Route decision and limits

Prefer TikTok's native scheduler operated through the user's internal browser, subject to account eligibility and the site's permitted use. This avoids building a private Direct Post API integration. TikTok's developer guidelines expressly exclude a utility limited to accounts managed by the developer/team, and restrict unaudited Direct Post clients to private visibility. Browser automation is not a guarantee of platform permission; respect displayed restrictions and do not bypass them.

TikTok's published guide describes 15 minutes to 10 days in advance, computer timezone defaults, and limited editing after scheduling. Verify current account behavior in the UI instead of hardcoding these assumptions.

Scheduled local tasks can use skills/plugins, but official documentation does not establish that this particular TikTok browser session or file chooser will work unattended. Test that boundary. Use a managed scheduling integration only if the user chooses it and its actual capabilities/account connection are verified.

## Sources

- [TikTok Video Scheduler guide](https://ads.tiktok.com/business/en/blog/introducing-video-scheduler-now-you-can-plan-tiktoks-in-advance)
- [TikTok Content Sharing Guidelines](https://developers.tiktok.com/docs/en/content-sharing-guidelines)
- [Official scheduled-task documentation](https://learn.chatgpt.com/docs/automations)
- Session plugin-directory results for Metricool, TinyFish, and Canva; connection states above reflect discovery time, not a future guarantee.

## Implemented update · 2026-10-27

The signed-in account is @saigomlia. Photo uploads and native scheduling were verified with real carousels and platform receipts. The user later changed the pilot to immediate publishing and added Vựa Sầu Riêng Cô Ba, 322 Đ. Huỳnh Thị Hai. Studio disables commercial-post edit/Delete controls with an app-only tooltip. The latest user decision preserves all nine schedules. New immediate posts can remain under content review, which is not confirmed publication.

The local Node tracker, carousel review gallery, five Vietnamese skills, four role profiles and packaged read-only MCP plugin now exist. Agent profiles are definitions, not evidence of parallel execution. The personal marketplace source is registered; desktop plugin installation/connection is not yet verified. Metrics ingestion remains observation/import based. Metricool is not connected. DeerFlow is cloned with custom skills but its full service is not running. See DEERFLOW_INTEGRATION.md for source revisions and readiness limits.

The initial setup notes above are historical; use README.md and private canonical state for current operation.

The current KPI is20 verified published posts/day, superseding the pilot-only stop. The active05:30 preparation /22:30 review follow-up uses this target; background publication is not yet verified. The tracker separates published, scheduled and moderation-pending counts. The story bank adds28 painpoint hypotheses and per-post inquiry codes; lead import retains observed pseudonymous attribution and unknown missing data. Posts19–20 use actual account-recommended Chốt Đơn Ngay; national trend rank and independent commercial-library clearance were not verified.
