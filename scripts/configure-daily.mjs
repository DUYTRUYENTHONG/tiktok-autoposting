import {readFile,writeFile} from 'node:fs/promises';
import path from 'node:path';
import {updateState,loadState,root} from '../src/store.mjs';
import {painpointStories} from '../src/content-bank.mjs';
import {vietnamDay,dailyKpi,planDailySlots} from '../src/daily-kpi.mjs';

const now=new Date(),today=vietnamDay(now),tomorrow=vietnamDay(new Date(Number(now)+86400000));
try{
  const journal=JSON.parse(await readFile(path.join(root,'state','pilot-submission-journal.json'),'utf8'));
  if(journal.some(e=>['submitting','needs_review'].includes(e.status)))throw Error('Reconcile uncertain browser journal entries before replanning');
}catch(e){if(e.code!=='ENOENT')throw e;}
await updateState(s=>{
  const product=s.products.find(p=>p.id==='sakura-cleaner-500ml');if(!product)throw Error('Sakura product is missing');
  if(s.queue.some(q=>['submitting','needs_review'].includes(q.status)))throw Error('Reconcile uncertain submissions before replanning');
  const topic={ 'gioi-thieu':0,bep:1,'day-noi':2,dep:3,gach:4,'do-nhua':5,xe:6,'may-giat':7,'chon-dung':8,'uu-dai':9 };
  const offer=s.queue.find(q=>q.id==='sakura-019')?.assets[3];
  const kitchen=s.queue.find(q=>q.id==='sakura-019')?.assets[0];
  const generic=s.queue.find(q=>q.id==='sakura-020')?.assets;
  if(!offer||!kitchen||!generic)throw Error('Verified creative references are missing');
  s.campaign={...s.campaign,dailyTarget:20,dailyStart:s.campaign?.dailyStart??today,timezone:'Asia/Ho_Chi_Minh',dailyPostingApproved:true,approvalSource:'User: KPI20posts/day, 2026-10-27',stopAfterPilot:false,publishingEnabled:true,leadDefinition:'Qualified inquiry includes a stated cleaning need and surface/material; orders are recorded separately.',leadTarget:null,preserveNineSchedules:true};
  const offerAngle=s.angles.find(a=>a.id==='sakura-uu-dai');
  if(offerAngle)offerAngle.name='Ưu đãi mua qua TikTok';
  const familyTags={bep:'#VeSinhBep #DonBep','day-noi':'#DayNoi #VeSinhNhaBep',dep:'#VeSinhDep #MeoVeSinh',gach:'#VeSinhPhongTam #GachMen','do-nhua':'#DoNhuaGiaDung #DonNha',xe:'#NoiThatXe #VeSinhXe','may-giat':'#MayGiat #DonNha','gioi-thieu':'#DonNha #GiaDung','chon-dung':'#ChonDungSanPham #MeoDonNha','uu-dai':'#GiaDung #UuDaiTikTok'};
  for(const concept of painpointStories){
    const id=`sakura-pain-${concept.key}`;
    if(!s.angles.some(a=>a.id===id))s.angles.push({id,productId:product.id,name:concept.pain,format:'photo',distribution:'organic',hookA:concept.hook,hookB:`Nếu là bạn: ${concept.hook}`,status:concept.status,evidenceIds:[],proofRequired:concept.proof,imagePrompt:`Nhân vật người Việt trưởng thành trong tình huống ${concept.story} Giữ đúng ảnh sản phẩm, không dựng kết quả. Không in chữ AI lên ảnh; bật khai báo AI của nền tảng.`,videoPrompt:'Dựng sau khi có tín hiệu và provider phù hợp.'});
  }
  const available=s.queue.filter(q=>!q.receipt&&q.phase!=='pilot');
  const firstKeys=['khach-den','noi-quen','dep-tan-ca','gach-lam-tam','khay-goc','xe-vat-lieu','may-vo','uu-dai-kenh'];
  const concepts=[...firstKeys.map(key=>painpointStories.find(c=>c.key===key)),...painpointStories.filter(c=>!firstKeys.includes(c.key))];
  for(const q of available){
    // Keep concept attribution stable across repeated preparations and daily runs.
    const i=Number(q.id.split('-').pop())-21;
    const c=concepts[i%concepts.length],number=topic[c.family];
    const cover=number===1||number===8?kitchen:s.creativeLibrary?.find(a=>a.topic===number);
    const family=s.angles.find(a=>a.id===`sakura-${c.family}`);
    const source=number===9?generic:product.assets.filter(a=>a.sourceSet===family?.sourceSet);
    if(!cover?.sha256||source.length!==5)throw Error(`Verified assets missing for ${c.family}`);
    const code=`${c.keyword}${q.id.split('-').pop()}`;
    Object.assign(q,{angleId:`sakura-pain-${c.key}`,variantId:`story-${Math.floor(i/painpointStories.length)+1}`,phase:'daily',title:`${c.hook} | Sakura`.slice(0,90),caption:`${i<painpointStories.length?c.hook:`Một góc nhìn khác: ${c.hook}`}\n\n${c.story}\n\nBạn đang cần vệ sinh góc nào? Nhắn “${code}” kèm ảnh bề mặt, tên vật liệu và loại vết bám để hỏi độ phù hợp, giá và cách dùng.\n\n🎁 Mua 1 tặng 1, chỉ áp dụng khi mua qua TikTok. Hỏi rõ giá và điều kiện trước khi đặt. 📍 Vựa Sầu Riêng Cô Ba, 322 Đ. Huỳnh Thị Hai. Mua trực tiếp tại TP.HCM, nhận đơn online toàn quốc.\n\nNhân vật và tình huống minh họa, không phải lời chứng thực. Chỉ dùng theo nhãn, kiểm tra vật liệu, thử vùng khuất khi được phép; không trộn chất tẩy rửa.\n\n#Sakura #NuocLauDaNang ${familyTags[c.family]} #HoChiMinh #Mua1Tang1 #UuDaiTikTok`,leadCode:code,storyType:'illustrative',creativeRevision:2,assets:[cover,source[1],source[2],offer,source[4]],assetsVerified:true,status:'ready',approved:true,publishAt:null,disclosures:{ownBrand:true,aiGenerated:true},location:'Vựa Sầu Riêng Cô Ba · 322 Đ.Huỳnh Thị Hai',music:{title:'Chốt Đơn Ngay',artist:'Minh Hoàng Band',source:'TikTok Studio recommendation',chartRankVerified:false}});
  }
  s.dailyPlans=[planDailySlots(s,today,now),planDailySlots(s,tomorrow,now)];
  let index=0;
  for(const plan of s.dailyPlans){
    plan.prepared=0;
    for(const publishAt of plan.slots)if(available[index]){available[index++].publishAt=publishAt;plan.prepared++;}
    plan.unprepared=plan.slots.length-plan.prepared;
  }
  return s;
});
const state=await loadState();
await writeFile(path.join(root,'state','daily-upload.json'),JSON.stringify(state.queue.filter(q=>q.phase==='daily'&&q.publishAt),null,2));
console.log(JSON.stringify({today:dailyKpi(state,today),tomorrow:dailyKpi(state,tomorrow),angles:painpointStories.length,plans:state.dailyPlans.map(p=>({day:p.day,slots:p.slots.length,shortfall:p.shortfall,prepared:p.prepared,unprepared:p.unprepared}))},null,2));
