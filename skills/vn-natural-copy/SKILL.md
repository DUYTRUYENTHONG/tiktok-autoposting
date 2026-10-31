---
name: vn-natural-copy
description: Edit and review Vietnamese marketing captions, carousel text and narration for conversational wording, correct spelling and preserved meaning, especially southern Vietnamese household-product content.
---

# Biên tập tiếng Việt tự nhiên

Write as a helpful Vietnamese shopkeeper talking to one customer. For Sakura, use warm, everyday southern Vietnamese without forced slang, exaggerated dialect or repeated “nha/nè”. This is editorial review by an AI, not a claim that a human native-speaker checked it.

Read the actual text and its destination: spoken script, on-image text and caption have different space and rhythm. Read an existing rendered image before changing its copy. Preserve brand spelling, volume, factual uncertainty and current commercial terms. Use the campaign's latest dated instructions; old examples do not override them.

## Edit in two passes

1. Meaning and naturalness: identify what the reader needs, remove translated phrasing, repeated disclaimers and stacked rhetorical questions. Prefer a concrete situation and one clear action. A provocative hook may challenge a habit; do not accuse, shame, invent a story or promise a result.
2. Accuracy: check Vietnamese accents, pronouns, word choice, punctuation, units, numbers, product identity, source support and CTA. Distinguish a possible customer concern from an observed customer quotation. Keep necessary qualifications near the claim in plain language.

For spoken copy, use complete conversational clauses and natural breath groups. Do not make narration read hashtags, private codes or long legal-style captions. For images, use one main message per card and short readable lines. For captions, add information instead of copying the full hook twice.

## Natural persuasion for product stories

Begin with a concrete moment the customer can recognize, then give one useful answer before the CTA. Shared chores, preparing a place for guests and deciding what a small home needs are different stories; do not reuse the same material-question checklist as every body. Make the product transition sound spoken: “Còn nước lau, mình chọn theo chỗ cần dùng” is clearer than “mình dành cho một quyết định riêng.” Prefer “chọn đúng nhu cầu trước khi mua” to abstract sales language.

Explain why the customer would call: ask whether the product suits the actual surface, what the current price is, and what the buying conditions are. These remain questions, not promises of suitability or savings. Keep one clear call action. Preserve qualifications necessary to avoid misleading the viewer; place topic-specific detail in the reviewed caption where appropriate instead of repeatedly reading every disclaimer aloud. Caption edits must not silently drop those qualifications.

Write three genuinely different hook mechanisms and choose by the story's useful payoff, not by loudness or manufactured controversy. Natural, helpful and persuasive are editorial judgments until real viewing and qualified-call evidence exists. Use the current Herk storytelling direction in `docs/VIETNAMESE_SCRIPT_DIRECTION.md` when working in the Sakura repo. Preserve the selected voice setting and exact accepted WAVs; new wording creates a new listening candidate.

Useful corrections, applied in context rather than as automatic replacements:

- “Nhìn giống, lau giống được sao?” → “Nhìn giống nhau, có lau cùng một cách được không?”
- “Không mặc định phù hợp với mọi bề mặt” → “Mỗi bề mặt cần cách chăm sóc riêng. Xem nhãn và hướng dẫn trước khi chọn.” Keep the original qualification if the replacement would obscure uncertainty about the product.
- “Hỏi riêng từng vị trí” → “Bạn muốn vệ sinh vỏ máy hay lồng giặt?”
- “Nhựa ngả màu… có chắc là bẩn?” → “Hộp nhựa đổi màu, liệu có phải do bẩn?”
- “Nêu vị trí, vật liệu và nhu cầu” → “Cho shop biết bạn muốn lau chỗ nào, bằng chất liệu gì nhé.” Only ask for information the campaign's contact channel supports.

## Sakura invariants

- Public copy has no internal IDs, inquiry codes, filenames, invented phone number or clickable-link claim. Current CTA: “Gọi số điện thoại trong bio để được tư vấn.” No inbox request.
- Use authentic Sakura 500 ml product identity. Do not transfer another brand's efficacy, surface compatibility, certifications, price or results to Sakura. Generated people and stock are illustrative, never customer testimony or test evidence.
- Discounts require current verified eligibility; unknown means no discount. Preserve accepted posts unchanged.
- Approved narration is immutable audio. Correcting a caption does not authorize changing spoken words, subtitles to different meanings, WAV timing or approval hashes. A changed script/audio creates a new listening candidate; preserve the accepted version and its approval.
- Do not publish, alter schedules, create leads or change canonical receipts. Return corrections to the sole posting owner.

## Review output

Return a compact before/after with the reason for substantive edits, then the complete corrected text. Flag unsupported claims separately. Identify whether images, subtitles or narration must be regenerated. Report unresolved issues as “cần kiểm tra”, not an invented confidence score. Keep private audit IDs outside public copy.

For production, record source and final text hashes, destination, review date, issues, corrections and reviewer type. Run a second meaning check against the facts, then inspect the actual rendered output. Grammar checks and a skill file alone do not prove pronunciation or human approval.
