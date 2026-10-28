// Original spoken copy: a recognizable problem, a grounded response, one inquiry CTA.
export const voicePainStories={
  'sakura-pain-tan-ca':{
    hook:'Tặng thêm một chai cũng không giải quyết việc nhà dồn hết lên bạn.',
    story:'Đừng ôm hết mọi việc cùng lúc. Chọn một góc nhỏ, và xem đó là vật liệu gì trước khi chọn dung dịch.'},
  'sakura-pain-chia-viec':{
    hook:'Ăn cùng nhau mà một người phải dọn: bạn thấy công bằng không?',
    story:'Thử chia nhau từng góc nhỏ. Thống nhất xem bề mặt và hướng dẫn trước khi bắt đầu.'},
  'sakura-pain-phong-tro':{
    hook:'Phòng nhỏ không cần thêm một chai nước lau sai nhu cầu.',
    story:'Trước khi mua thêm một chai, hỏi rõ dùng cho đâu, và có hợp vật liệu trong phòng không.'},
  'sakura-pain-vat-lieu':{
    hook:'Chữ đa năng không có nghĩa là lau đâu cũng được.',
    story:'Sơn gỗ, đá, và gạch có thể có hướng dẫn khác nhau. Đừng để vẻ ngoài quyết định cách vệ sinh.'},
  'sakura-pain-so-hong':{
    hook:'Đừng mua vội, nếu bạn chưa biết món đồ làm bằng gì.',
    story:'Ngại là đúng khi chưa rõ chất liệu. Xem nhãn chăm sóc, và hỏi kỹ trước khi dùng dung dịch.'},
  'sakura-bep':{
    hook:'Chà mạnh hơn chưa chắc là dọn đúng hơn.',
    story:'Đợi bề mặt nguội, nhận diện vật liệu và loại vết bám. Đừng chọn nước lau chỉ vì lời hứa sạch mọi thứ.'},
  'sakura-pain-nham-chai':{
    hook:'Cùng tên Sa cu ra không có nghĩa là cùng một sản phẩm.',
    story:'Bạn đang tìm nước lau đa năng năm trăm mi li lít. Hãy đối chiếu ảnh nhãn, và tách rõ với xả vải khô trước khi đặt.'},
  'sakura-pain-lop-phu':{
    hook:'Một vết bám có đáng để bạn liều với lớp phủ chiếc nồi?',
    story:'Nhìn mặt ngoài và tìm đúng hướng dẫn của hãng. Chất liệu và tình trạng vết bám cần được hỏi rõ trước.'},
  'sakura-pain-dep-chat-lieu':{
    hook:'Màu trắng không nói cho bạn biết đôi dép làm bằng gì.',
    story:'Nhựa, cao su, và da không nên được coi là một. Gửi ảnh nhãn chăm sóc thay vì đoán qua màu sắc.'},
  'sakura-pain-gach-lop-phu':{
    hook:'Phòng tắm lấm tấm chưa chắc vì bạn lau chưa kỹ.',
    story:'Gạch men, đá và lớp phủ có hướng dẫn khác nhau. Một tấm ảnh rõ bề mặt giúp câu hỏi cụ thể hơn.'}
};
export function painVoiceCopy(angleId,spokenLeadCode,promotion){
  const story=voicePainStories[angleId.replace(/-voice$/,'')];
  if(!story)return null;
  const opening=promotion?.voiceHook?promotion.voiceHook+' ':'';
  const closing=promotion?.voiceHook?'':'Mua một, tặng một, chỉ khi mua qua Tích Tóc. ';
  return {...story,promoHook:promotion?.voiceHook??null,script:`${opening}${story.hook} ${story.story} Cần tư vấn Sa cu ra? Nhắn mã ${spokenLeadCode}, kèm ảnh bề mặt. ${closing}Dùng theo nhãn.`};
}
