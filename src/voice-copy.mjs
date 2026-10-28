// Original spoken copy: a recognizable problem, a grounded response, one inquiry CTA.
export const voicePainStories={
  'sakura-pain-tan-ca':{
    hook:'Tan ca rồi, bạn còn phải tăng ca ở bếp?',
    story:'Việc nhà đừng dồn hết lên một người. Chia nhau một góc nhỏ, rồi xem đúng chất liệu trước khi chọn nước lau.'},
  'sakura-pain-chia-viec':{
    hook:'Cùng ăn một bữa, sao một người ôm hết phần dọn?',
    story:'Bạn chọn rửa chén hay dọn góc bếp? Chia việc cho rõ, rồi xem hướng dẫn của từng bề mặt.'},
  'sakura-pain-phong-tro':{
    hook:'Phòng trọ đã chật, sao đồ dọn nhà cứ nhiều lên?',
    story:'Đừng chốt thêm chỉ vì nghe chữ đa năng. Nói rõ góc cần lau và chất liệu, rồi hỏi sản phẩm có phù hợp không.'},
  'sakura-pain-vat-lieu':{
    hook:'Nhìn giống nhau là lau giống nhau? Bạn chắc chưa?',
    story:'Sơn gỗ, đá và gạch có thể cần cách chăm sóc khác nhau. Chụp rõ bề mặt và nhãn vật liệu trước khi hỏi.'},
  'sakura-pain-so-hong':{
    hook:'Muốn sạch vết bám, nhưng lại sợ hỏng món đồ?',
    story:'Đừng đoán chỉ qua một tấm ảnh quảng cáo. Xem nhãn chăm sóc và hỏi đúng chất liệu trước khi chọn dung dịch.'},
  'sakura-bep':{
    hook:'Một bữa cơm xong, góc bếp lại thành ca làm thứ hai?',
    story:'Chọn một góc cần xử lý, đợi bề mặt nguội rồi xác định vật liệu. Hỏi đúng nhu cầu trước khi mua nước lau.'},
  'sakura-pain-nham-chai':{
    hook:'Thấy chữ Sa cu ra là chốt đơn? Khoan đã!',
    story:'Bạn cần nước lau đa năng hay xả vải khô? Cùng tên chưa chắc cùng sản phẩm. Đối chiếu đúng nhãn chai năm trăm mi li lít.'},
  'sakura-pain-lop-phu':{
    hook:'Đáy nồi bám bẩn: bỏ thì tiếc, chà lại sợ hỏng?',
    story:'Khoan chọn theo lời hứa sạch như mới. Đây là mặt ngoài đáy nồi: xem chất liệu, lớp phủ và hướng dẫn của hãng trước.'},
  'sakura-pain-dep-chat-lieu':{
    hook:'Dép trắng là bạn chà luôn, hay xem chất liệu trước?',
    story:'Nhựa, cao su và da không cùng cách chăm sóc. Gửi ảnh nhãn và vật liệu, đừng để màu trắng quyết định cách lau.'},
  'sakura-pain-gach-lop-phu':{
    hook:'Lau rồi vẫn lấm tấm: bạn đang gặp loại vết bám nào?',
    story:'Đừng mặc định mọi vệt đều là bẩn thông thường. Chụp rõ bề mặt gạch hay đá, rồi hỏi cách dùng phù hợp.'},
  'sakura-pain-mua-dung-nhu-cau':{
    hook:'Được tặng thêm, nhưng có phải thứ nhà mình cần?',
    story:'Nói rõ bề mặt và vết bám trước. Hỏi độ phù hợp và giá, đừng chỉ chốt đơn vì ưu đãi.'}
};
export function painVoiceCopy(angleId,spokenLeadCode,promotion,{queueId}={}){
  const story=voicePainStories[angleId.replace(/-voice$/,'')];
  if(!story)return null;
  const colloquial={
    'sakura-102':{angle:'sakura-pain-chia-viec',lines:['Cùng ăn, cùng dọn mới công bằng chứ, đúng không?','Nhà mình có ai hay ôm hết phần dọn không?','Muốn hỏi Sa cu ra có hợp bề mặt nhà mình không, chụp ảnh gửi shop nha.']},
    'sakura-103':{angle:'sakura-pain-phong-tro',lines:['Phòng đã chật, sao chai lọ cứ nhiều thêm vậy?','Mua đúng thứ mình cần trước nha.','Muốn hỏi Sa cu ra có hợp chỗ cần lau không, chụp ảnh gửi shop nha.']},
    'sakura-104':{angle:'sakura-pain-vat-lieu',lines:['Nhìn giống nhau, đâu chắc lau giống nhau?','Đá, gạch hay gỗ, mình hỏi rõ chất liệu trước nha.','Cần hỏi Sa cu ra có hợp không, chụp ảnh gửi shop nha.']},
    'sakura-105':{angle:'sakura-pain-so-hong',lines:['Vết bám thì nhỏ, mà lỡ hỏng món đồ lại tiếc, đúng không?','Mình xem nhãn chăm sóc trước nha.','Cần hỏi Sa cu ra có hợp không, chụp ảnh gửi shop nha.']},
  }[queueId];
  if(promotion?.voiceHook&&colloquial?.angle===angleId.replace(/-voice$/,''))return {...story,promoHook:promotion.voiceHook,
    copyRevision:'promo-first50-colloquial-v7',spokenLeadCodeIncluded:false,
    script:`${promotion.voiceHook.replace('! ','!\n')}\n\n${colloquial.lines.join('\n')}`};
  const conversational={
    'sakura-pain-tan-ca':{hook:'Tan ca rồi. Lại tăng ca ở bếp hả?',story:'Việc nhà, mình chia nhau nha. Trước khi chọn nước lau, nhớ xem đúng chất liệu.'},
    'sakura-pain-chia-viec':{hook:'Cùng ăn một bữa. Sao một người ôm hết phần dọn?',story:'Việc nhà, mình chia nhau cho rõ nha. Trước khi chọn nước lau, nhớ xem hướng dẫn của từng bề mặt.'},
    'sakura-pain-phong-tro':{hook:'Phòng trọ đã chật. Sao chai lọ cứ nhiều thêm?',story:'Mua đúng thứ mình cần nha. Nói rõ góc cần lau và chất liệu, rồi hỏi sản phẩm có phù hợp không.'},
    'sakura-pain-vat-lieu':{hook:'Nhìn giống nhau, là lau giống nhau hả?',story:'Sơn gỗ, đá và gạch có thể cần cách chăm sóc khác nhau. Chụp rõ bề mặt, rồi hỏi shop nha.'},
    'sakura-pain-so-hong':{hook:'Muốn sạch vết bám. Nhưng lại sợ hỏng món đồ?',story:'Đừng đoán qua quảng cáo nha. Xem nhãn chăm sóc, hỏi đúng chất liệu trước khi chọn nước lau.'}
  }[angleId.replace(/-voice$/,'')];
  if(promotion?.voiceHook&&conversational)return {...story,promoHook:promotion.voiceHook,script:`${promotion.voiceHook.replace('! ','!\n')}\n\n${conversational.hook}\n${conversational.story}\n\nCần tư vấn Sa cu ra? Nhắn: ${spokenLeadCode}. Gửi kèm ảnh bề mặt. Dùng theo nhãn.`};
  const opening=promotion?.voiceHook?promotion.voiceHook+' ':'';
  const closing=promotion?.voiceHook?'':'Mua một, tặng một, chỉ khi mua qua Tích Tóc. ';
  return {...story,promoHook:promotion?.voiceHook??null,script:`${opening}${story.hook} ${story.story} Cần tư vấn Sa cu ra? Nhắn mã ${spokenLeadCode}, kèm ảnh bề mặt. ${closing}Dùng theo nhãn.`};
}
