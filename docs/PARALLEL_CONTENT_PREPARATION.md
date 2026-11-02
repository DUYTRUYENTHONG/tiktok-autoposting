# Parallel content preparation

Run independent grounded editorial prompts in up to three isolated local workers. Each worker reads the existing private knowledge index and uses the evergreen Sakura 500 ml retrieval scope. It cannot publish, schedule, upload, spend credits or change campaign state. It does not generate images, narration, finished copy or use a trained model. An abstention is not a usable prompt.

Create a private UTF-8 JSON array outside the repository, with a unique lowercase `id` and a distinct `query` for each job. For example:

```json
[
  {"id":"kitchen","query":"Sakura 500 ml: hỏi chất liệu mặt bếp"},
  {"id":"bathroom","query":"Sakura 500 ml: đồ nhựa đổi màu"}
]
```

Run `npm run prepare:parallel-content -- C:\absolute\private-jobs.json 3`. Inputs are limited to 50 jobs; concurrency is 1–3. Results are stored under `%USERPROFILE%\.codex\data\tiktok-autoposting\parallel-content` in a unique file. Results preserve input order, record each failure separately, and return a nonzero exit code if any worker fails. `completed` means the worker returned; inspect `result.status` and `result.prompt` to distinguish a retrieved prompt from an abstention. Do not treat generated prompts as approved creative or a publication receipt. Review product claims, current offer eligibility, actual assets, voice, native music, disclosures and TikTok framing separately. One owner submits posts after the existing reconciliation checks.
