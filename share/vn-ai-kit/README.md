# Bộ tạo nội dung AI tiếng Việt

Bản chia sẻ nguồn và công cụ cục bộ cho quảng cáo sản phẩm/ecommerce: nghiên cứu → copy tự nhiên → hook/story → RAG → lời đọc → nghe sửa → dựng/QA. Không liên kết tài khoản TikTok và không tự đăng bài.

## Dùng ngay trên máy này

Mở chat Codex tại thư mục này, đọc `AGENTS.md` và dùng `prompts/MASTER_PROMPT.vi.md`. Thông tin thương hiệu chưa được xác nhận trong `../video-workflow/brand-profile.json` vẫn để trống; không kế thừa ưu đãi/CTA hoặc lời chứng thực Sakura cho thương hiệu khác.

Yêu cầu Node22+. Chạy từ thư mục bộ công cụ:

```powershell
node scripts/kit.mjs status
node scripts/kit.mjs prepare-script C:/absolute/script.vi.txt
node scripts/kit.mjs voice-render C:/absolute/script.vi.txt
node scripts/kit.mjs rag-build C:/absolute/verified-facts.json ./data/rag
node scripts/kit.mjs rag-query ./data/rag product-id evergreen 'Thông tin sản phẩm đã xác minh?'
node scripts/kit.mjs hook-review ./viet-commerce-tts/examples/hook-direction.example.json
```

Voice launcher dùng **runtime VieNeu đã cài trên máy**, đọc manifest/hash trước khi chạy, không sao chép weights hay đổi cấu hình nguồn. `runtime-link.local.json` là liên kết đường dẫn máy này; chuyển máy phải cấu hình lại local assets hợp lệ. Không tải model, gọi API trả phí hoặc clone giọng. WAV, script và receipt mới nằm trong `outputs/voice/`; mỗi WAV cần nghe lại phát âm/nhịp/nhấn trước khi sử dụng. Chấp thuận giọng từ chiến dịch cũ không duyệt bản thu mới.

## Plugin và skills

Thư mục bộ công cụ này cũng là plugin local đã build, gồm kiểm runtime, chuẩn bị script, render preview, RAG, hook review và ngữ cảnh sửa giọng. `mcp.json` và `.mcp.json` khai báo server Node. Bản sao không tự cài/reload plugin trong Codex; có thể dùng CLI ngay. `skills/` chứa skill dùng chung và `references/sakura-skills/` giữ nguồn tham khảo chiến dịch, không tự áp dụng ưu đãi/tài khoản cũ.

## RAG và fine-tuning thực tế

`viet-commerce-tts/` là snapshot nguồn riêng, gồm LangChain lexical RAG, lexicon, hook review, correction memory và exporter corpus/Gwen. CLI đã bundle dependency; không cần npm install để dùng các lệnh Node đã liệt kê. Model sinh nội dung chưa gắn vào RAG; nó trả context/prompt có nguồn, không tự viết câu trả lời. Thực hiện sinh nội dung trong chat bằng prompt đã chuẩn hóa và nguồn được truy xuất.

Fine-tuning **chưa chạy, không có weights đã train**. Chỉ có kiểm corpus và chuẩn bị JSONL; cần giọng người có đồng ý thương mại, dữ liệu/nhãn/consent và môi trường huấn luyện riêng trước khi thực sự train. Synthetic audio không phải training positive của người thật. Xem `viet-commerce-tts/docs/FINE_TUNING.md` và `docs/KNOWLEDGE_AND_TUNING.md`. V-TTS CC-BY-NC không được nhập làm engine thương mại; Gwen là preparation-only.

Nhánh fine-tuning **copy/content** cũng được chia sẻ: `content-tuning-prepare ABS_REVIEWED_JSONL ABS_INDEX_DIR` kiểm dữ liệu có consent, human editorial review và nguồn còn hiệu lực; tạo split, chưa train. Cần ít nhất50 mẫu độc lập đủ điều kiện và split tối thiểu40/5/5; không biến captions AI thành nhãn human-approved. `references/content-fine-tuning/` giữ exporter và runner LoRA để phát triển sau; không tự chạy trainer hoặc tải model. CLI bắt buộc đường dẫn index riêng để không đọc corpus TikTok mặc định.

Không mang theo campaign, cookies, API key, tài khoản, khách hàng, feedback riêng, media, audio approval hoặc model. `SOURCE_MANIFEST.json` ghi nguồn commit và hash các file được chia sẻ. Các test/smoke chỉ chứng minh chức năng được kiểm tra; không chứng nhận giọng tự nhiên, hiệu quả quảng cáo hay model đã train.
