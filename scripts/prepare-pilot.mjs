import {readFile,writeFile,mkdir} from 'node:fs/promises';
import path from 'node:path';
import {loadState,updateState,hashFile,root} from '../src/store.mjs';

const [folder,offerFile]=process.argv.slice(2);
if(!path.isAbsolute(folder??'')||!path.isAbsolute(offerFile??''))throw new Error('Cần đường dẫn thư mục sản phẩm và ảnh ưu đãi tuyệt đối');
const packageRoot=path.join(folder,'Sakura_10_Carousel_50_Anh','Sakura_10_Carousel');
const source=JSON.parse(await readFile(path.join(packageRoot,'noi_dung_va_prompt.json'),'utf8'));
const sets=source.sets.filter(s=>s.ref==='clean');
const offerAsset={path:offerFile,name:path.basename(offerFile),sha256:await hashFile(offerFile),kind:'image'};
const hooks=[
 'Dọn nhà mãi, vẫn ngại vết bẩn?', 'Nấu một bữa, dầu mỡ ở lại?', 'Đáy nồi bám bẩn: bạn đã kiểm tra chất liệu chưa?',
 'Dép sáng màu dễ lộ vết bẩn: khoan chà vội.', 'Gạch phòng tắm nhìn vẫn lấm tấm?', 'Đồ nhựa trong nhà: góc nào bạn hay bỏ quên?',
 'Chi tiết nhựa trong xe bám bẩn: chọn đúng cách chăm sóc.', 'Bạn đã để ý mặt ngoài máy giặt chưa?', 'Mua dung dịch vệ sinh: chọn đúng trước đã.',
 'Đang tìm hiểu Sakura? Ưu đãi mua 1 tặng 1 qua TikTok cho bạn.'
];
const nicheTags=['#Sakura #NuocLauDaNang #DonNha #VeSinhNhaCua','#Sakura #VeSinhBep #DauMo #DonBep','#Sakura #DayNoi #VeSinhNhaBep #MeoDonNha','#Sakura #VeSinhDep #DepSangMau #MeoVeSinh','#Sakura #GachMen #VeSinhPhongTam #DonNha','#Sakura #DoNhuaGiaDung #VeSinhNhaCua #MeoDonNha','#Sakura #NoiThatXe #VeSinhXe #MeoVeSinh','#Sakura #MayGiat #DonNha #VeSinhNhaCua','#Sakura #NuocLauDaNang #MeoVeSinh #ChonDungSanPham','#Sakura #NuocLauDaNang #Mua1Tang1 #UuDaiTikTok #GiaDung'];
const state=await loadState();const product=state.products.find(p=>p.id==='sakura-cleaner-500ml');
if(!product)throw new Error('Chạy lệnh sakura trước');
if(state.campaign?.dailyPostingApproved)throw new Error('Pilot setup is superseded by daily authorization; use configure-daily after reconciliation');
let date='2026-10-27',hour=19;
const times=[];
for(let i=0;i<20;i++){
  times.push(`${date}T${hour}:00:00+07:00`);
  if(hour===19){const day=new Date(`${date}T00:00:00Z`);day.setUTCDate(day.getUTCDate()+1);date=day.toISOString().slice(0,10);hour=12;}else hour=19;
}
const offerText='🎁 Mua 1 tặng 1, chỉ khi mua qua TikTok. Mua trực tiếp tại TP.HCM hoặc đặt online trên toàn quốc. Nhắn “SAKURA” để hỏi giá và thông tin chương trình.';
await updateState(s=>{
  s.campaign={...s.campaign,pilotSize:20,pilotStart:times[0],pilotEnd:times[19],pilotTestHours:[12,19],timezone:'Asia/Ho_Chi_Minh',stopAfterPilot:true,pilotDesign:'10 góc × 2 caption hooks; quan sát, chưa phải thử nghiệm nhân quả',publishingEnabled:true};
  for(let i=0;i<20;i++){
    const q=s.queue[i];const topic=i%10;const set=sets[topic];const variant=i<10?1:2;
    if(q.receipt)continue;
    q.publishAt=times[i];q.approved=true;q.disclosures={ownBrand:true,aiGenerated:true};
    const assets=topic<9?product.assets.filter(a=>a.sourceSet===set.id).map((a,index)=>index===3?offerAsset:a):[offerAsset,...product.assets.filter(a=>a.sourceSet===sets[0].id).slice(1)];
    q.assets=assets;q.status='needs_visual_review';q.assetsVerified=false;
    q.title=topic===9?'Sakura 500 ml | Mua 1 tặng 1, chỉ khi mua qua TikTok':`Sakura 500 ml | ${set.title}`.slice(0,90);
    const body=set?.caption??'Tìm hiểu Sakura nước lau đa năng 500 ml. Đọc nhãn và chọn sản phẩm phù hợp với nhu cầu trước khi mua. Hình ảnh minh họa, không phải kết quả thử nghiệm.';
    q.caption=`${variant===1?hooks[topic]:`Trước khi quyết định: ${set?.title.toLowerCase()??'hỏi rõ chương trình mua 1 tặng 1 qua TikTok'}.`}\n\n${body}\n\n${offerText}\n\n${nicheTags[topic]} #HoChiMinh #Mua1Tang1 #UuDaiTikTok`;
    q.experiment={topic:topic+1,variant,variable:'caption-hook',assetReuse:'Cặp A/B dùng cùng bộ ảnh; không giả định kết quả nhân quả.'};
  }
  return s;
});
const latest=await loadState();await mkdir(path.join(root,'state'),{recursive:true});
await writeFile(path.join(root,'state','pilot-upload.json'),JSON.stringify(latest.queue.slice(0,20),null,2),'utf8');
console.log(JSON.stringify({items:20,first:times[0],last:times[19],readyForVisualReview:true}));
