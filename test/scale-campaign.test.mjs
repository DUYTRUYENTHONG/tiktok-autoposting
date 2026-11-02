import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,readFile,writeFile,rm} from 'node:fs/promises';
import {spawnSync} from 'node:child_process';
import path from 'node:path';
import {tmpdir} from 'node:os';
import {buildScaleCampaign,normalizeScaleTimes,collectScaleReservations,promotionEligibility,bindScaleCreative,scalePostHash,validateScaleReceipt,scaleCsv,scaleHash,containsDiscount} from '../src/scale-campaign.mjs';
import {hashFile,root} from '../src/store.mjs';

const now='2026-10-28T08:00:00Z';
test('unverified alternate discount promises cannot bypass the evergreen gate',()=>{
  for(const text of ['Mua 2 tặng 1','Mua một tặng hai','Giảm giá cho bạn','Khuyến mãi hôm nay','Tặng quà khi đặt','Miễn phí giao hàng','Freeship','Giảm 20%'])assert.equal(containsDiscount(text),true,text);
  assert.equal(containsDiscount('Hỏi giá và điều kiện trước khi đặt. Nhắn BẾP301 kèm vật liệu và nhu cầu.'),false);
});
const state=()=>({account:'saigomlia',campaign:{},queue:[],posts:[],angles:[]});
const reserved=(id,format,at,status='scheduled')=>({id:'old-'+id,account:'saigomlia',format,status,receipt:{platformId:String(id),...(status==='scheduled'?{scheduledAt:at,scheduledVerifiedAt:now}:status==='published'?{publishedAt:at,publishedVerifiedAt:now}:{submittedVerifiedAt:at})}});
const day=at=>at.slice(0,10);
function assertSpacing(plan){for(const d of plan.days){const all=[...d.reservations.map(r=>Date.parse(r.at)),...plan.items.filter(i=>day(i.proposedPublishAt)===d.day).map(i=>Date.parse(i.proposedPublishAt))].sort((a,b)=>a-b);for(let i=1;i<all.length;i++)assert.ok(all[i]-all[i-1]>=20*60000);}}
test('private-code policy accepts a call CTA without exposing identifiers and rejects public leaks',async()=>{
  const folder=await mkdtemp(path.join(tmpdir(),'scale-private-codes-'));
  try{
    const s=state();s.campaign.publicPostCodes=false;
    const item=buildScaleCampaign(s,{now}).items[0],e=await evidenceFor(item,folder);
    e.publicPostCodes=false;e.caption='Gọi số điện thoại trong bio để được tư vấn. Nói rõ vật liệu và nhu cầu.';
    const bind=async evidence=>{const h=scalePostHash(item,evidence);return bindScaleCreative(item,{...evidence,visualReview:{...e.visualReview,postHash:h},offerReview:{...e.offerReview,postHash:h}},{state:s,now});};
    assert.equal((await bind(e)).readiness.ready,true);
    for(const change of [{caption:e.caption+' Nhắc mã '+item.leadCode},{caption:e.caption+' '+item.id},{spokenScript:'Nhắc mã '+item.leadCode}])assert.ok((await bind({...e,...change})).readiness.blockers.includes('public_internal_identifier'));
    assert.ok((await bind({...e,caption:' '})).readiness.blockers.includes('caption_missing'));
    assert.equal(item.leadCode,'BẾP301');
  }finally{await rm(folder,{recursive:true,force:true});}
});

test('exactly1000 additional planned intents are500/500 across50empty days, with stable firstBẾP301',()=>{
  const s=state(),before=JSON.stringify(s),plan=buildScaleCampaign(s,{now});
  assert.equal(plan.items.length,1000);assert.deepEqual(plan.counts,{photo:500,video:500,planned:1000,ready:0,scheduled:0,published:0});assert.equal(plan.days.length,50);
  assert.equal(plan.items[0].id,'sakura-scale-10001');assert.equal(plan.items[0].leadCode,'BẾP301');assert.equal(plan.items[0].proposedPublishAt,'2026-10-29T08:00:00+07:00');
  assert.ok(plan.items.every(i=>i.status==='planned'&&i.creative.status==='creative_draft'&&!i.readiness.ready&&!i.promotion.showDiscount));
  assert.equal(new Set(plan.items.map(i=>i.id)).size,1000);assert.equal(new Set(plan.items.map(i=>i.leadCode)).size,1000);
  assert.ok(new Set(plan.items.map(i=>i.creative.matrixKey)).size>=1000);assert.equal(JSON.stringify(s),before);assertSpacing(plan);
  assert.equal(buildScaleCampaign(s,{now}).planHash,plan.planHash);
  assert.ok(plan.items.every(i=>Number(i.proposedPublishAt.slice(14,16))%5===0));
});
const rehashItem=i=>{i.intentHash=scaleHash(Object.fromEntries(['id','campaignId','account','productId','format','leadCode','proposedPublishAt','location','creative','promotion'].map(k=>[k,i[k]])));};
const rehashPlan=p=>{p.planHash=scaleHash({policy:p.policy,sourceReservationsHash:p.sourceReservationsHash,intents:p.items.map(i=>i.intentHash)});};
test('explicit five-minute revision preserves IDs/copy and accepted/unchanged hashes, rejects source tamper and new conflicts',()=>{
  const original=buildScaleCampaign(state(),{now});original.items[2].proposedPublishAt=original.items[2].proposedPublishAt.replace(':30:00',':31:00');
  // Ensure the legacy fixture contains an unsupported minute, irrespective of spread target.
  const legacy=original.items[2];legacy.proposedPublishAt=legacy.proposedPublishAt.slice(0,14)+String(Number(legacy.proposedPublishAt.slice(14,16))+1).padStart(2,'0')+legacy.proposedPublishAt.slice(16);rehashItem(legacy);rehashPlan(original);
  const first=original.items[0],q={...reserved(12345678901,'photo',first.proposedPublishAt),...first,phase:'scale',publishAt:first.proposedPublishAt,status:'scheduled',receipt:{platformId:'12345678901',scheduledAt:first.proposedPublishAt,scheduledVerifiedAt:now}};
  const s={...state(),queue:[q]},before=JSON.stringify(original),revised=normalizeScaleTimes(original,s,{now});
  assert.equal(JSON.stringify(original),before);assert.notEqual(revised.planHash,original.planHash);assert.equal(revised.previousPlanHash,original.planHash);assert.deepEqual(revised.items[0],original.items[0]);assert.equal(revised.items[1].intentHash,original.items[1].intentHash);
  assert.ok(revised.items.every(i=>Number(i.proposedPublishAt.slice(14,16))%5===0));assert.deepEqual(revised.items.map(i=>[i.id,i.format,i.leadCode,i.creative]),original.items.map(i=>[i.id,i.format,i.leadCode,i.creative]));assertSpacing({...revised,days:revised.days});
  assert.equal(normalizeScaleTimes(original,s,{now}).planHash,revised.planHash);
  const tamper=structuredClone(original);tamper.items[9].creative.hook='changed';assert.throws(()=>normalizeScaleTimes(tamper,s,{now}),/checksum/);
  assert.throws(()=>normalizeScaleTimes(original,{...s,queue:[{...q,publishAt:'2026-10-29T08:05:00+07:00'}]},{now}),/identity/);
  const conflict=reserved(12345678902,'video',revised.items[2].proposedPublishAt);assert.throws(()=>normalizeScaleTimes(original,{...s,queue:[q,conflict]},{now}),/quota|spacing/);
});
test('six preserved photo reservations consume formatcapacity and extend the new1000 to51days',()=>{
  const s=state();for(let d=29;d<=31;d++)for(const hour of [12,19])s.queue.push(reserved(d*100+hour,'photo',`2026-10-${d}T${hour}:00:00+07:00`));
  const before=JSON.stringify(s),plan=buildScaleCampaign(s,{now});assert.equal(plan.days.length,51);
  assert.equal(plan.days[0].newPhoto,8);assert.equal(plan.days[0].newVideo,10);assert.equal(plan.days[0].totalIncludingReservations,20);
  assert.equal(plan.items[0].proposedPublishAt,'2026-10-29T08:00:00+07:00');assert.equal(JSON.stringify(s),before);assertSpacing(plan);
});
test('published, scheduled and moderationpending actual times reserve capacity, deduplicated by platformID',()=>{
  const s=state();s.queue=[reserved(1,'photo','2026-10-29T08:01:00+07:00','under_review'),reserved(2,'video','2026-10-29T12:13:00+07:00'),reserved(3,'photo','2026-10-29T19:05:00+07:00','published')];
  s.posts=[{id:'3',queueId:'old-3',format:'photo',publishedAt:'2026-10-29T19:05:00+07:00'}];
  assert.equal(collectScaleReservations(s).length,3);const plan=buildScaleCampaign(s,{now});assert.equal(plan.days[0].reservations.length,3);assertSpacing(plan);
});
test('uncertain outcomes, conflicting receipts and identity/code collisions fail before producing duplicate intents',()=>{
  assert.throws(()=>buildScaleCampaign({...state(),queue:[{id:'uncertain',status:'submitting'}]},{now}),/Reconcile/);
  assert.throws(()=>buildScaleCampaign({...state(),queue:[{id:'sakura-scale-10001'}]},{now}),/collision/);
  assert.throws(()=>buildScaleCampaign({...state(),queue:[{id:'other',leadCode:'BẾP301'}]},{now}),/collision/);
  assert.throws(()=>buildScaleCampaign({...state(),queue:[{id:'other',leadCode:'bếp 301'.normalize('NFD')}]},{now}),/collision/);
  assert.throws(()=>buildScaleCampaign({...state(),posts:[{id:'9',queueId:'sakura-scale-10001',format:'photo',publishedAt:now}]},{now}),/collision/);
  assert.throws(()=>buildScaleCampaign({...state(),account:'other'},{now}),/account/);
  assert.throws(()=>buildScaleCampaign(state(),{now,startDay:'2027-02-30'}),/Valid/);
  const s=state();s.queue=[reserved(1,'photo','2026-10-29T08:00:00+07:00'),reserved(1,'video','2026-10-29T09:00:00+07:00')];assert.throws(()=>collectScaleReservations(s),/Conflicting/);
});
test('handle notation aliases reserve the same account capacity',()=>{
  const q=reserved(1,'photo','2026-10-29T12:00:00+07:00');q.account='@Saigomlia';assert.equal(collectScaleReservations({...state(),queue:[q]}).length,1);
});
const ledger=()=>({verified:true,source:'verified_order_ledger',ledgerId:'test-ledger',ledgerSha256:'a'.repeat(64),verifiedAt:now,validForPublishAt:now,validUntil:'2026-10-28T08:15:00Z',promotionKey:'buy1-get1-tiktok-first50',productId:'sakura-cleaner-500ml',maxOrders:50,redeemedOrders:40,remainingOrders:10,unit:'orders',channel:'TikTok'});
test('discounts require fresh explicit order proof for actualpublicationtime; unknown/stale/future/exhausted fail closed',()=>{
  assert.equal(promotionEligibility(ledger(),now,{now}).showDiscount,true);
  for(const evidence of [null,{...ledger(),remainingOrders:null},{...ledger(),verified:false},{...ledger(),ledgerSha256:'bad'},{...ledger(),verifiedAt:'2026-10-27T08:00:00Z'},{...ledger(),remainingOrders:0,redeemedOrders:50},{...ledger(),remainingOrders:11}])assert.equal(promotionEligibility(evidence,now,{now}).showDiscount,false);
  assert.equal(promotionEligibility(ledger(),'2026-10-29T08:00:00+07:00',{now}).showDiscount,false);
  assert.equal(promotionEligibility({...ledger(),validForPublishAt:'2026-10-28T09:00:00Z'},'2026-10-28T09:00:00Z',{now}).showDiscount,false);
});
test('CSV is an inspectable1000row plan and never marks draft rows ready/scheduled',()=>{
  const csv=scaleCsv(buildScaleCampaign(state(),{now}));assert.equal(csv.trim().split('\n').length,1001);assert.match(csv,/BẾP301/);assert.doesNotMatch(csv,/,ready,|,scheduled,/);
});
async function evidenceFor(item,folder){
  const assets=[];for(let i=0;i<6;i++){const file=path.join(folder,`slide-${i}.png`);await writeFile(file,`test-only-scene-${i}`);assets.push({path:file,sha256:await hashFile(file),order:i+1});}
  const evidence={account:'saigomlia',location:item.location,caption:'Tan ca rồi… lại tăng ca ở bếp? Nhắn BẾP301 kèm ảnh bề mặt, vật liệu và nhu cầu. Hỏi thông tin trước khi đặt.',assets,demoKind:'product_identity',authenticProductReferenceVerified:true,
    music:{soundId:'7605166944787761169',businessUseVerified:true,availableInAccount:true,selectedInUi:true,verifiedAt:now},
    scheduleWindow:{verified:true,account:'saigomlia',verifiedAt:now,earliest:'2026-10-29T00:00:00+07:00',latest:'2026-11-01T23:00:00+07:00'}};
  const postHash=scalePostHash(item,evidence);evidence.visualReview={verified:true,postHash,verifiedAt:now};evidence.offerReview={containsDiscount:false,verified:true,postHash,verifiedAt:now};return evidence;
}
test('actual six-slide binder validates ordered bytehashes, account, location and bound human review without queue writes',async()=>{
  const folder=await mkdtemp(path.join(tmpdir(),'scale-bind-'));
  try{const item=buildScaleCampaign(state(),{now}).items[0],evidence=await evidenceFor(item,folder),ready=await bindScaleCreative(item,evidence,{state:state(),now});assert.equal(ready.status,'ready');assert.equal(ready.readiness.ready,true);assert.equal(item.status,'planned');assert.equal(ready.leadCode,'BẾP301');
    await writeFile(evidence.assets[0].path,'changed actual bytes');const bad=await bindScaleCreative(item,evidence,{state:state(),now});assert.equal(bad.status,'planned');assert.ok(bad.readiness.blockers.some(x=>x.includes('hash')));
  }finally{await rm(folder,{recursive:true,force:true});}
});
test('a hash-shaped string, copied review, printeddiscount or wrongaccount cannot confer readiness',async()=>{
  const folder=await mkdtemp(path.join(tmpdir(),'scale-bad-'));
  try{const item=buildScaleCampaign(state(),{now}).items[0],e=await evidenceFor(item,folder);
    for(const change of [{assets:e.assets.map(a=>({...a,sha256:'f'.repeat(64)}))},{account:'wrong'},{location:'wrong'},{visualReview:{...e.visualReview,postHash:'old'}},{caption:'Mua 1 tặng 1 cho50đơn đầu tiên. Nhắn BẾP301.'},{offerReview:{...e.offerReview,containsDiscount:true}}]){const result=await bindScaleCreative(item,{...e,...change},{state:state(),now});assert.equal(result.readiness.ready,false);}
  }finally{await rm(folder,{recursive:true,force:true});}
});
test('readyasset proof rechecks actual reservations and never inherits101listening approval onto a newvideo',async()=>{
  const folder=await mkdtemp(path.join(tmpdir(),'scale-voice-'));
  try{
    const plan=buildScaleCampaign(state(),{now}),photo=plan.items[0],photoEvidence=await evidenceFor(photo,folder);
    const conflict={...state(),queue:[reserved(1,'video',photo.proposedPublishAt)]};
    assert.ok((await bindScaleCreative(photo,photoEvidence,{state:conflict,now})).readiness.blockers.includes('current_quota_or_spacing_conflict'));
    const item=plan.items.find(i=>i.format==='video'),e=await evidenceFor(item,folder);e.assets=e.assets.slice(0,1);e.caption='Nhắn '+item.leadCode+' kèm ảnh bề mặt và vật liệu.';
    const wav=path.join(folder,'test-only.wav'),ass=path.join(folder,'test-only.ass');await writeFile(wav,'test audio bytes');await writeFile(ass,'test subtitle bytes');
    e.voice={path:wav,sha256:await hashFile(wav),voice:'Thùy Dung',speed:1.2,referenceStyle:'speaker-only',scriptSha256:scaleHash(item.creative.videoScript)};
    e.voice.listeningReview={verified:true,queueId:'sakura-101',audioSha256:e.voice.sha256,verifiedAt:now};
    e.subtitles={path:ass,sha256:await hashFile(ass),audioSha256:e.voice.sha256,scriptSha256:e.voice.scriptSha256};e.music.mixBelowNarrationVerified=true;
    const postHash=scalePostHash(item,e);e.visualReview.postHash=postHash;e.offerReview.postHash=postHash;e.playbackReview={verified:true,postHash,verifiedAt:now};
    const result=await bindScaleCreative(item,e,{state:state(),now});assert.equal(result.readiness.ready,false);assert.ok(result.readiness.blockers.includes('exact_noninherited_voice_listening_missing'));
    e.voice.referenceStyle='preset';e.voice.reviewedVoiceProof={};
    const candidate=await bindScaleCreative(item,e,{state:state(),now});assert.ok(candidate.readiness.blockers.includes('reviewed_voice_provenance_mismatch'));assert.ok(candidate.readiness.blockers.includes('voice_profile_or_script_mismatch'));
    e.voice.referenceStyle='speaker-only';e.voice.speed=1.1;
    const slowerUnproven=await bindScaleCreative(item,e,{state:state(),now});assert.ok(slowerUnproven.readiness.blockers.includes('reviewed_voice_provenance_mismatch'));assert.ok(slowerUnproven.readiness.blockers.includes('voice_profile_or_script_mismatch'));
    const expired=await bindScaleCreative(photo,photoEvidence,{state:state(),now:'2026-10-29T01:05:00Z'});assert.ok(expired.readiness.blockers.includes('proposed_time_expired_or_too_near'));
  }finally{await rm(folder,{recursive:true,force:true});}
});
test('receipt transition needs readyexactposthash, exacttime and a unique realplatformID',async()=>{
  const folder=await mkdtemp(path.join(tmpdir(),'scale-receipt-'));
  try{const item=buildScaleCampaign(state(),{now}).items[0],e=await evidenceFor(item,folder),ready=await bindScaleCreative(item,e,{state:state(),now});
    const receipt={platformId:'7611111111111111111',account:'saigomlia',postHash:ready.postHash,status:'scheduled',scheduledAt:item.proposedPublishAt,verifiedAt:now,evidence:'observed-native-receipt'};
    assert.equal(validateScaleReceipt(ready,receipt,state(),{now}).status,'scheduled');assert.throws(()=>validateScaleReceipt(item,receipt,state(),{now}),/ready/);
    assert.throws(()=>validateScaleReceipt(ready,receipt,{...state(),posts:[{id:receipt.platformId}]},{now}),/platform/);
    assert.throws(()=>validateScaleReceipt({...ready,boundCreative:{...ready.boundCreative,caption:'changed'}},receipt,state(),{now}),/ready/);
  }finally{await rm(folder,{recursive:true,force:true});}
});
test('CLI writes idempotent privateJSON/CSV, registers metadata only in a fixture, and rejects tampered artifacts',async()=>{
  const folder=await mkdtemp(path.join(tmpdir(),'scale-cli-'));
  try{
    const campaign=path.join(folder,'campaign.json'),output=path.join(folder,'output'),fixture=state();await writeFile(campaign,JSON.stringify(fixture));const before=await readFile(campaign,'utf8');
    const run=(extra=[])=>spawnSync(process.execPath,[path.join(root,'scripts/prepare-scale-campaign.mjs'),...extra],{cwd:root,encoding:'utf8',env:{...process.env,TIKTOK_CAMPAIGN_FILE:campaign,TIKTOK_SCALE_HOME:output}});
    const first=run();assert.equal(first.status,0,first.stderr);const saved=JSON.parse(first.stdout);assert.equal(saved.registered,false);assert.equal(await readFile(campaign,'utf8'),before);
    const repeat=run();assert.equal(repeat.status,0,repeat.stderr);assert.equal(JSON.parse(repeat.stdout).reused,true);
    const registration=run(['--register']);assert.equal(registration.status,0,registration.stderr);const registered=JSON.parse(await readFile(campaign,'utf8'));
    assert.deepEqual(registered.queue,fixture.queue);assert.deepEqual(registered.posts,fixture.posts);assert.equal(registered.campaign.scaleCampaign.counts.planned,1000);
    const plan=JSON.parse(await readFile(saved.manifestFile,'utf8'));plan.items[0].creative.caption='Tampered while retaining a hash-shaped field';await writeFile(saved.manifestFile,JSON.stringify(plan));
    const tampered=run();assert.notEqual(tampered.status,0);assert.match(tampered.stderr,/artifact changed/);assert.equal(JSON.parse(await readFile(saved.manifestFile,'utf8')).items[0].creative.caption,plan.items[0].creative.caption);
  }finally{await rm(folder,{recursive:true,force:true});}
});
