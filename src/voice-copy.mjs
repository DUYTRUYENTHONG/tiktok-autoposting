// Original spoken copy: a recognizable problem, a grounded response, one inquiry CTA.
export const voicePainStories={
  'sakura-pain-tan-ca':{
    hook:'Về tới nhà, chỉ muốn nghỉ… mà bếp vẫn chờ dọn?',
    story:'Đừng ôm hết mọi việc cùng lúc. Chọn một góc nhỏ, và xem đó là vật liệu gì trước khi chọn dung dịch.'},
  'sakura-pain-chia-viec':{
    hook:'Cơm thì cùng ăn, sao việc dọn lại dồn một người?',
    story:'Thử chia nhau từng góc nhỏ. Thống nhất xem bề mặt và hướng dẫn trước khi bắt đầu.'},
  'sakura-pain-phong-tro':{
    hook:'Phòng đã nhỏ, đồ dọn nhà lại chiếm cả góc?',
    story:'Trước khi mua thêm một chai, hỏi rõ dùng cho đâu, và có hợp vật liệu trong phòng không.'},
  'sakura-pain-vat-lieu':{
    hook:'Hai mặt bàn nhìn giống nhau… nhưng lau cùng cách được không?',
    story:'Sơn gỗ, đá, và gạch có thể có hướng dẫn khác nhau. Đừng để vẻ ngoài quyết định cách vệ sinh.'},
  'sakura-pain-so-hong':{
    hook:'Vết bẩn thì nhỏ, mà sợ lau xong lại hỏng món đồ?',
    story:'Ngại là đúng khi chưa rõ chất liệu. Xem nhãn chăm sóc, và hỏi kỹ trước khi dùng dung dịch.'},
  'sakura-bep':{
    hook:'Bếp vừa nấu xong, nhìn vết bám đã thấy ngại dọn?',
    story:'Đợi bề mặt nguội, nhận diện vật liệu và loại vết bám. Đừng chọn nước lau chỉ vì lời hứa sạch mọi thứ.'},
  'sakura-pain-nham-chai':{
    hook:'Cùng tên Sa cu ra… sao chai nào cũng thấy khác?',
    story:'Bạn đang tìm nước lau đa năng năm trăm mi li lít. Hãy đối chiếu ảnh nhãn, và tách rõ với xả vải khô trước khi đặt.'},
  'sakura-pain-lop-phu':{
    hook:'Chiếc nồi còn dùng tốt, đâu muốn chà mạnh rồi hỏng lớp phủ?',
    story:'Nhìn mặt ngoài và tìm đúng hướng dẫn của hãng. Chất liệu và tình trạng vết bám cần được hỏi rõ trước.'},
  'sakura-pain-dep-chat-lieu':{
    hook:'Dép sáng màu có vết bám… nhưng bạn chưa chắc chất liệu?',
    story:'Nhựa, cao su, và da không nên được coi là một. Gửi ảnh nhãn chăm sóc thay vì đoán qua màu sắc.'},
  'sakura-pain-gach-lop-phu':{
    hook:'Phòng tắm nhìn vẫn lấm tấm… lau thêm hay hỏi lại vật liệu?',
    story:'Gạch men, đá và lớp phủ có hướng dẫn khác nhau. Một tấm ảnh rõ bề mặt giúp câu hỏi cụ thể hơn.'}
};
export function painVoiceCopy(angleId,spokenLeadCode){
  const story=voicePainStories[angleId.replace(/-voice$/,'')];
  if(!story)return null;
  return {...story,script:`${story.hook} ${story.story} Đang hỏi về Sa cu ra? Nhắn mã ${spokenLeadCode}, kèm ảnh bề mặt. Mua một, tặng một, chỉ khi mua qua Tích Tóc. Dùng theo nhãn.`};
}
