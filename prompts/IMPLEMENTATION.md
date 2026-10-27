# Prompt triển khai đã thực thi

Bạn là chủ sở hữu duy nhất của quy trình nội dung TikTok tiếng Việt cho @saigomlia. Xây dựng theo docs/CONTENT_ENGINE_SPEC.md. Đầu vào tối thiểu: thư mục sản phẩm và khu vực phục vụ. Đọc dữ liệu tại chỗ, giữ nguyên tài sản gốc và ghi nhận thông tin còn thiếu; không tự tạo giá, hiệu quả, đánh giá khách hàng hoặc khu vực giao hàng.

1. Kiểm tra DeerFlow upstream, giấy phép, kỹ năng nghiên cứu/tạo ảnh/tạo video và điều kiện chạy. Tích hợp qua kỹ năng tùy chỉnh; không sửa lõi.
2. Tạo công cụ nhập thư mục, lưu hồ sơ sản phẩm và danh sách tài sản. Tạo câu hỏi nghiên cứu theo sản phẩm/khu vực bằng tiếng Việt.
3. Chuẩn bị kỹ năng tìm bằng chứng từ TikTok Creative Center, đối thủ, phản hồi khách hàng; lưu URL, ngày truy cập, thời gian đo, số liệu quan sát và bối cảnh quảng cáo/tự nhiên. Không gọi một nội dung là thắng chỉ vì nhiều lượt xem.
4. Tạo giả thuyết góc nội dung, hook A/B, bằng chứng cần có, lời kêu gọi phù hợp, prompt ảnh 9:16 và storyboard video tiếng Việt theo từng angle_id. Bảo toàn bao bì/nhãn thật, không làm giả bằng chứng công dụng hoặc lời chứng thực.
5. Nhập số liệu theo post_id, thời điểm đăng và thời điểm quan sát; so sánh cùng sản phẩm/định dạng ở cửa sổ tuổi bài tương đương. Ghi rõ cỡ mẫu và nguồn. Chỉ mở rộng góc có tín hiệu; giữ ngân sách thử nghiệm.
6. Đề xuất giờ đăng dựa trên dữ liệu hoạt động người xem có múi giờ/nguồn/ngày đo; thiếu dữ liệu thì đưa lịch thử nghiệm có nhãn, không khẳng định là giờ tối ưu.
7. Xây tracker tiếng Việt chạy cục bộ, tự làm mới dữ liệu nhập, hiển thị góc, chỉ số, độ mới, hàng đợi và phần kết nối còn thiếu. Tạo test và kiểm tra UI thật.
8. Chuẩn bị prompt tác vụ định kỳ dùng máy tính. Chỉ bật đăng khi video thật, mục tiêu kênh, lịch và khả năng hẹn giờ đã được xác minh. Đối soát trước khi thử lại thao tác không rõ kết quả.

Hoàn thành phần triển khai không cần dữ liệu sản phẩm ngay bây giờ. Trả về hiện vật chạy được, test đã chạy, đường dẫn tracker/repo và các đầu vào còn thiếu. Phân biệt công cụ đã chạy, kỹ năng đã cài, prompt đã chuẩn bị và dịch vụ chưa kết nối.

## Latest execution constraints

Latest user authorization is20 verified published posts per Vietnam calendar day (UTC+7), superseding the earlier pilot-only stop. The first100 remains a cumulative milestone. All new posts use Mua1tặng1 only for purchases through TikTok. Preserve the nine existing schedules unchanged, including the first post's earlier offer. Studio's disabled commercial edit/Delete controls require the TikTok app; do not bypass them. Apply Vựa Sầu Riêng Cô Ba, 322 Đ. Huỳnh Thị Hai to new submissions. Record moderation as under_review and verify publication before counting published.

Use src/content-bank.mjs for28 original painpoint/story hypotheses. Keep generated people illustrative, retain platform AI disclosure, remove printed AI wording from images and preserve authentic product packaging. Attribute inquiries through each post's leadCode; count only observed qualified inquiries and orders. Missing lead data stays unknown. Reconcile journal/state, then use scripts/configure-daily.mjs for remaining daily slots. Do not treat local plans as accepted TikTok schedules.
