# Sakura · prompt kể chuyện và lời đọc mới

Áp dụng `vn-voiceover` và `vn-product-video` cho **bản nháp mới, tách khỏi101–105 đã được chấp nhận**. Đây là ba giả thuyết sáng tạo, chưa có bằng chứng tăng tương tác/chuyển đổi. Chỉ dựng thử giọng câu chuyện01; chưa dựng video, đăng hay thay nội dung cũ.

## Dữ kiện và ranh giới

- Sản phẩm: Sakura500ml. Chưa có giá, hạn ưu đãi, số đơn đã dùng hay số đơn còn lại được xác minh.
- Câu ưu đãi nói đầu tiên giữ đúng nghĩa: **Mua1tặng1 cho50đơn đầu tiên từTikTok**. Bản đọc dùng số viết bằng chữ và `Tích Tóc` để phát âm TikTok. Không thêm mốc hết hạn, “còn vài đơn”, “50khách”, hoặc đặt lại50đơn cho từng bài/ngày.
- Giọng đã chọn: nữ miền Nam Thùy Dung, tốc độ1.2, `referenceStyle=speaker-only`, nhiệt độ0.8. Không đổi mẫu, sao chép người khác, dùng giọng bị từ chối, hay gọi tham số `style` bị bỏ qua là điều khiển cảm xúc.
- Tình huống và lời thoại là hư cấu minh họa. Không gán cho khách thật, không trích đánh giá hay bịa hiệu quả, độ an toàn/vật liệu tương thích. Nhân vật chọn hỏi trước; Sakura xuất hiện như một lựa chọn cần tìm hiểu.
- Lời đọc giữ tự nhiên; phần chú thích/hiển thị xử lý “Tình huống minh họa”, nguồn giọng tổng hợp và công bố của nền tảng. Cảnh stock không phải thử nghiệm Sakura hoặc người bảo chứng.
- Mục tiêu20–25giây là mục tiêu dựng. Ước lượng95–115từ cách trắng chỉ là điểm khởi đầu; phải đo WAV thật, không suy ra từ số chữ hay kéo chậm giọng đã chọn.

## Prompt01 · phát triển chuyện theo hành vi

```text
Bạn là biên kịch lời đọc tiếng Việt cho Sakura500ml. Viết một chuyện ngắn
để người nghe nhận ra một khoảnh khắc đời thường, rồi muốn hỏi đúng nhu cầu.

Đối tượng: người đi làm có việc nhà, mua hàng quaTikTok; nói gần gũi miền Nam,
câu ngắn vừa đủ ý, không đọc như bản giới thiệu sản phẩm.

Bắt đầu bằng đúng nội dung ưu đãi: Mua1tặng1 cho50đơn đầu tiên từTikTok.
Sau đó đi theo năm nhịp:
1. Một cảnh cụ thể nhìn thấy được.
2. Một chi tiết/lời thoại khiến cảnh có chút căng thẳng.
3. Một câu nhận ra điều người ta đang thật sự bận lòng.
4. Một quyết định trung thực, nhỏ và có thể làm: chia việc hoặc hỏi đúng vật liệu.
5. CTA hỏi về Sakura500ml, gửi ảnh bề mặt cho shop.

Đặt câu hỏi về thói quen, không công kích người/vợ/chồng/hãng khác.
Đừng kể một khách dùng Sakura rồi đạt kết quả. Không bịa giá, hạn chót,
số đơn còn lại, hiệu quả tẩy, độ an toàn hay chất liệu dùng được.
50là giới hạn đơn của chương trình đang có, không phải50suất mới của câu chuyện.

Đầu ra: tên góc, nhu cầu người nghe, lời đọc95–115từ cách trắng,
nhịp cảnh20–25giây dự kiến, phát âm tên/đơn vị và một câu chú thích minh họa.
Nói rõ đây là giả thuyết sáng tạo, không gọi là góc thắng đã kiểm chứng.
```

## Prompt02 · đạo diễn lời đọc bằng điều engine thực sự hỗ trợ

```text
Dùng nguyên từ ngữ của kịch bản đã duyệt. Giữ Thùy Dung1.2x, speaker-only,
temperature0.8; không thay giọng hoặc ghép lời khách/người nổi tiếng.
Ưu đãi luôn là âm thanh lời nói đầu tiên.

Đọc như đang kể với một người quen. Nhịp căng ở lời thoại hỏi,
dịu lại ở câu nhận ra vấn đề, gọn và rõ ở quyết định/CTA.
Dùng dấu câu và các cụm có nghĩa; không tách1–2từ rời để ép nhấn.
Không chèn [nhấn mạnh], [hào hứng], SSML hay style giả mà SDK không hỗ trợ.
Không lạm dụng tiếng cười/thở dài; bản thử này không thêm cue phi ngôn ngữ.

Tên hiển thị là Sakura500ml; bản phát âm dùng “Sa cu ra năm trăm mi li”.
TikTok có thể viết phát âm “Tích Tóc”. Bản đọc không thêm mãGIỌNG cũ.

Dựng cục bộ bằng runtime sẵn có, kiểm tra checksum trước khi chạy.
Lưu nguyên script, runtime/model/codec/helper hash, WAV hash, thời lượng thật
và QA dạng sóng. Kết quả mới luôn rendered_needs_listening;
không thừa kế duyệt nghe của101–105 hay chỉ từ việc profile đã được chọn.
```

## Prompt03 · chuyển chuyện thành cảnh sau khi lời đọc được nghe duyệt

```text
Chưa tự dựng/đăng ở bước này. Sau khi đúng WAV được duyệt nghe:
0–3s: ưu đãi nói trước, chữ50đơn đầu tiên từTikTok đọc được.
3–9s: cảnh sinh hoạt minh họa tương ứng với tình huống/lời thoại.
9–16s: chi tiết căng thẳng và sự thay đổi quyết định; không trước/sau hiệu quả.
16–21s: ảnh sản phẩm Sakura500ml thật và câu hỏi nhu cầu/vật liệu.
21–25s: CTA gửi ảnh bề mặt, không bịa giá hoặc số suất còn lại.

Dùng cảnh/người stock đã duyệt như minh họa; không gọi chai stock là Sakura,
không diễn lại một ca tẩy hoặc chứng thực. Dùng phụ đề theo chính WAV mới,
không tái dùng mốc của101–105. Kiểm tra chuyển câu/offer/tên sản phẩm bằng
phát lại thật. Nhạc nền chỉ chọn sau từ thư viện dùng thương mại của tài khoản,
để dưới lời kể; không bịa tên bài hoặc xếp hạng xu hướng.
```

## Chuyện01 · “Người chưa ra coi phim” · bản được chọn để dựng giọng

Nhu cầu: được chia việc, không phải một người luôn nhớ hết. Nút thắt là tiếng gọi từ phòng khách, không phải một vết bẩn “khó chịu” do sản phẩm giải quyết.

```story-01
Mua một tặng một cho năm mươi đơn đầu tiên từ Tích Tóc.

Cơm tối vừa xong. Cả nhà ra ghế ngồi, còn một người quay lại bếp. Ngoài kia hỏi: “Sao chưa ra coi phim?” Trong này chỉ đáp: “Còn cái bàn nữa nè.” Nghe quen hông?

Nhiều khi mệt đâu phải vì một cái bàn. Mệt vì bữa nào cũng chỉ một người nhớ tới nó. Thôi, người gom chén, người lau bàn. Còn mua nước lau, đừng thấy ưu đãi là chốt liền.

Muốn hỏi Sa cu ra năm trăm mi li có hợp bề mặt nhà mình không, gửi ảnh cho shop coi trước nha.
```

Nhịp dự kiến: ưu đãi → bữa cơm/phòng khách → hai câu đối thoại → nhận ra việc nhớ/chia việc → hỏi sản phẩm đúng nhu cầu. Không đóng vai người bán tự thuật đã dùng hàng. Câu chú thích gợi ý: “Tình huống minh họa về chuyện chia việc nhà. Hỏi shop về Sakura500ml và gửi ảnh bề mặt cần tư vấn.”

## Chuyện02 · “Ngón tay chưa bấm mua”

Nhu cầu: có ưu đãi nhưng vẫn muốn chọn đúng món. Xung đột giữa bấm mua nhanh và một câu hỏi đơn giản.

```story-02
Mua một tặng một cho năm mươi đơn đầu tiên từ Tích Tóc.

Đang lướt điện thoại, thấy ưu đãi là ngón tay muốn bấm mua liền. Mà cô gái đứng trước cái tủ, nhìn một hồi rồi khựng lại: “Ủa, mặt này có hợp hông ta?”

Vậy là điện thoại chưa chốt đơn. Cô quay sang chụp cái tủ trước. Hỏi một câu còn hơn mua về rồi để đó. Ưu đãi làm mình chú ý; thứ đáng chọn vẫn phải hợp nhu cầu.

Muốn hỏi Sa cu ra chai năm trăm mi li, gửi shop ảnh bề mặt rồi mình tính tiếp nha.
```

Nhịp dự kiến: ưu đãi → điện thoại → ngập ngừng trước cái tủ → chụp ảnh thay vì chốt → hỏi Sakura500ml. Chưa dựng giọng; thời lượng chưa đo. Chú thích: “Tình huống minh họa. Ưu đãi không thay cho việc hỏi độ phù hợp với bề mặt.”

## Chuyện03 · “Tin nhắn khách sắp ghé”

Nhu cầu: chuẩn bị đón người quen mà không biến cả nhà thành cuộc thi ai làm nhiều hơn. Quyết định là chia một việc nhỏ cho mỗi người.

```story-03
Mua một tặng một cho năm mươi đơn đầu tiên từ Tích Tóc.

Mới đặt túi xuống, điện thoại reo: “Lát nữa tụi mình ghé nha!” Người trong nhà nhìn cái bàn, rồi nhìn nhau. Một người nói: “Thôi rồi, ai dọn giờ?”

Chưa cần chạy vòng vòng. Người cất đồ, người gom ly, người lo cái bàn. Dọn cho dễ sống, chớ đâu phải thi coi ai giỏi việc nhà. Còn chai nước lau, cứ hỏi cho đúng bề mặt trước đã.

Muốn tìm hiểu Sa cu ra năm trăm mi li, chụp ảnh gửi shop tư vấn nha.
```

Nhịp dự kiến: ưu đãi → điện thoại → nhìn nhau/câu hỏi → chia việc → hỏi Sakura500ml. Chưa dựng giọng; thời lượng chưa đo. Chú thích: “Tình huống sinh hoạt minh họa, không phải câu chuyện hay lời chứng thực của khách hàng.”

## Thực thi bản thử và kiểm tra

Không có công cụ Voice Lab được kết nối trong phiên này; dùng worker thực tế của cùng repo sau khi `voiceRuntime()` xác minh asset/runtime. Không cài thêm, đổi model, gọi dịch vụ trả phí hay ghi canonical queue/journal.

Lệnh dựng riêng, từ thư mục repository:

```powershell
& "$env:USERPROFILE\.codex\data\tiktok-autoposting\voice\vieneu\runtime\Scripts\python.exe" -I scripts/voice-vieneu.py --config "$env:USERPROFILE\.codex\data\tiktok-autoposting\voice\runtime.json" --input state/story-voice-20261028/story-01.txt --output state/story-voice-20261028/story-01.wav --voice "Thùy Dung" --speed 1.2 --reference-style speaker-only
```

Chỉ chạy sau kiểm tra runtime/model/codec hash; receipt riêng giữ các giá trị hash tại thời điểm chạy. `-I` và worker chặn mạng, chỉ dùng model đã cache; receipt không thể tự chứng minh chất giọng tự nhiên. Bản này cần nghe lại tên Sakura, TikTok, đơn vị500ml, ưu đãi, tốc độ và cách chuyển lời thoại. Không tạo mãđơn/lead mới hoặc dùng lại mãGIỌNG101–105 cho bản nháp này.

Đã dựng riêng câu chuyện01 ngày28/10/2026 bằng đúng lệnh worker trên, sau kiểm tra runtime và model. Không dựng câu chuyện02–03.

| Bằng chứng | Kết quả thật |
|---|---|
| Tệp WAV riêng | `state/story-voice-20261028/story-01.wav` |
| Receipt riêng | `state/story-voice-20261028/receipt.json` |
| Script/ba phương án | `state/story-voice-20261028/story-01.txt`, `scripts.json` |
| Thời lượng đo | **21.061giây**, đạt mục tiêu20–25giây |
| Định dạng/QA | MonoPCM16,48,000Hz; RMS0.105586; tỷ lệ clipping0 |
| WAVSHA-256 | `2593c03e791abe2632742347e6c100d550b944068d107d76497fe36297d0180f` |
| ScriptSHA-256 | `0924da963a3e9197fc98099e4fd9c7909d2e14a4bcb8e35a34c6e8761583a774` |
| SDK/model | VieNeu3.8.3; v3Turbo revision`61b85e3d937fbbacb387714180e8182823512523` |
| Codec | MOSS-ONNX revision`ceff0d0749bfb3fa2d61149794ec6feef0d1e1ae` |
| Trạng thái | `rendered_needs_listening`; `listeningVerified:false`; `published:false` |

Receipt giữ câu lệnh, script đầy đủ, profile, attribution, hash worker/config/manifest và QA. Đây là giọng tổng hợp preset đang chạy cục bộ, không phải model vừa huấn luyện hay giọng một khách hàng. Kiểm tra dạng sóng chỉ chứng minh tệp có âm thanh/định dạng/mức kỹ thuật phù hợp; **chưa chứng minh cảm xúc tự nhiên hoặc phát âm đúng**. Ưu đãi, TikTok, Sakura,500ml và lời thoại còn cần nghe thật.101–105 và canonical queue/journal không được ghi sửa trong lần dựng này. Bản mới chưa được nghe duyệt, dựng video, gửi lênTikTok hay đăng.
