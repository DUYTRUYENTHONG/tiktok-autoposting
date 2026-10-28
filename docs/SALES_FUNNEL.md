# Phễu tư vấn Sakura · nguyên mẫu BẾP301

Một nguyên mẫu sáu slide, một câu chuyện xuyên suốt: tan ca nhưng việc nhà còn dồn lại. Ưu đãi thu hút chú ý; sản phẩm thật xuất hiện trước câu hỏi độ phù hợp; CTA chuyển người xem sang trao đổi có đủ thông tin. Đây là giả thuyết biên tập chưa được đo lường, không phải góc thắng hoặc bằng chứng tăng chuyển đổi. Người dùng yêu cầu thiết kế nguyên mẫu; BẾP301 chưa được thêm vào hàng đợi và chưa được cho phép xuất bản.

Áp dụng các skill `vn-carousel-creative` và `vn-angle-experiments`. [Prompt và copy sáu slide](../prompts/CAROUSEL_FUNNEL_301.md) đã được thực thi bằng built-in imagegen: sáu PNG3:4, từng ảnh được kiểm tra trực quan, lưu riêng cùng prompt/hash tại `state/funnel-301/manifest.json`. Tông plum/sage/ivory, điểm nhấn ưu đãi coral; ảnh sinh hoạt là minh họa từ Pexels, chai Sakura dùng tham chiếu sản phẩm thật riêng biệt. Bố cục sinh ảnh không phải bản sao nhãn chính xác từng pixel. Không đặt chai vào tay người mẫu stock, tạo demo, kết quả trước/sau, chứng thực hoặc sự bảo chứng của người mẫu.

## Dữ kiện đã truy xuất

Đã chạy pipeline LangChain cục bộ với BM25 + E5 đa ngôn ngữ, bộ lọc đúng sản phẩm/ưu đãi/thời điểm và từ chối dữ kiện thiếu. Ba nguồn trả về:

| Source ID | Dùng cho |
| --- | --- |
| `sakura:identity:500ml` | Nước lau đa năng Sakura, dung tích500ml, đối chiếu nhãn thật |
| `sakura:offer:buy1-get1-tiktok-first50` | Mua1tặng1 cho50đơn đầu tiên từTikTok; giới hạn chung của chương trình |
| `sakura:policy:material-check` | Hỏi bề mặt, vật liệu và nhu cầu; chưa xác minh công dụng/độ phù hợp cho một vật liệu cụ thể |

Ledger riêng `state/funnel-301/grounding.json` giữ thời điểm chạy, câu hỏi, nội dung nguồn, sourceHash, corpusHash, model revision và prompt truy xuất. Corpus lần thực thi: `1d44cbae7c36bf48014dead2a9932b463b065b804f9d007e664c2b9dda69bab5`. E5 revision: `761b726dd34fb83930e26aab4e9ac3899aa1fa78`. Đây là `retrieval-and-prompt-only`; không có LLM sinh nội dung nối vào pipeline và không có mô hình fine-tuned được dùng. Copy trong nguyên mẫu là bản biên tập từ dữ kiện truy xuất; không phải đầu ra của một mô hình nội dung đã huấn luyện riêng.

Không có giá, số đơn còn lại/đã đổi, hạn chót, lời hứa giao hàng, chứng nhận hay hiệu quả làm sạch được xác minh. Các số đếm đổi ưu đãi giữ `null`.50là số đơn áp dụng chung, không phải50khách,50đơn mỗi bài hoặc50đơn mỗi ngày.

## Từ nội dung đến cuộc tư vấn

| Bước | Nhiệm vụ | Thông tin cần có | Điều kiện chuyển bước |
| --- | --- | --- | --- |
| Slide1–2: chú ý/đồng cảm | Nêu ưu đãi và căng thẳng việc nhà có thể nhận ra | Bối cảnh minh họa, không có lời khách hàng thật | Người xem tự chọn tìm hiểu; chưa tính là lead |
| Slide3: nhận diện | Nhìn đúng Sakura nước lau đa năng500ml | Packshot thật, nhãn/dung tích đúng | Người xem phân biệt đúng sản phẩm |
| Slide4: cân nhắc | Xử lý nỗi lo chọn sai bề mặt bằng câu hỏi | Vật liệu, ảnh bề mặt, hướng dẫn hãng | Chưa xác nhận phù hợp nếu thiếu chứng cứ |
| Slide5–6: hỏi shop | Nhắc điều kiện ưu đãi, mã BẾP301 và ba thông tin | Ảnh + vật liệu + nhu cầu | Có câu hỏi thực tế và mã/ngữ cảnh phản hồi |
| Tư vấn thủ công | Xác định nhu cầu, kiểm tra hướng dẫn phù hợp | Phản hồi thực tế của người hỏi | Có nhu cầu vệ sinh và vật liệu/bề mặt được quan sát mới là qualified inquiry |
| Giá/điều kiện | Chủ shop kiểm tra thông tin thương mại thực tế | Giá, món nhận, điều kiện ưu đãi, cách nhận và phí nếu có | Báo rõ thông tin đã xác minh trước khi khách quyết định |
| Chốt đơn | Đọc lại thông tin và nhận xác nhận thực tế | Sản phẩm, số lượng, giá/tổng tiền, ưu đãi hợp lệ, cách nhận | Có xác nhận/đơn thật mới ghi order; lời hỏi mua chưa phải đơn |
| Sau bán | Hỗ trợ nhãn và câu hỏi sử dụng theo hướng dẫn | Đơn/việc nhận hàng đã được xác nhận và mong muốn nhận hỗ trợ | Phản hồi thủ công theo nhu cầu; không nhắn quảng cáo tự động |

Không tự gửi DM. Các mẫu dưới đây chỉ dành cho owner trả lời một người đã chủ động hỏi hoặc đã đồng ý nhận hỗ trợ. Không nhập tên, số điện thoại, địa chỉ hoặc nội dung chat vào Git, ledger RAG hay tập fine-tuning.

## Mẫu trao đổi thủ công

**1. Nhận câu hỏi BẾP301**

“Chào bạn, bạn đang muốn hỏi góc nào trong nhà? Gửi shop ảnh bề mặt, tên vật liệu nếu biết và loại vết/nhu cầu cần hỏi nha. Mình đối chiếu thông tin trước khi tư vấn.”

**2. Chưa rõ chất liệu hoặc độ phù hợp**

“Shop chưa có đủ thông tin để xác nhận Sakura phù hợp với bề mặt này. Bạn xem giúp nhãn chăm sóc hoặc hướng dẫn của món đồ, rồi gửi lại nhé. Mình không muốn đoán qua màu hoặc ảnh quảng cáo.”

Nếu đã có tài liệu, owner chỉ trả lời đúng phần hướng dẫn đã kiểm tra. Không suy từ chữ “đa năng” thành dùng được cho gỗ, đá, màn hình, lòng nồi hay bề mặt tiếp xúc thực phẩm.

**3. Báo giá và điều kiện**

“Shop gửi bạn thông tin đã kiểm tra: sản phẩm [tên/SKU], số lượng [thực tế], giá [đã xác minh]. Chương trình Mua1tặng1 cho50đơn đầu tiên từTikTok được kiểm tra theo điều kiện và đơn thực tế trước khi chốt. Món nhận/điều kiện [đã xác minh], cách nhận và phí nếu có [đã xác minh], tổng tiền [đã xác minh]. Bạn xem rồi quyết định nha.”

Chưa điền đủ dữ kiện thì chưa gửi mẫu này như một báo giá. Chủ shop cần sổ đơn/đổi ưu đãi thật để xác nhận điều kiện; không dùng lượt xem, lead hay mã BẾP301 làm bằng chứng còn suất. Không tự đặt giá, miễn phí giao hàng, thời gian giao hoặc món quà cụ thể.

**4. Xác nhận đơn**

“Mình đọc lại để bạn kiểm tra: [sản phẩm], [số lượng], [giá/tổng tiền], [ưu đãi đã được shop xác nhận], [cách nhận đã thống nhất]. Thông tin này đúng ý bạn chưa?”

Chỉ ghi nhận order khi có xác nhận mua/đơn thật. Thông tin giao nhận, nếu cần, được xử lý riêng theo kênh bán phù hợp; không thu thập trước chỉ để tăng số qualified leads.

**5. Hỗ trợ sau bán**

Sau khi việc nhận hàng được xác nhận, nếu người mua muốn được hỗ trợ:

“Bạn nhận được đúng chai Sakura500ml và nhãn còn rõ chứ? Nếu cần hỏi về nhãn hoặc một bề mặt cụ thể, gửi shop thông tin vật liệu để mình đối chiếu hướng dẫn nha.”

Không hỏi dẫn dắt như “sạch như mới chưa”, không chuyển phản hồi thành lời chứng thực khi chưa có quyền, không lập lịch nhắn hàng loạt. Phản hồi có vấn đề cần được owner xử lý theo dữ kiện thực tế, không tự hứa kết quả/hoàn tiền/đổi trả ngoài chính sách đã kiểm tra.

## Ghi nhận và thử nghiệm

Hiện chưa có sự kiện khách hàng hay đơn nào được nhập cho nguyên mẫu này; không điền số giả. Nếu sau này được cho phép xuất bản, mã BẾP301 hoặc ngữ cảnh trả lời trực tiếp dùng để quy nguồn. Chỉ ghi event ID giả danh, post ID đã xác minh xuất bản, thời điểm và trạng thái inquiry/qualified/order theo [quy tắc lead hiện hành](DAILY_OPERATIONS.md). Không có quan sát nghĩa là chưa biết, không suy thành0khách/0đơn.

Prototype kiểm tra ba câu hỏi: người xem nhận ra đúng chai không; hiểu ưu đãi50đơn từTikTok không; biết gửi gì để hỏi shop không. Toàn bộ phễu được thiết kế cùng lúc nên chưa thể quy hiệu quả cho riêng một slide. Nếu tiếp tục thử hook sau này, giữ sản phẩm, ưu đãi, số slide, cách đo và các điều kiện so sánh nhất quán; chỉ đổi một biến chính. Chưa có baseline, mẫu đo hoặc kết quả để gọi đây là “phễu thắng”.

Owner ghi riêng đường dẫn/hash sáu ảnh, nguồn stock/packshot và kiểm tra chữ/nhãn/crop. Trạng thái tạo ảnh, duyệt hình, gắn nhạc, cho phép đăng, gửi nền tảng và xuất bản phải tách biệt. Tài liệu này không thay đổi queue, lịch, receipt hoặc bài đã nhận.
