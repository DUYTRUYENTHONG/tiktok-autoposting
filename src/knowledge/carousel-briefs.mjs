import {hash} from './index.mjs';
import {embeddingModels} from './embeddings.mjs';

const productId='sakura-cleaner-500ml';
const promotionKey='buy1-get1-tiktok-first50';
const offer='Mua 1 tặng 1 cho 50 đơn đầu tiên từ TikTok';
const publicLocation='Vựa Sầu Riêng Cô Ba, 322 Đ. Huỳnh Thị Hai';
const nicheHashtags={
  'after-shift':['#DonNha','#GocBep'],
  'promotion-vs-need':['#MuaSamThongMinh','#DonNha'],
  'small-room':['#DonPhongTro','#PhongTro'],
  'lookalike-surfaces':['#VeSinhBeMat','#ChamSocNhaCua'],
  'care-label-first':['#ChamSocDoDung','#VeSinhNhaCua'],
  'correct-bottle':['#ChonDungSanPham','#DonNha'],
  'fridge-exterior':['#MatNgoaiTuLanh','#ChamSocDoGiaDung'],
  'shoe-material':['#ChamSocGiayDep','#GocNha'],
  'tile-or-stone':['#GachMen','#GocPhongTam'],
  'ask-online-clearly':['#TuVanDonNha','#MuaSamOnline'],
};
const requiredSourceIds=['sakura:identity:500ml','sakura:offer:buy1-get1-tiktok-first50','sakura:policy:material-check','sakura:editorial:footage-video-policy'];

// Original editorial hypotheses. No outcome, customer testimonial or cleaning result is inferred.
export const carouselPainAngles=Object.freeze([
  {key:'after-shift',name:'Ca làm thứ hai sau giờ tan ca',sourceAngleId:'sakura-pain-tan-ca',
    coverHook:'Tan ca rồi, vẫn phải tăng ca ở nhà?',painHeading:'Mệt nhất là không biết bắt đầu đâu.',
    pain:'Đồ chưa cất, góc bếp chưa dọn, việc nhỏ cứ chờ. Nhìn cả căn nhà một lượt dễ thấy ngợp.',
    responseHeading:'Chọn một góc, hỏi một việc.',response:'Khoanh vùng cần lau. Ghi tên vật liệu và loại vết bám rồi hỏi shop; đọc nhãn trước khi chọn cách dùng.',
    visual:'Bối cảnh một người vừa về nhà, góc bếp sinh hoạt; không dựng kết quả trước/sau.'},
  {key:'promotion-vs-need',name:'Mua theo nhu cầu trước sức hút ưu đãi',sourceAngleId:'sakura-pain-mua-dung-nhu-cau',
    coverHook:'Được tặng thêm, nhà mình có cần?',painHeading:'Thêm một chai chưa chắc đúng việc.',
    pain:'Ưu đãi dễ khiến mình chốt nhanh. Nhưng góc cần lau và chất liệu đã được hỏi rõ chưa?',
    responseHeading:'Đúng nhu cầu rồi mới quyết.',response:'Gửi ảnh bề mặt và mô tả vết bám. Hỏi độ phù hợp của sản phẩm rồi đọc nhãn trước khi đặt.',
    visual:'Bối cảnh cân nhắc danh sách mua sắm; không dựng đơn hàng, giá tiền, đồng hồ đếm ngược hay khách mua.'},
  {key:'small-room',name:'Phòng nhỏ và đồ dọn nhà nhiều lên',sourceAngleId:'sakura-pain-phong-tro',
    coverHook:'Phòng đã chật, chai lọ còn tăng?',painHeading:'Chật chỗ mà vẫn chưa rõ cần gì.',
    pain:'Mỗi lần gặp một góc cần dọn lại muốn mua thêm. Chữ “đa năng” có làm mình bỏ qua việc hỏi kỹ?',
    responseHeading:'Kiểm tra đồ đang có trước.',response:'Liệt kê góc cần lau và vật liệu. Đối chiếu nhãn các món đang có, rồi hỏi đúng sản phẩm cho nhu cầu còn thiếu.',
    visual:'Bối cảnh phòng nhỏ hoặc tủ đồ gia dụng; không hứa một chai thay mọi sản phẩm.'},
  {key:'lookalike-surfaces',name:'Hai bề mặt trông giống nhưng vật liệu khác',sourceAngleId:'sakura-pain-vat-lieu',
    coverHook:'Cùng màu là lau cùng cách sao?',painHeading:'Nhìn giống chưa đủ để chọn.',
    pain:'Mặt sáng bóng có thể là vật liệu hoặc lớp phủ khác nhau. Một tấm ảnh quảng cáo chưa trả lời được điều đó.',
    responseHeading:'Tìm tên vật liệu, đừng đoán.',response:'Chụp rõ nhãn chăm sóc hoặc thông tin bề mặt. Đối chiếu hướng dẫn của hãng và hỏi shop trước khi dùng.',
    visual:'Cận cảnh các bề mặt nội thất; chỉ minh họa câu hỏi vật liệu, không thể hiện Sakura đang dùng trên gỗ hay đá.'},
  {key:'care-label-first',name:'Sợ làm hỏng món đồ vẫn còn tốt',sourceAngleId:'sakura-pain-so-hong',
    coverHook:'Vết nhỏ thôi, lỡ hỏng đồ thì sao?',painHeading:'Ngại nhất là chọn sai cách lau.',
    pain:'Món đồ còn tốt khiến mình ngần ngại xử lý. Chà mạnh hay chọn dung dịch theo cảm tính đều chưa giải quyết câu hỏi vật liệu.',
    responseHeading:'Giữ nhãn chăm sóc trong tầm tay.',response:'Tìm hướng dẫn của món đồ trước. Gửi shop ảnh, tên vật liệu và nhu cầu để hỏi độ phù hợp; không tự suy từ chữ “đa năng”.',
    visual:'Bối cảnh chăm sóc vật dụng gia đình; không tạo vết hỏng hoặc lời bảo đảm an toàn cho mọi bề mặt.'},
  {key:'correct-bottle',name:'Nhận diện đúng Sakura nước lau đa năng500ml',sourceAngleId:'sakura-pain-nham-chai',
    coverHook:'Thấy Sakura là chốt? Khoan đã!',painHeading:'Cùng tên, đã đúng loại cần mua?',
    pain:'Lướt nhiều ảnh sản phẩm dễ nhớ tên mà quên đọc nhãn. Trước khi hỏi chương trình, hãy đối chiếu đúng chai.',
    responseHeading:'Nhìn đủ tên và dung tích.',response:'Đối chiếu nhãn “Nước lau đa năng Sakura”, dung tích 500 ml và ảnh chai thật. Hỏi shop nếu thông tin chưa khớp.',
    visual:'Slide cuối bắt buộc packshot Sakura thật rõ nhãn500ml; không dùng chai nhãn khác trong stock như sản phẩm Sakura.'},
  {key:'fridge-exterior',name:'Mặt ngoài cửa tủ lạnh và dấu tay',sourceAngleId:'sakura-pain-fridge-exterior',sourceAngleStatus:'new-editorial-hypothesis',
    coverHook:'Cửa tủ lạnh bám tay, lau sao cho đúng?',painHeading:'Cửa tủ có vệt, lớp phủ là gì?',
    pain:'Dấu tay ở mặt ngoài cửa tủ khiến mình muốn lau ngay. Nhưng màu và độ bóng chưa cho biết lớp phủ cần chăm sóc ra sao.',
    responseHeading:'Xem hướng dẫn cho mặt ngoài.',response:'Đối chiếu lớp phủ mặt ngoài và hướng dẫn của hãng tủ lạnh. Gửi ảnh vị trí để hỏi shop về độ phù hợp; không suy thành cách dùng bên trong tủ hoặc bề mặt tiếp xúc thực phẩm.',
    visual:'Chỉ dùng ảnh mặt ngoài tủ lạnh và cửa/tay nắm. Không minh họa vệ sinh bên trong, thực phẩm, hiệu quả tẩy vết hoặc đối chiếu trước/sau.'},
  {key:'shoe-material',name:'Màu sắc không xác định vật liệu giày dép',sourceAngleId:'sakura-pain-dep-chat-lieu',
    coverHook:'Giày dép bẩn, cứ chà mạnh sao?',painHeading:'Nhìn màu chưa biết được vật liệu.',
    pain:'Giày đen hay màu khác đều chưa cho biết chất liệu và lớp phủ. Chỉ nhìn màu rồi chọn cách chà có thể bỏ qua hướng dẫn chăm sóc.',
    responseHeading:'Chụp nhãn, hỏi chất liệu trước.',response:'Tìm hướng dẫn chăm sóc của giày dép. Gửi ảnh nhãn và vị trí cần hỏi; chưa có xác minh Sakura phù hợp với mọi loại giày dép.',
    visual:'Ảnh I012 là giày đen: giữ đúng bối cảnh giày, không gọi là dép trắng. Không dựng phục hồi như mới hoặc phun Sakura lên da, da lộn.'},
  {key:'tile-or-stone',name:'Vệt lấm tấm và câu hỏi gạch hay đá',sourceAngleId:'sakura-pain-gach-lop-phu',
    coverHook:'Lấm tấm hoài, có chắc chỉ là bẩn?',painHeading:'Đừng đoán vệt bám chỉ qua màu.',
    pain:'Góc sàn hoặc tường có vệt khiến mình muốn đổi nước lau. Nhưng bề mặt là gạch hay đá, vệt xuất hiện từ đâu?',
    responseHeading:'Gửi rõ bề mặt và loại vệt.',response:'Chụp tổng thể rồi chụp cận vị trí cần hỏi. Ghi vật liệu theo thông tin của hãng; không tự kết luận Sakura xử lý được mọi loại vệt.',
    visual:'Bối cảnh gạch hoặc không gian phòng tắm; không hứa trị mốc, tẩy cặn, phục hồi đá hay tạo đối chiếu trước/sau.'},
  {key:'ask-online-clearly',name:'Hỏi online nhưng thiếu ảnh và thông tin',sourceAngleId:'sakura-pain-mua-online',
    coverHook:'Chỉ nhắn “sạch không?”, khó tư vấn.',painHeading:'Shop chưa thấy góc bạn đang cần.',
    pain:'Một câu hỏi quá ngắn chưa cho biết đồ gì, vật liệu gì và đang gặp vết nào. Mua từ xa càng cần mô tả rõ.',
    responseHeading:'Một ảnh, ba thông tin.',response:'Gửi ảnh bề mặt, tên vật liệu và loại vết bám. Hỏi rõ sản phẩm và hướng dẫn trên nhãn trước khi quyết định mua.',
    visual:'Bối cảnh chụp ảnh góc nhà hoặc ghi chú; không hiện tin nhắn thật, danh tính, lời khách hàng hoặc ảnh hóa đơn.'},
]);

function assertGrounding(result,index) {
  if(result?.status!=='retrieved'||result.mode!=='retrieval-and-prompt-only'||result.corpusHash!==index.corpusHash)throw new Error('Carousel preparation requires current source-grounded LangChain retrieval');
  if(result.retrieval!=='bm25+dense-rrf-v1'||result.embeddingModel?.id!==embeddingModels.e5.id||result.embeddingModel?.revision!==embeddingModels.e5.revision)throw new Error('Carousel preparation requires the pinned local multilingual E5 hybrid retriever');
  const ids=new Set(result.sources?.map(s=>s.id));
  if(requiredSourceIds.some(id=>!ids.has(id)))throw new Error('Retrieved evidence does not cover product, offer, material policy and footage editorial policy');
  for(const evidence of result.sources) {
    const original=index.sources.find(s=>s.sourceId===evidence.id);
    if(!original||original.text!==evidence.snippet||original.productId!==productId||(original.promotionKey!=='*'&&original.promotionKey!==promotionKey))throw new Error('Carousel evidence mismatch or cross-promotion contamination');
  }
}

const assetRequirement=(authentic=false)=>({kind:authentic?'authentic-product-packshot':'stock-photo-illustration',path:null,sha256:null,
  selected:false,visuallyReviewed:false,licenseReviewed:false,printedLabel:authentic?null:'Ảnh minh họa',
  constraints:authentic?['Dùng ảnh Sakura thật do chủ kênh cung cấp; giữ đúng nhãn và dung tích500ml.']:['Không suy thành demo Sakura, lời chứng thực hoặc kết quả thử nghiệm.','Không ngụ ý người mẫu stock xác nhận sản phẩm.','Không hiện nhãn chai khác như Sakura.']});

export async function prepareCarouselBriefs({index,pipeline,asOf=new Date().toISOString()}={}) {
  if(!index?.corpusHash||!pipeline?.invoke||!Number.isFinite(Date.parse(asOf)))throw new Error('A current index, local LangChain pipeline and valid asOf are required');
  const posts=[];
  for(const [i,angle] of carouselPainAngles.entries()) {
    const number=201+i,inquiryCode=`ẢNH${number}`;
    const query=`Đối chiếu ưu đãi TikTok, dung tích, vật liệu, chính sách video footage minh họa và giọng nữ miền Nam cho góc ${angle.name}.`;
    const result=await pipeline.invoke({query,productId,promotionKey,asOf,topK:4});
    assertGrounding(result,index);
    const slides=[
      {order:1,role:'offer-first-hook',heading:'MUA 1 TẶNG 1',body:`50 đơn đầu tiên từ TikTok\n${angle.coverHook}`,footer:'Ảnh minh họa · Dùng theo nhãn',asset:assetRequirement()},
      {order:2,role:'pain-point',heading:angle.painHeading,body:angle.pain,footer:'Tình huống minh họa, không phải lời khách hàng',asset:assetRequirement()},
      {order:3,role:'useful-response',heading:angle.responseHeading,body:angle.response,footer:'Đọc nhãn và hướng dẫn của bề mặt trước khi dùng',asset:assetRequirement()},
      {order:4,role:'authentic-product-cta',heading:'Nước lau đa năng Sakura',body:`Chai 500 ml\nNhắn ${inquiryCode}, kèm ảnh bề mặt và tên vật liệu để hỏi shop.`,footer:'Dùng theo nhãn · Hỏi độ phù hợp trước khi mua',asset:assetRequirement(true)},
    ];
    const hashtags=['#Sakura','#NuocLauDaNang','#Mua1Tang1','#TikTok',...nicheHashtags[angle.key],'#TPHCM'];
    const caption=`${offer}.\n\n${angle.coverHook}\n${angle.response}\n\nẢnh và tình huống chỉ minh họa; không phải demo Sakura, lời chứng thực hay kết quả thử nghiệm.\nNhắn “${inquiryCode}” kèm ảnh bề mặt, tên vật liệu và nhu cầu để hỏi shop về Sakura 500 ml. Đọc nhãn trước khi sử dụng.\n\n${publicLocation}.\nMua trực tiếp tại TP.HCM hoặc đặt online toàn quốc. Hỏi giá và điều kiện trước khi đặt.\n\n${hashtags.join(' ')}`;
    posts.push({id:`sakura-photo-${number}`,productId,angleId:`sakura-photo-${angle.key}`,sourceAngleId:angle.sourceAngleId,angleName:angle.name,
      variantId:'stock-photo-rag-v1',format:'photo',distribution:'organic',inquiryCode,promotionKey,hypothesisStatus:'untested',sourceAngleStatus:angle.sourceAngleStatus??'existing-hypothesis-reference',
      status:'draft_needs_stock_selection_product_reference_and_visual_review',mode:'retrieval-grounded-editorial-template',fineTunedModelUsed:false,generativeLLMUsed:false,
      visualDirection:angle.visual,slides,caption,hashtags,publicLocation,serviceArea:{offline:'TP.HCM',online:'Việt Nam'},
      grounding:{query,corpusHash:result.corpusHash,retrieval:result.retrieval,embeddingModel:result.embeddingModel,sourceIds:result.sources.map(s=>s.id),sources:result.sources,retrievedAt:asOf},
      readiness:{stockPhotosSelected:false,productReferenceSelected:false,visualReviewPassed:false,musicSelected:false,platformDisclosureReviewed:false,queueRegistered:false,submitted:false}});
  }
  return {version:1,preparedAt:asOf,mode:'retrieval-grounded-editorial-template',fineTunedModelUsed:false,generativeLLMUsed:false,
    productId,promotionKey,corpusHash:index.corpusHash,briefsHash:hash(posts.map(({grounding,...p})=>({...p,grounding:{...grounding,retrievedAt:undefined}}))),
    globalPromotion:{text:offer,maxOrders:50,unit:'orders',channel:'TikTok',limitScope:'campaign-wide',perPostReset:false,perDayReset:false,remainingOrders:null,redeemedOrders:null},
    layout:{width:1080,height:1440,aspectRatio:'3:4',slidesPerPost:4,safeMarginPx:86,language:'vi-VN',largeVietnameseType:true},
    publication:{authorizedByThisManifest:false,canonicalQueueModified:false,submittedCount:0},posts};
}
