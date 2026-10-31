# Sakura: nghiên cứu → kịch bản → dựng → kiểm tra hiệu suất

Phiên bản 2026-10-31. Thực thi trong repo Sakura với vn-content-research, vn-angle-experiments, vn-natural-copy, vn-product-video, vn-voiceover và vn-herk-edit. Đây là bộ prompt cho tác nhân biên tập; không khẳng định đã gắn thêm LLM hoặc fine-tune mô hình.

## 1. Nghiên cứu có nguồn

Đọc nhãn Sakura500ml, hướng dẫn hiện tại, sổ nghiên cứu, số liệu thật và danh mục footage. Chỉ lấy sự kiện được nguồn hỗ trợ. Với mỗi quan sát, trả về URL, thời điểm truy cập có múi giờ, địa lý, ngữ cảnh hãng/quảng cáo/organic, số liệu và kỳ đo nếu lộ ra, điều chưa biết và câu hỏi khách hàng cần kiểm tra. Không biến hướng dẫn của hãng khác thành công dụng Sakura. Không dùng đoạn trích tìm kiếm thay cho trang đã mở. Tách quan sát khỏi suy luận và giả thuyết. Không chép bình luận riêng tư hoặc tên khách hàng. Chỉ gọi góc thắng khi có kết quả so sánh đủ điều kiện.

## 2. Góc nội dung và ba mở đầu

Từ nguồn đã đọc, đề xuất câu chuyện khác nhau về quyết định mua và việc nhà: một người ôm hết việc; chọn vì giá mà chưa biết vật liệu; nhầm vết bám với đổi màu; không biết nên bắt đầu từ đâu; một chai có thay mọi loại nước lau không; xem nhãn trước khi chọn. Mỗi góc có ba cơ chế mở đầu thật sự khác nhau: nhận ra tình huống, câu hỏi quyết định, hoặc cho thấy vấn đề chưa giải quyết. Nêu câu hỏi giữ người xem, điều nhìn thấy trong ba giây đầu, câu trả lời được trả trước CTA, cảnh nguồn và giới hạn bằng chứng. Không chỉ thay vài từ trên cùng một ảnh. Không dựng lời chứng thực hay kết quả tẩy sạch.

Quy tắc nhấn hook mới: chọn một cụm trọng tâm có nghĩa, một băn khoăn cụ thể của người mua và một lý do nghe tiếp mà phần thân thực sự trả lời. Ghi hookDirection riêng gồm hook đúng đầu script, mechanism, buyerConcern, reasonToContinue, focusPhrase, pauseAfterPhrase, payoffPhrase, direction, sourceRefs và scriptSha256. Cụm nhấn và cue nghỉ phải khớp rõ trong hook; payoff khớp phần thân. Dùng quy trình kiểm nhất quán, không ép câu chữ lặp công thức. Chỉ dẫn nằm ngoài transcript; không hét hoặc thêm tags/SSML vào engine chưa hỗ trợ. Đây là mục tiêu biên tập, chưa phải prosody được áp dụng hoặc góc thắng. Không thay audio đã duyệt chỉ để bổ sung metadata.

## 3. Lời kể tiếng Việt tự nhiên

Viết lời kể nữ miền Nam gần gũi, khoảng90–105từ để thử với giọng hiện tại1.2x; thời lượng thật mới là căn cứ. Dùng một tình huống cụ thể, một chuyển ý, một câu trả lời hữu ích, nhận diện Sakura500ml và CTA gọi số trong bio. Đọc lại hai lượt: tự nhiên; nghĩa/chính tả/bằng chứng. Không ép tiếng lóng, không đọc mã/hashtag, không lặp danh sách câu hỏi, không thêm chỉ dẫn cảm xúc mà bộ máy không hỗ trợ. Giữ giá và điều kiện mua dưới dạng câu hỏi, không tự đặt giá/ưu đãi. Lưu hash văn bản, sửa đổi và loại người duyệt là AI. Mỗi WAV mới vẫn cần nghe duyệt; giọng được chọn không làm mọi bản thu tự động đạt.

## 4. Dựng bằng tư liệu có thật

Đọc vn-herk-edit và short-form-edit trong checkout đã pin. Lập DESIGN.md trước khi dựng: đối tượng/nỗi lo, ba hook, lựa chọn và lý do, open-loop/payoff, từng đoạn nguồn/hash/khoảng thời gian, crop, một điểm chú ý mỗi nhịp, lý do chuyển cảnh và CTA. Footage Pexels chỉ minh họa bối cảnh. Dùng ảnh chai Sakura để nhận diện; không dựng cảnh stock thành thử nghiệm sản phẩm. Giữ ảnh, giọng, ASR, EDL và phụ đề đúng phiên bản. Không bịa word timestamp, scene anchor hoặc visual event để làm xanh validator. Dựng bản nháp, xem chuyển động/khung hình, nghe nối câu và kiểm tra phụ đề. ASR sai được đánh dấu, không tự biến thành chữ đã nghe duyệt.

## 5. Nhạc và xuất bản

Chọn nhạc Việt phù hợp, thay đổi giữa các bài chưa gửi, xác minh trong thư viện thương mại của tài khoản và lưu title/artist/duration cùng ảnh bằng chứng. Không tải nhạc của người khác ra ngoài hoặc khẳng định top quốc gia từ danh sách đề xuất. Nhạc nhỏ dưới lời kể. Giữ disclosure AI và thương hiệu; không in chữ AI trên ảnh. Chủ gửi bài duy nhất xác minh @saigomlia, ảnh/video và thứ tự/hash, CTA gọi, địa điểm Cô Ba322Đ.HuỳnhThịHai, Everyone, thời gian thực tế và sức chứa trước một lần bấm cuối.

## 6. Ưu tiên100video và học từ kết quả

Theo lựa chọn mới nhất: giữ cách20phút, chuyển phần còn lại sang ngày sau; tôn trọng sức chứa ngày hiện tại và lịch đã được nhận.100vị trí không phải100file hoặc100lịch TikTok. Không dùng bản đọc bị từ chối để lấp chỉ tiêu. Thu receipt thật rồi mới đếm đã lên công khai. So sánh cùng sản phẩm/định dạng/ưu đãi/phân phối ở tuổi24–72giờ. Lượt xem không phải cuộc gọi hay đơn. Ghi cuộc gọi đủ điều kiện chỉ khi có nhu cầu làm sạch và vật liệu được xác nhận; không có chứng cứ thì để chưa biết. Mở rộng góc sau kết quả so sánh, không vì tên hook nghe hay.

## Dạng đầu ra cho một brief

`intentId`, `intentHash`, `sourceEvidenceIds`, `hypothesisStatus`, `pain`, `scenario`, `hookOptions[3]`, `selectedHookReason`, `payoff`, `script`, `clipIds[4]`, `headline`, `tension`, `decision`, `identity`, `questions`, `price`, `stockLabel`, `copyReview`, `unknowns`, `requiredNextReviews`. Mã chỉ ở manifest riêng. Không trả `publicationReady:true` từ bước nghiên cứu hoặc viết.
