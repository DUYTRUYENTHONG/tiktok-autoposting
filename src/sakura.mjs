import path from 'node:path';
import {readFile,readdir} from 'node:fs/promises';
import {hashFile} from './store.mjs';

const topics=[
 ['gioi-thieu','Làm quen với Sakura','Bạn đang tìm hiểu nước lau đa năng Sakura?'],
 ['bep','Góc bếp thường ngày','Trước khi lau góc bếp, bạn kiểm tra điều gì?'],
 ['day-noi','Chọn đúng cách chăm sóc nồi','Đáy nồi bám bẩn: bắt đầu từ chất liệu.'],
 ['dep','Nhận diện chất liệu dép','Đôi dép của bạn làm bằng chất liệu gì?'],
 ['gach','Gạch men và loại vết bám','Vết bám trên gạch: nên hỏi gì trước khi chọn sản phẩm?'],
 ['do-nhua','Đồ nhựa trong nhà','Đồ nhựa gia dụng: đọc nhãn trước khi vệ sinh.'],
 ['xe','Chi tiết nhựa trong xe','Vệ sinh chi tiết trong xe: đừng bỏ qua hướng dẫn vật liệu.'],
 ['may-giat','Chăm sóc mặt ngoài máy giặt','Mặt ngoài máy giặt: chọn đúng vùng cần lau.'],
 ['chon-dung','Mua đúng nhu cầu','Trước khi mua Sakura, chuẩn bị 3 thông tin này.'],
 ['uu-dai','Mua 1 tặng 1, chỉ khi mua qua TikTok','Đang tìm hiểu ưu đãi mua 1 tặng 1 qua TikTok của Sakura?']
];
const approaches=[
 ['Câu hỏi mở','Bạn đang gặp vấn đề gì?'],['Danh sách kiểm tra','3 điều cần kiểm tra trước khi chọn sản phẩm.'],
 ['Hỏi đáp','Một câu hỏi nên gửi shop trước khi mua.'],['Cận cảnh','Nhìn kỹ nhãn và bao bì trước khi quyết định.'],
 ['Tại TP.HCM','Ở TP.HCM, bạn muốn hỏi sản phẩm trực tiếp?'],['Đặt online','Đặt online: gửi đủ thông tin để shop tư vấn.'],
 ['Theo bề mặt','Bề mặt của bạn là gì? Đây là điểm bắt đầu.'],['Theo nhu cầu','Chọn sản phẩm theo nhu cầu, không chỉ theo tên.'],
 ['Tìm hiểu ưu đãi','Mua 1 tặng 1, chỉ khi mua qua TikTok: hỏi rõ sản phẩm và điều kiện trước khi đặt.'],['Tóm tắt','Lưu lại để hỏi shop khi cần.']
];
export function planSakura(source,product){
  const sets=source.sets.filter(s=>s.ref==='clean');
  const angles=topics.map(([key,name,hook],index)=>({id:`sakura-${key}`,productId:product.id,name,format:'photo',distribution:'organic',hookA:hook,hookB:approaches[index][1],status:'Giả thuyết chưa kiểm chứng',evidenceIds:[],proofRequired:index<8?'Cần xác minh hướng dẫn trên nhãn cho vật liệu trước khi đăng nội dung hướng dẫn.':'Thông tin thương mại do chủ kênh cung cấp.',imagePrompt:'Dùng ảnh tham chiếu Sakura thật, tỷ lệ 3:4, chữ tiếng Việt rõ. Không dựng kết quả thử nghiệm.',videoPrompt:'Chuẩn bị sau giai đoạn thử nghiệm carousel.',sourceSet:sets[index]?.id??null}));
  const queue=[];
  // The first 20 briefs are a diverse pilot; later briefs stay adaptable to measured results.
  for(let variant=0;variant<10;variant++)for(let index=0;index<10;index++){
    const a=angles[index];const set=sets[index];const approach=approaches[variant];
    const caption=`${variant===0?a.hookA:approach[1]}\n\nTìm hiểu nước lau đa năng Sakura 500 ml. Gửi shop ảnh bề mặt, tên vật liệu và nhu cầu của bạn để hỏi thông tin phù hợp. Đọc nhãn và kiểm tra hướng dẫn trước khi sử dụng. Hình ảnh minh họa, không phải kết quả thử nghiệm.\n\n🎁 Mua 1 tặng 1, chỉ khi mua qua TikTok. Mua trực tiếp tại TP.HCM hoặc đặt online trên toàn quốc. Nhắn “SAKURA” để hỏi giá và thông tin chương trình.\n\n#Sakura #NuocLauDaNang #VeSinhNhaCua #MeoDonNha #HoChiMinh #Mua1Tang1 #UuDaiTikTok`;
    const id=`sakura-${String(queue.length+1).padStart(3,'0')}`;
    const slides=[
      {role:'hook',headline:variant===0?a.hookA:approach[1],body:`${a.name} · ${approach[0]}`},
      {role:'context',headline:'BẮT ĐẦU TỪ NHU CẦU THẬT',body:'Gửi ảnh bề mặt, tên vật liệu và loại vết bám để hỏi thông tin phù hợp.'},
      {role:'guidance',headline:'ĐỌC NHÃN TRƯỚC KHI DÙNG',body:'Đối chiếu vật liệu và làm theo hướng dẫn. Không coi hình minh họa là kết quả thử nghiệm.'},
      {role:'offer',headline:'MUA 1 TẶNG 1',body:'Hỏi shop về giá và thông tin chương trình. Không tự thêm hạn chót hoặc miễn phí giao hàng.'},
      {role:'cta',headline:'NHẮN “SAKURA” ĐỂ HỎI THÊM',body:'Mua trực tiếp tại TP.HCM · Đặt online toàn quốc.'}
    ].map((s,i)=>({...s,prompt:`Tạo một thẻ carousel sản phẩm 3:4, phong cách lavender/plum như bộ Sakura đã cung cấp. Dùng ảnh sản phẩm thật làm tham chiếu, giữ đúng bao bì. Nội dung tiếng Việt chính xác: “${s.headline}”; phần phụ: “${s.body}”. Góc ${a.name}; biến thể ${approach[0]}; thẻ ${i+1}/5. Không thêm hiệu quả, giá, chứng nhận, lời chứng thực hoặc ảnh trước/sau. Ghi “Hình minh họa · Đọc hướng dẫn trên nhãn.” ở chân ảnh.`}));
    queue.push({id,account:'saigomlia',productId:product.id,angleId:a.id,variantId:`v${variant+1}`,format:'photo',phase:variant<2?'pilot':'adaptive-backlog',title:`Sakura 500 ml · ${a.name}`.slice(0,90),caption,slides,sourceSet:variant===0?set?.id??null:null,assets:[],assetsVerified:false,status:'needs_generation',publishAt:null,receipt:null,requiresLabelReview:index>0&&index<8,expansionNote:variant>=2?'Điều chỉnh sau kết quả pilot, không đăng dồn 100 bản.':null});
  }
  return {angles,queue};
}
export async function prepareSakura(folder){
  if(!path.isAbsolute(folder))throw new Error('Cần đường dẫn Sakura tuyệt đối');
  const packageRoot=path.join(folder,'Sakura_10_Carousel_50_Anh','Sakura_10_Carousel');
  const source=JSON.parse(await readFile(path.join(packageRoot,'noi_dung_va_prompt.json'),'utf8'));
  if(!Array.isArray(source.sets))throw new Error('Không tìm thấy danh sách carousel nguồn');
  const assetRoot=path.join(packageRoot,'Anh_carousel');const assets=[];
  for(const set of source.sets.filter(s=>s.ref==='clean')){
    if(typeof set.id!=='string'||!/^\d{2}_[a-z0-9_]+$/.test(set.id))throw new Error('Tên bộ nguồn không hợp lệ');
    const directory=path.join(assetRoot,set.id);
    for(const name of (await readdir(directory)).filter(n=>/\.png$/i.test(n)).sort()){
      const file=path.join(directory,name);assets.push({path:file,name,sourceSet:set.id,kind:'image',sha256:await hashFile(file)});
    }
  }
  const product={id:'sakura-cleaner-500ml',name:'Nước lau đa năng Sakura 500 ml',area:'Mua trực tiếp tại TP.HCM · Online toàn Việt Nam',facts:{offer:'Mua 1 tặng 1, chỉ khi mua qua TikTok',offerSource:'User, 2026-10-27',volume:'500 ml',volumeSource:'Ảnh nhãn sản phẩm được cung cấp',claimsVerified:false,price:null},assets,reference:path.join(packageRoot,'Anh_tham_chieu','Sakura_nuoc_lau_500ml.jpg')};
  const plan=planSakura(source,product);
  for(const item of plan.queue){
    if(item.sourceSet){item.assets=assets.filter(a=>a.sourceSet===item.sourceSet);item.status='needs_visual_review';}
  }
  return {product,...plan,campaign:{goal:100,format:'photo',language:'vi',area:product.area,offer:'Mua 1 tặng 1, chỉ khi mua qua TikTok',sourceFolder:folder,publishingEnabled:false,existingCarouselSets:source.sets.filter(s=>s.ref==='clean').length,excluded:'Bộ xả vải khô là sản phẩm khác',scheduleStatus:'Photo scheduling visible in TikTok Studio; no post submitted'}};
}
