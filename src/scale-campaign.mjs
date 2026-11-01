import {createHash} from 'node:crypto';
import {readFile} from 'node:fs/promises';
import {contactPromotionEligibility} from './contact-promotion.mjs';
import path from 'node:path';
import {hashFile,root} from './store.mjs';
import {voiceRuntime} from './voice.mjs';
import {loadReviewedVoice} from './reviewed-voice.mjs';
import {vietnamDay} from './daily-kpi.mjs';
import {painpointStories} from './content-bank.mjs';
import {rollingLimits,tenDayReference,videoRolloutReference,mixedRolloutReference} from './ten-day-cadence.mjs';

const HOUR=3600000,DAY=24*HOUR,MINUTE=60000;
export const scalePolicy=Object.freeze({version:1,campaignId:'sakura-scale-1000-20261029',account:'saigomlia',productId:'sakura-cleaner-500ml',earliestDay:'2026-10-29',total:1000,photo:500,video:500,dailyTotal:20,dailyPhoto:10,dailyVideo:10,minSpacingMinutes:20,windowStart:'08:00',windowEnd:'22:15',timezone:'Asia/Ho_Chi_Minh',location:'Vựa Sầu Riêng Cô Ba, 322 Đ. Huỳnh Thị Hai'});
export const scaleHash=value=>createHash('sha256').update(typeof value==='string'?value:JSON.stringify(value)).digest('hex');
const validTime=value=>typeof value==='string'&&/T.*(?:Z|[+-]\d\d:\d\d)$/.test(value)&&Number.isFinite(Date.parse(value));
const validDay=value=>/^\d{4}-\d{2}-\d{2}$/.test(value)&&Number.isFinite(Date.parse(`${value}T12:00:00+07:00`))&&vietnamDay(`${value}T12:00:00+07:00`)===value;
const localAt=(day,time)=>`${day}T${time}:00+07:00`;
const localIso=ms=>new Date(ms+7*HOUR).toISOString().slice(0,19)+'+07:00';
const nextDay=day=>new Date(Date.parse(localAt(day,'12:00'))+DAY+7*HOUR).toISOString().slice(0,10);
const fold=text=>String(text).normalize('NFD').replace(/\p{M}/gu,'').replaceAll('đ','d').replaceAll('Đ','D').toLowerCase().replace(/[^a-z\d]/g,'');
const accountKey=value=>String(value).replace(/^@/,'').toLowerCase();
const leadKey=value=>String(value).normalize('NFC').replace(/\s/g,'').toLocaleUpperCase('vi');
export const containsDiscount=text=>/mua\d+tang\d+|muamottang|muahaitang|50dondautien|nammuoidondautien|buy\d+get\d+|buyonegetone|giam\d+|giamgia|khuyenmai|tangqua|mienphigiaohang|freeship/.test(fold(text))||/\d+\s*%/.test(String(text));

export function collectScaleReservations(state,{account=scalePolicy.account}={}){
  const records=[],uncertain=(state.queue??[]).filter(q=>(!q.account||accountKey(q.account)===accountKey(account))&&['submitting','needs_review'].includes(q.status));
  if(uncertain.length)throw Error('Reconcile uncertain submissions before scale planning: '+uncertain.map(q=>q.id).join(', '));
  for(const p of state.posts??[]){
    if(p.account&&accountKey(p.account)!==accountKey(account))continue;
    if(!p.id||!validTime(p.publishedAt)||!['photo','video'].includes(p.format))throw Error('Reconcile incomplete canonical published observation');
    records.push({queueId:p.queueId??p.id,platformId:String(p.id),status:'published',format:p.format,at:p.publishedAt,rank:3});
  }
  for(const q of state.queue??[]){
    if(q.account&&accountKey(q.account)!==accountKey(account))continue;
    if(q.receipt?.platformId&&!['published','scheduled','under_review'].includes(q.status))throw Error('Reconcile receipt/state disagreement: '+q.id);
    if(!['published','scheduled','under_review'].includes(q.status))continue;
    const r=q.receipt,at=q.status==='published'?r?.publishedAt:q.status==='scheduled'?r?.scheduledAt:r?.submittedAt??r?.submittedVerifiedAt;
    const verified=q.status==='published'?r?.publishedVerifiedAt:q.status==='scheduled'?r?.scheduledVerifiedAt:r?.submittedVerifiedAt;
    const format=q.format??state.angles?.find(a=>a.id===q.angleId)?.format;
    if(!r?.platformId||!validTime(at)||!validTime(verified)||!['photo','video'].includes(format)){
      if(records.some(p=>p.queueId===q.id&&p.status==='published'))continue;
      throw Error('Reconcile incomplete accepted receipt/format: '+q.id);
    }
    records.push({queueId:q.id,platformId:String(r.platformId),status:q.status,format,at,rank:q.status==='published'?3:q.status==='scheduled'?2:1});
  }
  const unique=new Map();
  for(const r of records){const prior=unique.get(r.platformId);
    if(prior&&prior.rank===r.rank&&(prior.format!==r.format||Date.parse(prior.at)!==Date.parse(r.at)))throw Error('Conflicting accepted platform receipt: '+r.platformId);
    if(!prior||r.rank>prior.rank)unique.set(r.platformId,r);
  }
  return [...unique.values()].map(({rank,...r})=>({...r,day:vietnamDay(r.at)})).sort((a,b)=>Date.parse(a.at)-Date.parse(b.at)||a.platformId.localeCompare(b.platformId));
}

// Discounts are a publication-time decision, never a fact inferred from a promotion card.
export function promotionEligibility(ledger,publishAt,{now=new Date().toISOString()}={}){
  const fail=reason=>({showDiscount:false,mode:'evergreen_no_discount',reason,requiresPublicationRecheck:true});
  if(!validTime(now)||!validTime(publishAt))throw Error('Valid actual publication and check times required');
  if(!ledger||ledger.verified!==true||ledger.source!=='verified_order_ledger'||!ledger.ledgerId||!/^[a-f0-9]{64}$/.test(ledger.ledgerSha256??''))return fail('No explicit verified order-ledger evidence');
  if(ledger.promotionKey!=='buy1-get1-tiktok-first50'||ledger.productId!==scalePolicy.productId||ledger.maxOrders!==50||ledger.unit!=='orders'||ledger.channel!=='TikTok')return fail('Order proof does not cover this exact product/promotion');
  if(!Number.isInteger(ledger.remainingOrders)||ledger.remainingOrders<=0||!Number.isInteger(ledger.redeemedOrders)||ledger.redeemedOrders<0||ledger.remainingOrders+ledger.redeemedOrders!==50)return fail('Remaining order entitlement unknown, exhausted or inconsistent');
  const check=Date.parse(now),publish=Date.parse(publishAt),verified=Date.parse(ledger.verifiedAt);
  if(!validTime(ledger.verifiedAt)||verified>check||check-verified>15*MINUTE||vietnamDay(ledger.verifiedAt)!==vietnamDay(publishAt))return fail('Order ledger is stale or does not cover publication day');
  if(!validTime(ledger.validForPublishAt)||Date.parse(ledger.validForPublishAt)!==publish||!validTime(ledger.validUntil)||Date.parse(ledger.validUntil)<publish)return fail('Ledger verification does not explicitly cover actual publication time');
  if(publish>check||check-publish>5*MINUTE)return fail('Future scheduled/static discount requires a fresh publication-time check');
  return {showDiscount:true,mode:'verified_publication_time_offer',text:'Mua 1 tặng 1 cho 50 đơn đầu tiên từ TikTok',remainingOrders:ledger.remainingOrders,ledgerId:ledger.ledgerId,ledgerSha256:ledger.ledgerSha256,verifiedAt:ledger.verifiedAt,requiresPublicationRecheck:true};
}

// Earliest greedy gives maximum count; dynamic programming then spreads that count
// around evenly spaced targets without losing feasible capacity near existing times.
function spreadSlots(day,count,reservations,now){
  const start=Date.parse(localAt(day,'08:00')),end=Date.parse(localAt(day,'22:15')),spacing=20*MINUTE,candidates=[];
  for(let t=start;t<=end;t+=5*MINUTE)if(t>=now+30*MINUTE&&!reservations.some(r=>Math.abs(t-Date.parse(r.at))<spacing))candidates.push(t);
  let last=-Infinity,capacity=0;for(const t of candidates)if(t-last>=spacing){capacity++;last=t;}
  const n=Math.min(count,capacity);if(!n)return [];
  const previousIndex=candidates.map((t,i)=>{let j=i-1;while(j>=0&&t-candidates[j]<spacing)j--;return j;});
  const costs=[],parents=[];
  for(let k=0;k<n;k++){
    const row=new Float64Array(candidates.length).fill(Infinity),parent=new Int32Array(candidates.length).fill(-1),target=n===1?start:start+(end-start)*k/(n-1);
    let best=Infinity,bestAt=-1,cursor=0;
    for(let i=0;i<candidates.length;i++){
      if(k===0)row[i]=(candidates[i]-target)**2;
      else {while(cursor<=previousIndex[i]){if(costs[k-1][cursor]<best){best=costs[k-1][cursor];bestAt=cursor;}cursor++;}if(bestAt>=0){row[i]=best+(candidates[i]-target)**2;parent[i]=bestAt;}}
    }
    costs.push(row);parents.push(parent);
  }
  let index=0;for(let i=1;i<candidates.length;i++)if(costs[n-1][i]<costs[n-1][index])index=i;
  const chosen=[];for(let k=n-1;k>=0;k--){chosen.unshift(candidates[index]);index=parents[k][index];}return chosen.map(localIso);
}

const contexts=['Sau giờ làm','Trước khi đón khách','Cuối tuần','Một góc phòng trọ','Trước khi đặt online','Khi kiểm tra nhãn','Lúc sắp xếp đồ','Khi cùng chia việc','Trước khi chọn nước lau','Khi gửi shop câu hỏi'];
const questions=['Nhìn màu đã biết chất liệu chưa?','Bạn tìm được nhãn chăm sóc chưa?','Bạn đang hỏi vị trí nào?','Đã mô tả loại vết bám và nhu cầu chưa?'];
const stories=painpointStories.filter(s=>!containsDiscount(s.hook+' '+s.story));
function draftCreative(index,format,leadCode){
  const story=stories[index%stories.length],context=contexts[Math.floor(index/stories.length)%contexts.length],question=questions[Math.floor(index/(stories.length*contexts.length))%questions.length];
  const hook=index===0?'Tan ca rồi… lại tăng ca ở bếp?':`${context}: ${story.hook}`;
  const demo={kind:'product_identity',description:'Authentic Sakura500ml packshot/label closeup and material-question walkthrough; stock is illustrative context only.',efficacyDemoEvidence:null,efficacyDemoAvailable:false,stockIsProductDemo:false};
  const cta='Gọi số điện thoại trong bio để được tư vấn. Nói rõ vị trí, vật liệu và nhu cầu.';
  const slides=[{role:'hook',text:hook},{role:'friction',text:index===0?'Việc nhà đâu chỉ của một người.':`${context}. ${question}`},{role:'identity',text:'Nước lau đa năng Sakura · 500 ml. Đối chiếu nhãn thật.'},{role:'material-objection',text:'Đa năng không có nghĩa dùng ở mọi nơi. Xem hướng dẫn của vật liệu.'},{role:'offer-policy',text:'Hỏi thông tin sản phẩm, giá và điều kiện tại thời điểm đặt.'},{role:'cta',text:cta}];
  return {status:'creative_draft',hypothesisStatus:'untested',generativeLLMUsed:false,fineTunedModelUsed:false,sourceHypothesisId:'sakura-pain-'+story.key,
    matrixKey:index===0?'prototype:BẾP301':`${story.key}|${context}|${question}`,scenario:context,question,hook,demo,offerStage:'evergreen_no_discount',cta,
    slides:format==='photo'?slides:null,videoScript:format==='video'?`${hook}\nTìm hiểu nước lau đa năng Sa cu ra, năm trăm mi li lít. Xem đúng nhãn và vật liệu trước nha. Gọi số điện thoại trong phần giới thiệu để hỏi nhu cầu, giá và điều kiện mua hiện tại nha.`:null,
    caption:`${hook}\n\nTìm hiểu nước lau đa năng Sakura500ml. ${question} ${cta}\nHỏi giá và điều kiện trước khi đặt. Dùng theo nhãn.\n${scalePolicy.location}. TP.HCM · Online toàn quốc.\nCảnh minh họa, không phải demo Sakura hay lời chứng thực.\n#Sakura #NuocLauDaNang #GocNha #TPHCM`};
}
function intentPayload(item){return {id:item.id,campaignId:item.campaignId,account:item.account,productId:item.productId,format:item.format,leadCode:item.leadCode,proposedPublishAt:item.scheduleRevision?.originalPublishAt??item.proposedPublishAt,location:item.location,creative:item.creative,promotion:item.promotion};}
// Explicit revision of an existing artifact: never regenerate identities or copy.
export function normalizeScaleTimes(original,state,{now=new Date().toISOString()}={}){
  if(!validTime(now)||original.items?.length!==1000||original.items.filter(i=>i.format==='photo').length!==500||original.items.filter(i=>i.format==='video').length!==500)throw Error('Valid original1000-item plan required');
  if(original.items.some(i=>i.intentHash!==scaleHash(intentPayload(i)))||original.planHash!==scaleHash({policy:original.policy,sourceReservationsHash:original.sourceReservationsHash,intents:original.items.map(i=>i.intentHash)}))throw Error('Original plan checksum mismatch');
  const reservations=collectScaleReservations(state),byId=new Map(original.items.map(i=>[i.id,i]));
  if(byId.size!==1000||new Set(original.items.map(i=>leadKey(i.leadCode))).size!==1000)throw Error('Original plan has duplicate identities');
  const acceptedIds=new Set();
  for(const r of reservations){const i=byId.get(r.queueId);if(!i)continue;
    if(r.format!==i.format||Date.parse(r.at)!==Date.parse(i.proposedPublishAt))throw Error('Accepted intent differs from original plan: '+i.id);
    acceptedIds.add(i.id);
  }
  for(const q of state.queue??[]){const i=byId.get(q.id);if(!i)continue;
    if(q.phase!=='scale'||q.campaignId!==original.campaignId||accountKey(q.account)!==i.account||q.productId!==i.productId||q.format!==i.format||q.leadCode!==i.leadCode||q.location!==i.location||Date.parse(q.publishAt)!==Date.parse(i.proposedPublishAt)||q.intentHash&&q.intentHash!==i.intentHash)throw Error('Canonical original intent identity conflict: '+i.id);
    if(!acceptedIds.has(i.id))throw Error('Reconcile registered unaccepted intent before changing plan: '+i.id);
  }
  const plan=structuredClone(original),changed=[];
  for(const i of plan.items){
    if(acceptedIds.has(i.id))continue;
    if(i.status!=='planned'||i.receipt||i.boundCreative||i.readiness?.ready)throw Error('Only unsubmitted draft times may be normalized');
    const at=localIso(Math.round(Date.parse(i.proposedPublishAt)/(5*MINUTE))*5*MINUTE);
    if(vietnamDay(at)!==vietnamDay(i.proposedPublishAt)||at.slice(11,16)<'08:00'||at.slice(11,16)>'22:15')throw Error('Rounded time is outside original day/window');
    if(Date.parse(at)<Date.parse(now)+30*MINUTE)throw Error('Unsubmitted intent time has expired');
    if(at!==i.proposedPublishAt){i.proposedPublishAt=at;i.intentHash=scaleHash(intentPayload(i));changed.push(i.id);}
  }
  const external=reservations.filter(r=>!byId.has(r.queueId)),days=[];
  for(const d of original.days){const items=plan.items.filter(i=>vietnamDay(i.proposedPublishAt)===d.day),old=external.filter(r=>r.day===d.day),all=[...old.map(r=>({format:r.format,at:r.at,old:true})),...items.map(i=>({format:i.format,at:i.proposedPublishAt,old:acceptedIds.has(i.id)}))].sort((a,b)=>Date.parse(a.at)-Date.parse(b.at));
    if(items.some(i=>!acceptedIds.has(i.id)&&Number(i.proposedPublishAt.slice(14,16))%5!==0))throw Error('Unsupported native minute');
    if(all.length>20||['photo','video'].some(f=>all.filter(r=>r.format===f).length>10))throw Error('Normalized daily quota conflict');
    for(let k=1;k<all.length;k++)if(Date.parse(all[k].at)-Date.parse(all[k-1].at)<20*MINUTE&&!(all[k].old&&all[k-1].old))throw Error('Normalized spacing conflict');
    days.push({...d,reservations:old,newPhoto:items.filter(i=>i.format==='photo').length,newVideo:items.filter(i=>i.format==='video').length,newTotal:items.length,totalIncludingReservations:all.length});
  }
  plan.days=days;plan.sourceReservationsHash=scaleHash(reservations.filter(r=>r.day>=original.startDay));
  plan.planHash=scaleHash({policy:plan.policy,sourceReservationsHash:plan.sourceReservationsHash,intents:plan.items.map(i=>i.intentHash)});
  plan.previousPlanHash=original.planHash;plan.createdAt=now;
  plan.timeNormalization={nativeMinuteStep:5,changedIntentIds:changed,preservedAcceptedIds:[...acceptedIds],sourcePlanHash:original.planHash,verifiedAgainstCurrentReservations:true};
  return plan;
}
export function buildScaleCampaign(state,{now=new Date().toISOString(),startDay=scalePolicy.earliestDay}={}){
  if(!validTime(now)||!validDay(startDay))throw Error('Valid startDay and now required');
  const account=typeof state.account==='object'?state.account?.handle:state.account;if(account&&accountKey(account)!==scalePolicy.account)throw Error('Configured account does not match scale authorization');
  const reservations=collectScaleReservations(state),ids=new Set([...(state.queue??[]).map(q=>q.id),...(state.posts??[]).map(p=>p.queueId).filter(Boolean)]),codes=new Set([...(state.queue??[]),...(state.posts??[])].map(q=>q.leadCode).filter(Boolean).map(leadKey));
  const firstDay=[startDay,scalePolicy.earliestDay,vietnamDay(now)].sort().at(-1),relevant=reservations.filter(r=>r.day>=firstDay),days=[],items=[];
  let day=firstDay,leftPhoto=500,leftVideo=500;
  for(let guard=0;(leftPhoto||leftVideo)&&guard<1000;guard++,day=nextDay(day)){
    const old=relevant.filter(r=>r.day===day),oldPhoto=old.filter(r=>r.format==='photo').length,oldVideo=old.length-oldPhoto;
    let photo=Math.min(leftPhoto,Math.max(0,10-oldPhoto)),video=Math.min(leftVideo,Math.max(0,10-oldVideo)),limit=Math.max(0,20-old.length);
    while(photo+video>limit){if(video>=photo&&video)video--;else photo--;}
    const slots=spreadSlots(day,photo+video,old,Date.parse(now));while(photo+video>slots.length){if(video>=photo&&video)video--;else photo--;}
    let usedPhoto=0,usedVideo=0;
    for(const at of slots.slice(0,photo+video)){
      const format=usedPhoto<photo&&(usedVideo>=video||usedPhoto/photo<=usedVideo/(video||1))?'photo':'video';if(format==='photo')usedPhoto++;else usedVideo++;
      const number=10001+items.length,id=`sakura-scale-${number}`,leadCode=items.length===0?'BẾP301':`${format==='photo'?'ẢNH':'GIỌNG'}${number}`;
      if(ids.has(id)||codes.has(leadKey(leadCode)))throw Error('Scale identity/lead-code collision: '+id+' / '+leadCode);
      const promotion=promotionEligibility(state.campaign?.orderLedger,at,{now}),creative=draftCreative(items.length,format,leadCode);
      const item={id,campaignId:scalePolicy.campaignId,account:scalePolicy.account,productId:scalePolicy.productId,format,leadCode,proposedPublishAt:at,location:scalePolicy.location,status:'planned',creative,promotion,
        requirements:{assetCount:format==='photo'?6:1,voiceRequired:format==='video',musicRequired:true,actualNativeScheduleWindowRequired:true},
        readiness:{ready:false,blockers:['assets_missing','visual_review_missing','music_selection_missing','offer_content_review_missing','native_schedule_window_unverified',...(format==='video'?['exact_voice_and_listening_missing','captions_and_playback_missing']:[])]},receipt:null};
      item.intentHash=scaleHash(intentPayload(item));items.push(item);ids.add(id);codes.add(leadKey(leadCode));
    }
    leftPhoto-=usedPhoto;leftVideo-=usedVideo;
    days.push({day,reservations:old,newPhoto:usedPhoto,newVideo:usedVideo,newTotal:usedPhoto+usedVideo,totalIncludingReservations:old.length+usedPhoto+usedVideo,existingQuotaViolation:oldPhoto>10||oldVideo>10||old.length>20});
  }
  if(items.length!==1000||leftPhoto||leftVideo)throw Error('Cannot fit1000new intents within bounded1000-day planning horizon');
  const sourceReservationsHash=scaleHash(relevant),planHash=scaleHash({policy:scalePolicy,sourceReservationsHash,intents:items.map(i=>i.intentHash)});
  return {schemaVersion:1,createdAt:now,campaignId:scalePolicy.campaignId,planHash,policy:scalePolicy,sourceReservationsHash,startDay:firstDay,endDay:days.at(-1).day,
    counts:{photo:500,video:500,planned:1000,ready:0,scheduled:0,published:0},days,items,
    status:'planned_creative_drafts',actualPlatformWindowVerified:false,canonicalQueueModified:false,creativePerformanceProven:false,uniqueRenderedAssets:0,
    limitations:['Dates are experimental intent, not TikTok reservations.','Template scenario/question combinations are not1000independently researched or produced creatives.','No authentic Sakura cleaning-efficacy demo exists; only identity/label/material-question walkthroughs are supported.','No ledger proof means evergreen, with no printed/spoken discount.','Existing voice/MCP queue-ID validators need a reviewed scale-ID integration before bulk production.']};
}

function nativeMusicIdentity(music){return {title:music.title,artist:music.artist,duration:music.duration,language:music.language,identitySource:music.identitySource,catalogEvidenceSha256:music.catalogEvidence?.sha256,selectionEvidenceSha256:music.selectionEvidence?.sha256};}
export function scalePostHash(item,evidence){return scaleHash({intentId:item.id,intentHash:item.intentHash,...(item.scheduleRevision?{scheduleRevisionHash:scaleHash(item.scheduleRevision)}:{}),account:evidence.account,format:item.format,publishAt:item.proposedPublishAt,location:evidence.location,caption:evidence.caption,
  assets:(evidence.assets??[]).map(a=>({order:a.order,sha256:a.sha256})),...(evidence.photoStory?{photoStory:evidence.photoStory,photoTitle:evidence.photoTitle}:{}),voiceSha256:evidence.voice?.sha256??null,spokenScript:evidence.spokenScript??item.creative.videoScript,musicSoundId:evidence.music?.soundId??null,...(evidence.music?.soundId===null?{musicNativeIdentity:nativeMusicIdentity(evidence.music)}:{}),demoKind:evidence.demoKind});}
async function verifyBytes(asset,label,blockers){if(!asset||!path.isAbsolute(asset.path??'')||!/^[a-f0-9]{64}$/.test(asset.sha256??'')){blockers.push(label+'_path_or_hash_missing');return;}
  try{if(await hashFile(asset.path)!==asset.sha256)blockers.push(label+'_hash_mismatch');}catch{blockers.push(label+'_file_unavailable');}}
const reviewTime=(value,now)=>validTime(value)&&Date.parse(value)<=Date.parse(now);
export async function bindScaleCreative(item,evidence,{state={},now=new Date().toISOString()}={}){
  if(!validTime(now)||item.intentHash!==scaleHash(intentPayload(item)))throw Error('Intent checksum/time mismatch');
  if(item.receipt||!['planned','ready'].includes(item.status))throw Error('Cannot bind an accepted/submitted intent');
  const blockers=[],postHash=scalePostHash(item,evidence),assets=evidence.assets??[];
  if(Number(item.proposedPublishAt.slice(14,16))%5!==0||Number(item.proposedPublishAt.slice(17,19))!==0)blockers.push('unsupported_native_five_minute_slot');
  if(Date.parse(item.proposedPublishAt)<Date.parse(now)+30*MINUTE)blockers.push('proposed_time_expired_or_too_near');
  if(evidence.account!==item.account)blockers.push('account_mismatch');if(evidence.location!==item.location)blockers.push('location_mismatch');
  for(const tag of state.campaign?.requiredHashtags??[]){if(typeof tag!=='string'||!/^#[\p{L}\p{N}_]+$/u.test(tag)||!String(evidence.caption??'').split(/\s+/u).includes(tag))blockers.push('required_campaign_hashtag_missing');}
  const privateCodes=state.campaign?.publicPostCodes===false||evidence.publicPostCodes===false;
  if(privateCodes){
    if(typeof evidence.caption!=='string'||!evidence.caption.trim())blockers.push('caption_missing');
    const publicText=[evidence.caption,evidence.spokenScript,evidence.photoTitle].filter(x=>typeof x==='string').join(' ').normalize('NFD').replace(/\p{M}/gu,'').toUpperCase();
    if(/\b(?:ANH|GIONG|BEP)\s*\d{3,}\b|SAKURA[-_](?:SCALE[-_])?\d+/u.test(publicText)||publicText.includes(item.id.toUpperCase()))blockers.push('public_internal_identifier');
  }else if(typeof evidence.caption!=='string'||!evidence.caption.includes(item.leadCode))blockers.push('caption_or_lead_code_missing');
  const story=evidence.photoStory,fivePhoto=story?.adapter==='native-five-photo-v1'&&story.sourceIntentHash===item.intentHash&&story.assetCount===5&&story.voiceOverAttached===false&&item.format==='photo'&&[tenDayReference,mixedRolloutReference].includes(item.scheduleRevision?.policyReference)&&state.campaign?.rollingGoal?.policyReference===item.scheduleRevision.policyReference;
  if(story&&!fivePhoto)blockers.push('unapproved_photo_story_adaptation');
  if(fivePhoto&&(typeof evidence.photoTitle!=='string'||!evidence.photoTitle.trim()||[...evidence.photoTitle].length>90))blockers.push('native_photo_title_missing_or_too_long');
  if(fivePhoto&&(evidence.voice||evidence.spokenScript!==''))blockers.push('native_photo_narration_must_remain_separate');
  if(assets.length!==(fivePhoto?5:item.requirements.assetCount)||assets.some((a,i)=>a.order!==i+1)||new Set(assets.map(a=>a.sha256)).size!==assets.length)blockers.push('asset_count_order_or_uniqueness_mismatch');
  for(const [i,asset] of assets.entries())await verifyBytes(asset,'asset_'+(i+1),blockers);
  if(evidence.authenticProductReferenceVerified!==true)blockers.push('authentic_product_reference_review_missing');
  if(evidence.demoKind!=='product_identity')blockers.push('missing_authentic_efficacy_demo_evidence');
  const visual=evidence.visualReview;if(visual?.verified!==true||visual.postHash!==postHash||!reviewTime(visual.verifiedAt,now))blockers.push('bound_visual_review_missing');
  const offerReview=evidence.offerReview;
  if(offerReview?.verified!==true||offerReview.postHash!==postHash||!reviewTime(offerReview.verifiedAt,now)||typeof offerReview.containsDiscount!=='boolean')blockers.push('bound_offer_content_review_missing');
  const spoken=evidence.spokenScript??item.creative.videoScript??'';
  if(offerReview?.containsDiscount||containsDiscount((evidence.caption??'')+' '+spoken+' '+(evidence.photoTitle??''))){
    let contactEligible=false;
    const currentVideo=item.format==='video'&&[videoRolloutReference,mixedRolloutReference].includes(item.scheduleRevision?.policyReference)&&state.campaign?.rollingGoal?.policyReference===item.scheduleRevision.policyReference;
    if((fivePhoto||currentVideo)&&evidence.contactOfferLedger){
      const ledger=evidence.contactOfferLedger,current=state.campaign?.currentPromotionBrief;
      await verifyBytes(ledger,'contact_offer_ledger',blockers);
      if(ledger.path!==current?.file||ledger.sha256!==current?.sha256)blockers.push('current_contact_offer_ledger_mismatch');
      else try{if(await hashFile(ledger.path)===ledger.sha256){const eligibility=contactPromotionEligibility(JSON.parse(await readFile(ledger.path,'utf8')),item.proposedPublishAt,{now});contactEligible=eligibility.showDiscount;if(eligibility.mode==='conditional-scheduled-offer'&&(!String(evidence.caption??'').includes('Gọi để kiểm tra ưu đãi còn áp dụng không và điều kiện nhận quà.')||offerReview?.containsRemainingCountClaim!==false||offerReview?.conditionalOfferDisclosureVerified!==true)){contactEligible=false;blockers.push('conditional_offer_disclosure_missing');}}}catch{blockers.push('contact_offer_ledger_unreadable');}
    }
    if(!contactEligible&&(!item.promotion.showDiscount||!promotionEligibility(evidence.orderLedger,item.proposedPublishAt,{now}).showDiscount))blockers.push('discount_not_verified_for_actual_publication_time');
  }
  const music=evidence.music;
  const noId=music?.soundId===null;
  if(noId){
    if(![music.title,music.artist].every(value=>typeof value==='string'&&value.trim()===value&&value.length>0)||!/^\d{2}:[0-5]\d$/.test(music.duration??'')||music.duration==='00:00'||!['Vietnamese','non_vocal'].includes(music.language)||music.identitySource!=='https://www.tiktok.com/tiktokstudio/sound-library')blockers.push('exact_native_music_identity_missing');
    await verifyBytes(music.catalogEvidence,'native_music_catalog_evidence',blockers);
    await verifyBytes(music.selectionEvidence,'native_music_selection_evidence',blockers);
    if(music.catalogEvidence?.path===music.selectionEvidence?.path||music.catalogEvidence?.sha256===music.selectionEvidence?.sha256)blockers.push('distinct_native_music_proofs_required');
  }
  if(!noId&&!/^\d+$/.test(music?.soundId??'')||music?.businessUseVerified!==true||music?.availableInAccount!==true||music?.selectedInUi!==true||!reviewTime(music?.verifiedAt,now)||Date.parse(now)-Date.parse(music.verifiedAt)>24*HOUR)blockers.push('fresh_native_music_selection_missing');
  if([...(state.queue??[]),...(state.posts??[])].some(q=>(q.queueId??q.id)!==item.id&&q.leadCode&&leadKey(q.leadCode)===leadKey(item.leadCode)))blockers.push('lead_code_collision');
  const window=evidence.scheduleWindow;
  if(window?.verified!==true||window.account!==item.account||!reviewTime(window.verifiedAt,now)||Date.parse(now)-Date.parse(window.verifiedAt)>24*HOUR||!validTime(window.earliest)||!validTime(window.latest)||Date.parse(item.proposedPublishAt)<Date.parse(window.earliest)||Date.parse(item.proposedPublishAt)>Date.parse(window.latest))blockers.push('actual_native_schedule_window_missing');
  try{const existing=collectScaleReservations(state).filter(r=>r.day===vietnamDay(item.proposedPublishAt));
    if(existing.some(r=>r.queueId===item.id))blockers.push('already_accepted_intent');
    if(item.scheduleRevision?.policyKind==='scale-rolling-policy'){const {cap,spacingMinutes}=rollingLimits(state,item.proposedPublishAt);if(state.campaign?.rollingGoal?.policyReference===mixedRolloutReference&&existing.filter(r=>r.format===item.format).length>=(item.format==='photo'?30:20))blockers.push('current_format_quota_conflict');if(existing.length>=cap||existing.some(r=>Math.abs(Date.parse(r.at)-Date.parse(item.proposedPublishAt))<spacingMinutes*MINUTE))blockers.push('current_quota_or_spacing_conflict');}
    else if(item.scheduleRevision){if(existing.length>=40||existing.some(r=>Math.abs(Date.parse(r.at)-Date.parse(item.proposedPublishAt))<5*MINUTE))blockers.push('current_quota_or_spacing_conflict');}
    else if(existing.length>=20||existing.filter(r=>r.format===item.format).length>=10||existing.some(r=>Math.abs(Date.parse(r.at)-Date.parse(item.proposedPublishAt))<20*MINUTE))blockers.push('current_quota_or_spacing_conflict');
  }catch(error){blockers.push('reconciliation_required: '+error.message);}
  if(item.requirements.voiceRequired){
    const voice=evidence.voice;await verifyBytes(voice,'voice',blockers);
    let exactReviewedProfile=false;
    if(voice?.reviewedVoiceProof){
      try{
        const proof=voice.reviewedVoiceProof;
        if(!path.isAbsolute(proof.sourceReceiptFile??'')||!path.isAbsolute(proof.approvalFile??''))throw Error('Absolute reviewed voice proof required');
        const reviewed=await loadReviewedVoice({receiptFile:proof.sourceReceiptFile,approvalFile:proof.approvalFile,script:spoken,item,runtime:await voiceRuntime(),helperFile:path.join(root,'scripts','voice-vieneu.py'),now});
        exactReviewedProfile=reviewed.voice.sha256===voice.sha256&&reviewed.profile.voice===voice.voice&&reviewed.profile.speed===voice.speed&&reviewed.profile.temperature===voice.temperature&&reviewed.profile.referenceStyle===voice.referenceStyle&&reviewed.proof.approvalSha256===proof.approvalSha256&&reviewed.proof.sourceReceiptSha256===proof.sourceReceiptSha256;
        if(!exactReviewedProfile)blockers.push('reviewed_voice_provenance_mismatch');
      }catch{blockers.push('reviewed_voice_provenance_mismatch');}
    }
    if(voice?.voice!=='Thùy Dung'||voice?.speed!==1.2||voice?.referenceStyle!=='speaker-only'&&!exactReviewedProfile||voice?.scriptSha256!==scaleHash(spoken))blockers.push('voice_profile_or_script_mismatch');
    if(voice?.listeningReview?.verified!==true||voice.listeningReview.queueId!==item.id||voice.listeningReview.audioSha256!==voice.sha256||!reviewTime(voice.listeningReview.verifiedAt,now))blockers.push('exact_noninherited_voice_listening_missing');
    await verifyBytes(evidence.subtitles,'subtitles',blockers);if(evidence.subtitles?.audioSha256!==voice?.sha256||evidence.subtitles?.scriptSha256!==scaleHash(spoken))blockers.push('subtitle_audio_or_script_binding_missing');
    if(evidence.playbackReview?.verified!==true||evidence.playbackReview.postHash!==postHash||!reviewTime(evidence.playbackReview.verifiedAt,now)||music?.mixBelowNarrationVerified!==true)blockers.push('final_playback_or_music_mix_review_missing');
  }
  return {...item,status:blockers.length?'planned':'ready',postHash,boundCreative:evidence,readiness:{ready:!blockers.length,blockers},receipt:null};
}

export function validateScaleReceipt(item,receipt,state,{now=new Date().toISOString()}={}){
  if(item.status!=='ready'||item.readiness?.ready!==true||!item.boundCreative||item.intentHash!==scaleHash(intentPayload(item))||scalePostHash(item,item.boundCreative)!==item.postHash)throw Error('A ready hash-bound intent is required');
  if(typeof receipt?.platformId!=='string'||!/^\d{10,25}$/.test(receipt.platformId)||receipt.account!==item.account||receipt.postHash!==item.postHash||!reviewTime(receipt.verifiedAt,now)||!receipt.evidence)throw Error('Verified actual platform receipt required');
  if((state.queue??[]).some(q=>String(q.receipt?.platformId)===receipt.platformId)||(state.posts??[]).some(p=>String(p.id)===receipt.platformId))throw Error('Duplicate platform ID; reconcile instead of retrying');
  if(!['scheduled','under_review','published'].includes(receipt.status))throw Error('Unsupported receipt status');
  const at=receipt.status==='scheduled'?receipt.scheduledAt:receipt.status==='published'?receipt.publishedAt:receipt.submittedAt;
  if(!validTime(at)||(receipt.status==='scheduled'?Date.parse(at)!==Date.parse(item.proposedPublishAt):vietnamDay(at)!==vietnamDay(item.proposedPublishAt)))throw Error('Receipt time differs from the authorized intent');
  if(receipt.status!=='scheduled'&&Date.parse(at)>Date.parse(receipt.verifiedAt))throw Error('Publication/submission cannot be in the future relative to verification');
  return {...item,status:receipt.status,receipt:{...receipt}};
}
export function scaleCsv(plan){const quote=value=>{let text=String(value??'');if(/^[=+@-]/.test(text))text="'"+text;return '"'+text.replaceAll('"','""')+'"';};
  const rows=[['id','format','proposedPublishAt','status','leadCode','scenario','question','hook','demoKind','offerMode','blockers'],...plan.items.map(i=>[i.id,i.format,i.proposedPublishAt,i.status,i.leadCode,i.creative.scenario,i.creative.question,i.creative.hook,i.creative.demo.kind,i.promotion.mode,i.readiness.blockers.join('|')])];
  return rows.map(r=>r.map(quote).join(',')).join('\n')+'\n';}
