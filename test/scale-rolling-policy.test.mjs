import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,mkdir,readFile,writeFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {buildScaleCampaign,scalePostHash,bindScaleCreative} from '../src/scale-campaign.mjs';
import {createScaleProgress} from '../src/scale-progress.mjs';
import {hashFile} from '../src/store.mjs';
import {videoRolloutReference,rollingLimits,isVideoRolloutPolicy,mixedRolloutReference,isMixedRolloutPolicy,continuationReference} from '../src/ten-day-cadence.mjs';

const now='2026-10-31T09:00:00+07:00',day='2026-10-31';
const oldReference='2026-10-30 user: still need30posts more for today; answer Five-minute spacing tonight in call_f551da25c867465c87e34a607f80a12a';
const rollingReference='2026-10-31 user: we do need 30 posts per day. schedule it for the next 30 days.';
const fiftyReference='2026-10-31 user: continue to schedule20posts per day; schedule for50days first; set the goal again.';

test('November18 continuation keeps immutable plans and reservations while extending checked mixed scheduling',async()=>{const f=await fixture();try{
 f.clock.value='2026-11-18T09:00:00+07:00';const b=f.bridge(),photo=f.plan.items.find(x=>x.format==='photo');
 const oldPlan=await readFile(f.planFile,'utf8'),kept=(await f.readState()).queue;
 const file=path.join(f.dir,'continuation.json'),policy={...f.policy,startDay:'2026-11-18',endDay:'2026-12-18',dailyTotal:50,targetTotal:1550,targetPhoto:30,targetVideo:20,minSpacingMinutes:15,verifiedAt:f.clock.value,policyReference:continuationReference};
 await writeFile(file,JSON.stringify(policy));const s=await f.readState();s.campaign.rollingGoal={...policy,dailyTarget:50};await writeFile(f.campaignFile,JSON.stringify(s));
 assert.deepEqual(rollingLimits(s,'2026-12-18T12:00:00+07:00'),{cap:50,spacingMinutes:15});
 await assert.rejects(b.revise(photo.id,await f.input(photo,'2026-11-18T09:25:00+07:00',file)),/outside authorized/);
 await assert.rejects(b.revise(photo.id,await f.input(photo,'2026-12-19T12:00:00+07:00',file)),/outside authorized/);
 const revised=await b.revise(photo.id,await f.input(photo,'2026-12-18T12:00:00+07:00',file));
 const record=JSON.parse(await readFile(f.journalFile,'utf8')).records[photo.id],item={...photo,proposedPublishAt:revised.effectivePublishAt,scheduleRevision:record.scheduleRevision};
 const e=await f.evidence(item);e.assets=e.assets.slice(0,5);e.photoTitle='Hỏi đúng nhu cầu';e.spokenScript='';e.photoStory={adapter:'native-five-photo-v1',sourceIntentHash:item.intentHash,assetCount:5,voiceOverAttached:false};e.scheduleWindow.latest=item.proposedPublishAt;
 const h=scalePostHash(item,e);e.visualReview.postHash=h;e.offerReview.postHash=h;e.preflight.postHash=h;
 assert.equal((await b.bind(photo.id,e)).status,'ready');
 assert.equal((await f.bridge().status()).items.find(x=>x.id===photo.id).effectivePublishAt,item.proposedPublishAt);
 const other=f.plan.items.find(x=>x.format==='photo'&&x.id!==photo.id);await assert.rejects(b.revise(other.id,await f.input(other,'2026-12-18T12:10:00+07:00',file)),/spacing/);
 const full=await f.readState();for(let n=0;n<30;n++)full.queue.push({id:'continue-photo-'+n,account:'saigomlia',format:'photo',status:'scheduled',receipt:{platformId:String(7760000000000000000n+BigInt(n)),scheduledAt:new Date(Date.parse('2026-12-01T08:00:00+07:00')+n*15*60000).toISOString(),scheduledVerifiedAt:f.clock.value}});await writeFile(f.campaignFile,JSON.stringify(full));
 await assert.rejects(b.revise(other.id,await f.input(other,'2026-12-01T21:00:00+07:00',file)),/format cap/);
 assert.equal(await readFile(f.planFile,'utf8'),oldPlan);assert.deepEqual((await f.readState()).queue.slice(0,kept.length),kept);
 const wrong={...policy,dailyTotal:51};await writeFile(file,JSON.stringify(wrong));await assert.rejects(b.status(),/checksum/);
}finally{await f.cleanup();}});

test('mixed30photo20video policy preserves reservations and supports native five-photo adaptation',async()=>{const f=await fixture();try{
 f.clock.value='2026-11-01T08:00:00+07:00';const file=path.join(f.dir,'mixed.json'),policy={...f.policy,startDay:'2026-11-01',endDay:'2026-11-21',dailyTotal:50,targetTotal:1050,targetPhoto:30,targetVideo:20,minSpacingMinutes:15,verifiedAt:f.clock.value,policyReference:mixedRolloutReference};assert.equal(isMixedRolloutPolicy(policy),true);await writeFile(file,JSON.stringify(policy));
 const s=await f.readState();s.campaign.rollingGoal={startDay:policy.startDay,endDay:policy.endDay,dailyTarget:50,minSpacingMinutes:15,policyReference:mixedRolloutReference};const kept=structuredClone(s.queue);await writeFile(f.campaignFile,JSON.stringify(s));
 const photo=f.plan.items.find(x=>x.format==='photo'),video=f.plan.items.find(x=>x.format==='video'),b=f.bridge();
 const revised=await b.revise(photo.id,await f.input(photo,'2026-11-01T10:00:00+07:00',file)),record=JSON.parse(await readFile(f.journalFile,'utf8')).records[photo.id],item={...photo,proposedPublishAt:revised.effectivePublishAt,scheduleRevision:record.scheduleRevision},e=await f.evidence(item);
 e.assets=e.assets.slice(0,5);e.photoTitle='Chọn đúng nhu cầu trước khi mua';e.spokenScript='';e.photoStory={adapter:'native-five-photo-v1',sourceIntentHash:item.intentHash,assetCount:5,voiceOverAttached:false};const h=scalePostHash(item,e);e.visualReview.postHash=h;e.offerReview.postHash=h;e.preflight.postHash=h;
 assert.equal((await b.bind(photo.id,e)).status,'ready');await b.revise(video.id,await f.input(video,'2026-11-01T10:15:00+07:00',file));assert.deepEqual((await f.readState()).queue,kept);
 const full=await f.readState();for(let n=0;n<30;n++)full.queue.push({id:'mixed-photo-'+n,account:'saigomlia',format:'photo',status:'scheduled',receipt:{platformId:String(7750000000000000000n+BigInt(n)),scheduledAt:new Date(Date.parse('2026-11-02T08:00:00+07:00')+n*15*60000).toISOString(),scheduledVerifiedAt:f.clock.value}});await writeFile(f.campaignFile,JSON.stringify(full));
 const anotherPhoto=f.plan.items.find(x=>x.format==='photo'&&x.id!==photo.id),anotherVideo=f.plan.items.find(x=>x.format==='video'&&x.id!==video.id);
 await assert.rejects(b.revise(anotherPhoto.id,await f.input(anotherPhoto,'2026-11-02T21:00:00+07:00',file)),/format cap/);
 await b.revise(anotherVideo.id,await f.input(anotherVideo,'2026-11-02T21:00:00+07:00',file));assert.equal((await b.status()).items.find(x=>x.id===anotherVideo.id).effectivePublishAt,'2026-11-02T21:00:00+07:00');
}finally{await f.cleanup();}});

test('video conditional offer uses the customer ledger and cannot extend beyondNovember10',async()=>{const f=await fixture();try{
 f.clock.value='2026-11-01T08:00:00+07:00';const original=f.plan.items.find(x=>x.format==='video'),s=await f.readState(),file=path.join(f.dir,'contacts.json');
 const ledger={campaignId:'sakura-contact-50-november',terms:{unit:'customers',capacity:50,channel:'TikTok-origin contact',startDay:'2026-11-01',endDay:'2026-11-10'},countsVerified:true,countVerifiedAt:f.clock.value,countSource:{kind:'user-confirmation',reference:'chat:actual-count'},remainingCustomers:50,allocatedCustomers:0,executionPolicy:{mode:'conditional-contact-check',source:'chat:call_297ccc4180d841f88c8587bfadf08034',availabilityCheckedWhenCustomerCalls:true}};await writeFile(file,JSON.stringify(ledger));
 s.campaign.rollingGoal={startDay:'2026-11-01',endDay:'2026-11-21',dailyTarget:50,minSpacingMinutes:15,policyReference:videoRolloutReference};s.campaign.currentPromotionBrief={file,sha256:await hashFile(file)};
 const item={...original,proposedPublishAt:'2026-11-02T12:00:00+07:00',scheduleRevision:{policyKind:'scale-rolling-policy',policyReference:videoRolloutReference,originalPublishAt:original.proposedPublishAt}},e=await f.evidence(item);e.caption='Mua 1 tặng 1 cho 50 khách hàng đầu tiên liên hệ từ TikTok. Gọi để kiểm tra ưu đãi còn áp dụng không và điều kiện nhận quà. Gọi số điện thoại trong bio để được tư vấn.';e.contactOfferLedger={path:file,sha256:await hashFile(file)};e.offerReview.containsDiscount=true;e.offerReview.containsRemainingCountClaim=false;e.offerReview.conditionalOfferDisclosureVerified=true;
 const h=scalePostHash(item,e);e.offerReview.postHash=h;e.visualReview.postHash=h;e.preflight.postHash=h;
 // Offer-only coverage: missing video/audio production evidence must still keep the whole item unready.
 const first=await bindScaleCreative(item,e,{state:s,now:f.clock.value});assert.equal(first.readiness.blockers.includes('discount_not_verified_for_actual_publication_time'),false);assert.equal(first.readiness.ready,false);
 const later=await bindScaleCreative({...item,proposedPublishAt:'2026-11-11T12:00:00+07:00'},e,{state:s,now:f.clock.value});assert.ok(later.readiness.blockers.includes('discount_not_verified_for_actual_publication_time'));
 e.caption=e.caption.replace('Gọi để kiểm tra ưu đãi còn áp dụng không và điều kiện nhận quà.','');const missing=await bindScaleCreative(item,e,{state:s,now:f.clock.value});assert.ok(missing.readiness.blockers.includes('conditional_offer_disclosure_missing'));
}finally{await f.cleanup();}});

test('November video policy preserves historical allocations, accepts only videos and bounds21days',async()=>{const f=await fixture();try{
 const video=f.plan.items.find(x=>x.format==='video'),photo=f.plan.items.find(x=>x.format==='photo'),b=f.bridge();
 await b.revise(video.id,await f.input(video));
 f.clock.value='2026-11-01T08:00:00+07:00';
 const file=path.join(f.dir,'november-video.json'),policy={...f.policy,startDay:'2026-11-01',endDay:'2026-11-21',dailyTotal:50,targetTotal:1050,targetPhoto:0,targetVideo:50,minSpacingMinutes:15,verifiedAt:f.clock.value,policyReference:videoRolloutReference};
 assert.equal(isVideoRolloutPolicy(policy),true);await writeFile(file,JSON.stringify(policy));
 const s=await f.readState(),preserved=structuredClone(s.queue);s.campaign.rollingGoal={startDay:policy.startDay,endDay:policy.endDay,dailyTarget:50,minSpacingMinutes:15,policyReference:videoRolloutReference};await writeFile(f.campaignFile,JSON.stringify(s));
 assert.deepEqual(rollingLimits(s,'2026-11-21T12:00:00+07:00'),{cap:50,spacingMinutes:15});
 await assert.rejects(b.revise(photo.id,await f.input(photo,'2026-11-01T10:00:00+07:00',file)),/video intents only/);
 const result=await b.revise(video.id,await f.input(video,'2026-11-21T10:00:00+07:00',file));assert.equal(result.revisionCount,2);
 assert.equal((await f.bridge().status()).items.find(x=>x.id===video.id).effectivePublishAt,'2026-11-21T10:00:00+07:00');assert.deepEqual((await f.readState()).queue,preserved);
 const other=f.plan.items.find(x=>x.format==='video'&&x.id!==video.id);
 await assert.rejects(b.revise(other.id,await f.input(other,'2026-11-22T10:00:00+07:00',file)),/outside authorized/);
 await assert.rejects(b.revise(other.id,await f.input(other,'2026-11-01T08:25:00+07:00',file)),/outside authorized/);
 const full=await f.readState();for(let n=0;n<50;n++){const t=new Date(Date.parse('2026-11-02T08:00:00+07:00')+n*15*60000).toISOString();full.queue.push({id:'nov-kept-'+n,format:'photo',account:'saigomlia',status:'scheduled',receipt:{platformId:String(7740000000000000000n+BigInt(n)),scheduledAt:t,scheduledVerifiedAt:f.clock.value}});}await writeFile(f.campaignFile,JSON.stringify(full));
 await assert.rejects(b.revise(other.id,await f.input(other,'2026-11-02T21:00:00+07:00',file)),/daily cap/);
}finally{await f.cleanup();}});
async function fixture(){const dir=await mkdtemp(path.join(tmpdir(),'scale-rolling-')),campaignFile=path.join(dir,'campaign.json'),planFile=path.join(dir,'plan.json'),journalFile=path.join(dir,'progress.json'),policyFile=path.join(dir,'rolling-policy.json'),oldPolicyFile=path.join(dir,'old-policy.json');
  const state={account:'saigomlia',campaign:{publicPostCodes:false},products:[{id:'sakura-cleaner-500ml'}],queue:[{id:'existing',account:'saigomlia',format:'photo',status:'scheduled',receipt:{platformId:'7711000000000000001',scheduledAt:`${day}T10:00:00+07:00`,scheduledVerifiedAt:now}}],posts:[],angles:[]};
  const plan=buildScaleCampaign(state,{now:'2026-10-28T08:00:00Z'});await writeFile(planFile,JSON.stringify(plan));state.campaign.scaleCampaign={campaignId:plan.campaignId,planHash:plan.planHash,manifestFile:planFile,manifestSha256:await hashFile(planFile),counts:plan.counts};await writeFile(campaignFile,JSON.stringify(state));
  const policy={kind:'scale-rolling-policy',account:'saigomlia',startDay:'2026-10-31',endDay:'2026-11-29',dailyTotal:30,targetTotal:900,targetPhoto:15,targetVideo:15,minSpacingMinutes:20,windowStart:'08:00',windowEnd:'22:15',timezone:'Asia/Ho_Chi_Minh',source:'user',verifiedAt:'2026-10-31T08:00:00+07:00',policyReference:rollingReference};
  const oldPolicy={kind:'scale-day-override',account:'saigomlia',day:'2026-10-30',dailyTotal:40,additionalAuthorized:30,minSpacingMinutes:5,windowStart:'08:00',windowEnd:'23:55',source:'user',verifiedAt:'2026-10-30T19:00:00+07:00',policyReference:oldReference};await writeFile(policyFile,JSON.stringify(policy));await writeFile(oldPolicyFile,JSON.stringify(oldPolicy));
  const clock={value:now},bridge=()=>createScaleProgress({campaignFile,journalFile,now:()=>clock.value});
  const input=async(item,at=`${day}T11:00:00+07:00`,file=policyFile)=>({intentId:item.id,account:item.account,originalIntentHash:item.intentHash,revisedPublishAt:at,policyFile:file,policySha256:await hashFile(file)});
  async function evidence(item){const folder=path.join(dir,'assets');await mkdir(folder,{recursive:true});const assets=[];for(let i=0;i<6;i++){const file=path.join(folder,`image-${i}.png`);await writeFile(file,`synthetic-${i}`);assets.push({path:file,sha256:await hashFile(file),order:i+1});}const screenshot=path.join(folder,'preflight.png');await writeFile(screenshot,'synthetic preflight');const e={account:item.account,location:item.location,caption:'Gọi số điện thoại trong bio để được tư vấn. Cho biết vật liệu và nhu cầu.',publicPostCodes:false,assets,demoKind:'product_identity',authenticProductReferenceVerified:true,music:{soundId:'7711000000000000002',businessUseVerified:true,availableInAccount:true,selectedInUi:true,verifiedAt:clock.value},scheduleWindow:{verified:true,format:item.format,account:item.account,verifiedAt:clock.value,earliest:`${day}T00:00:00+07:00`,latest:'2026-11-29T22:15:00+07:00'}};const postHash=scalePostHash(item,e);e.visualReview={verified:true,postHash,verifiedAt:clock.value};e.offerReview={verified:true,containsDiscount:false,postHash,verifiedAt:clock.value};e.preflight={verified:true,postHash,account:item.account,format:item.format,audience:'Everyone',location:item.location,scheduledAt:item.proposedPublishAt,disclosures:{aiGenerated:true,ownBrand:true},verifiedAt:clock.value,evidence:{path:screenshot,sha256:await hashFile(screenshot)}};return e;}
  return {dir,campaignFile,planFile,journalFile,policyFile,oldPolicyFile,policy,clock,plan,bridge,input,evidence,readState:async()=>JSON.parse(await readFile(campaignFile,'utf8')),cleanup:()=>rm(dir,{recursive:true,force:true})};
}
test('rolling revision preserves plan and advances through hash-bound receipt/reload',async()=>{const f=await fixture();try{const item=f.plan.items[0],beforePlan=await readFile(f.planFile,'utf8'),beforeState=await readFile(f.campaignFile,'utf8'),b=f.bridge();
  const revision=await b.revise(item.id,await f.input(item));assert.equal(revision.effectivePublishAt,`${day}T11:00:00+07:00`);assert.equal(await readFile(f.planFile,'utf8'),beforePlan);assert.equal(await readFile(f.campaignFile,'utf8'),beforeState);
  const current=JSON.parse(await readFile(f.journalFile,'utf8')).records[item.id].scheduleRevision;assert.equal(current.policyKind,'scale-rolling-policy');const effective={...item,proposedPublishAt:revision.effectivePublishAt,scheduleRevision:current},bound=await b.bind(item.id,await f.evidence(effective));assert.equal(bound.status,'ready');await b.submitting(item.id);
  const receipt={platformId:'7711000000000000003',status:'scheduled',account:item.account,postHash:bound.postHash,scheduledAt:revision.effectivePublishAt,verifiedAt:f.clock.value,evidence:'synthetic receipt'};await b.receipt(item.id,receipt);assert.equal((await f.bridge().status()).items.find(x=>x.id===item.id).status,'scheduled');const q=(await f.readState()).queue.find(x=>x.id===item.id);assert.equal(q.intentHash,item.intentHash);assert.equal(q.scalePostHash,bound.postHash);assert.equal(q.receipt.platformId,receipt.platformId);await assert.rejects(b.revise(item.id,await f.input(item,`${day}T11:20:00+07:00`)),/accepted|uncertain/i);
}finally{await f.cleanup();}});
test('rolling gates reject wrong policy, date, window, lead, grid, spacing and 30 accepted',async()=>{const f=await fixture();try{const b=f.bridge(),item=f.plan.items[0];for(const at of [`${day}T10:15:00+07:00`,`${day}T09:20:00+07:00`,`${day}T22:20:00+07:00`,'2026-11-30T11:00:00+07:00',`${day}T11:03:00+07:00`])await assert.rejects(b.revise(item.id,await f.input(item,at)));
  f.policy.dailyTotal=31;await writeFile(f.policyFile,JSON.stringify(f.policy));await assert.rejects(b.revise(item.id,await f.input(item)),/policy/i);f.policy.dailyTotal=30;await writeFile(f.policyFile,JSON.stringify(f.policy));
  const s=await f.readState();for(let i=0;i<29;i++){const hour=8+Math.floor(i/3),minute=i%3*20;s.queue.push({id:`other-${i}`,account:'saigomlia',format:i%2?'photo':'video',status:'scheduled',receipt:{platformId:String(7712000000000000000n+BigInt(i)),scheduledAt:`${day}T${String(hour).padStart(2,'0')}:${String(minute).padStart(2,'0')}:00+07:00`,scheduledVerifiedAt:now}});}await writeFile(f.campaignFile,JSON.stringify(s));await assert.rejects(b.revise(item.id,await f.input(item,`${day}T20:00:00+07:00`)),/daily cap/i);
}finally{await f.cleanup();}});
test('unregistered October 30 revision migrates with linked history; old policy stays checked',async()=>{const f=await fixture();try{const item=f.plan.items[0],b=f.bridge();f.clock.value='2026-10-30T19:00:00+07:00';const old=await b.revise(item.id,await f.input(item,'2026-10-30T20:00:00+07:00',f.oldPolicyFile));const oldRecord=JSON.parse(await readFile(f.journalFile,'utf8')).records[item.id],oldEffective={...item,proposedPublishAt:old.effectivePublishAt,scheduleRevision:oldRecord.scheduleRevision},e=await f.evidence(oldEffective);e.scheduleWindow.earliest='2026-10-30T00:00:00+07:00';assert.equal((await b.bind(item.id,e)).status,'ready');f.clock.value=now;const fresh=await b.revise(item.id,await f.input(item));assert.equal(fresh.revisionCount,2);const r=JSON.parse(await readFile(f.journalFile,'utf8')).records[item.id];assert.equal(r.scheduleRevisionHistory[0].revisedPublishAt,'2026-10-30T20:00:00+07:00');assert.equal(r.scheduleRevision.supersedesRevisionHash,old.revisionHash);assert.equal(r.boundReady,null);assert.equal(r.postHash,null);assert.equal((await b.status()).items.find(x=>x.id===item.id).effectivePublishAt,`${day}T11:00:00+07:00`);
  await writeFile(f.oldPolicyFile,JSON.stringify({...JSON.parse(await readFile(f.oldPolicyFile,'utf8')),dailyTotal:41}));await assert.rejects(b.status(),/checksum/i);
}finally{await f.cleanup();}});
test('rolling allocation counts other revised and submitting slots without changing canonical receipts',async()=>{const f=await fixture();try{const b=f.bridge(),first=f.plan.items[0],second=f.plan.items[1],third=f.plan.items[2],before=(await f.readState()).queue[0].receipt;
  const initial=await b.revise(first.id,await f.input(first));await assert.rejects(b.revise(second.id,await f.input(second,`${day}T11:15:00+07:00`)),/spacing/i);
  const record=JSON.parse(await readFile(f.journalFile,'utf8')).records[first.id],effective={...first,proposedPublishAt:initial.effectivePublishAt,scheduleRevision:record.scheduleRevision};assert.equal((await b.bind(first.id,await f.evidence(effective))).status,'ready');await b.submitting(first.id);
  await assert.rejects(b.revise(third.id,await f.input(third,`${day}T11:15:00+07:00`)),/spacing/i);assert.deepEqual((await f.readState()).queue[0].receipt,before);
}finally{await f.cleanup();}});
test('rolling policy bytes are rechecked on reload and cannot be swapped after binding',async()=>{const f=await fixture();try{const item=f.plan.items[0],b=f.bridge(),revision=await b.revise(item.id,await f.input(item)),r=JSON.parse(await readFile(f.journalFile,'utf8')).records[item.id],effective={...item,proposedPublishAt:revision.effectivePublishAt,scheduleRevision:r.scheduleRevision};assert.equal((await b.bind(item.id,await f.evidence(effective))).status,'ready');await writeFile(f.policyFile,JSON.stringify({...f.policy,minSpacingMinutes:5}));await assert.rejects(b.status(),/checksum/i);await assert.rejects(b.submitting(item.id),/checksum/i);
}finally{await f.cleanup();}});

test('latest20x50 policy extends local revisions throughDecember19 and blocks the superseded30/day authority',async()=>{const f=await fixture();try{
 const file=path.join(f.dir,'twenty-fifty.json'),policy={...f.policy,endDay:'2026-12-19',dailyTotal:20,targetTotal:1000,targetPhoto:10,targetVideo:10,policyReference:fiftyReference};await writeFile(file,JSON.stringify(policy));
 const s=await f.readState();s.campaign.rollingGoal={dailyTarget:20,policyReference:fiftyReference};await writeFile(f.campaignFile,JSON.stringify(s));
 const b=f.bridge(),item=f.plan.items[0];await assert.rejects(b.revise(item.id,await f.input(item)),/latest registered/);
 const revised=await b.revise(item.id,await f.input(item,'2026-12-19T11:00:00+07:00',file));assert.equal(revised.effectivePublishAt,'2026-12-19T11:00:00+07:00');assert.equal((await b.status()).items.find(x=>x.id===item.id).effectivePublishAt,revised.effectivePublishAt);
 await assert.rejects(b.revise(f.plan.items[1].id,await f.input(f.plan.items[1],'2026-12-20T11:00:00+07:00',file)),/outside authorized/);
}finally{await f.cleanup();}});
test('latest20x50 cap counts20 accepted reservations and refuses one more without changing them',async()=>{const f=await fixture();try{
 const file=path.join(f.dir,'twenty-fifty.json'),policy={...f.policy,endDay:'2026-12-19',dailyTotal:20,targetTotal:1000,targetPhoto:10,targetVideo:10,policyReference:fiftyReference};await writeFile(file,JSON.stringify(policy));
 const s=await f.readState();s.campaign.rollingGoal={dailyTarget:20,policyReference:fiftyReference};for(let i=0;i<19;i++)s.queue.push({id:'kept-'+i,account:'saigomlia',format:'photo',status:'scheduled',receipt:{platformId:String(7720000000000000000n+BigInt(i)),scheduledAt:`${day}T${String(8+Math.floor(i/3)).padStart(2,'0')}:${String(i%3*20).padStart(2,'0')}:00+07:00`,scheduledVerifiedAt:now}});await writeFile(f.campaignFile,JSON.stringify(s));const before=await readFile(f.campaignFile,'utf8');
 await assert.rejects(f.bridge().revise(f.plan.items[0].id,await f.input(f.plan.items[0],`${day}T20:00:00+07:00`,file)),/daily cap/);assert.equal(await readFile(f.campaignFile,'utf8'),before);
 const direct={...f.plan.items[0],proposedPublishAt:`${day}T20:00:00+07:00`,scheduleRevision:{policyKind:'scale-rolling-policy',originalPublishAt:f.plan.items[0].proposedPublishAt}};assert.ok((await bindScaleCreative(direct,await f.evidence(direct),{state:s,now})).readiness.blockers.includes('current_quota_or_spacing_conflict'));
}finally{await f.cleanup();}});
