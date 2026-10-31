import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,mkdir,readFile,writeFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {buildScaleCampaign,scalePostHash} from '../src/scale-campaign.mjs';
import {createScaleProgress} from '../src/scale-progress.mjs';
import {hashFile} from '../src/store.mjs';
import {tenDayReference} from '../src/ten-day-cadence.mjs';

test('authorized50x10 revisions accept15-minute spacing and reject collisions, out-of-window slots and excess quota',async()=>{
 const f=await fixture();try{
  const now='2026-10-31T09:00:00Z',policy={kind:'scale-rolling-policy',account:'saigomlia',startDay:'2026-11-01',endDay:'2026-11-10',dailyTotal:50,targetTotal:500,targetPhoto:50,targetVideo:0,minSpacingMinutes:15,windowStart:'08:00',windowEnd:'22:15',timezone:'Asia/Ho_Chi_Minh',source:'user',verifiedAt:now,policyReference:tenDayReference};
  await writeFile(f.policyFile,JSON.stringify(policy));const state=await f.readState();state.campaign.rollingGoal={...policy,dailyTarget:50};await writeFile(f.campaignFile,JSON.stringify(state));
  const b=createScaleProgress({campaignFile:f.campaignFile,journalFile:f.journalFile,now:()=>now}),sha256=await hashFile(f.policyFile),photos=f.plan.items.filter(i=>i.format==='photo'),input=(i,at)=>({...f.revision(photos[i],at),policySha256:sha256});
  await b.revise(photos[0].id,input(0,'2026-11-01T08:00:00+07:00'));
  await b.revise(photos[1].id,input(1,'2026-11-01T08:15:00+07:00'));
  await assert.rejects(b.revise(photos[2].id,input(2,'2026-11-01T08:20:00+07:00')),/spacing/);
  const video=f.plan.items.find(i=>i.format==='video');await assert.rejects(b.revise(video.id,{...f.revision(video,'2026-11-01T09:00:00+07:00'),policySha256:sha256}),/photo intents only/);
  for(const at of ['2026-10-31T20:00:00+07:00','2026-11-11T08:00:00+07:00'])await assert.rejects(b.revise(photos[2].id,input(2,at)),/outside/);
  const full=await f.readState();for(let i=0;i<50;i++)full.queue.push({id:'preserved-'+i,account:'saigomlia',format:'photo',status:'scheduled',receipt:{platformId:String(7700000000000010000n+BigInt(i)),scheduledAt:'2026-11-02T'+String(8+Math.floor(i/4)).padStart(2,'0')+':'+String(i%4*15).padStart(2,'0')+':00+07:00',scheduledVerifiedAt:now}});await writeFile(f.campaignFile,JSON.stringify(full));
  await assert.rejects(b.revise(photos[2].id,input(2,'2026-11-02T21:00:00+07:00')),/daily cap/);
  assert.equal((await f.readState()).queue.length,51);assert.equal((await b.status()).items.filter(i=>i.revisionHash).length,2);
 }finally{await f.cleanup();}
});

const NOW='2026-10-30T12:00:00Z',DAY='2026-10-30';
const policyReference='2026-10-30 user: still need30posts more for today; answer Five-minute spacing tonight in call_f551da25c867465c87e34a607f80a12a';
async function fixture(){
  const dir=await mkdtemp(path.join(tmpdir(),'scale-revision-')),campaignFile=path.join(dir,'campaign.json'),planFile=path.join(dir,'plan.json'),journalFile=path.join(dir,'progress.json'),policyFile=path.join(dir,'policy.json');
  const state={account:'saigomlia',campaign:{publicPostCodes:false},products:[{id:'sakura-cleaner-500ml'}],queue:[{id:'old-today',account:'saigomlia',format:'photo',status:'scheduled',receipt:{platformId:'7700000000000000001',scheduledAt:`${DAY}T18:00:00+07:00`,scheduledVerifiedAt:NOW}}],posts:[],angles:[]};
  const plan=buildScaleCampaign(state,{now:'2026-10-28T08:00:00Z'});await writeFile(planFile,JSON.stringify(plan));state.campaign.scaleCampaign={campaignId:plan.campaignId,planHash:plan.planHash,manifestFile:planFile,manifestSha256:await hashFile(planFile),counts:plan.counts};await writeFile(campaignFile,JSON.stringify(state));
  const policy={kind:'scale-day-override',account:'saigomlia',day:DAY,dailyTotal:40,additionalAuthorized:30,minSpacingMinutes:5,windowStart:'08:00',windowEnd:'23:55',verifiedAt:NOW,source:'user',policyReference};await writeFile(policyFile,JSON.stringify(policy));
  const bridge=()=>createScaleProgress({campaignFile,journalFile,now:()=>NOW});
  const revision=(item,at=`${DAY}T20:00:00+07:00`)=>({intentId:item.id,account:item.account,originalIntentHash:item.intentHash,revisedPublishAt:at,policyFile,policySha256:null});
  async function withPolicyHash(input){return {...input,policySha256:await hashFile(policyFile)};}
  async function evidence(item){const folder=path.join(dir,'assets');await mkdir(folder,{recursive:true});const assets=[];for(let i=0;i<6;i++){const file=path.join(folder,`image-${i}.png`);await writeFile(file,`synthetic-${i}`);assets.push({path:file,sha256:await hashFile(file),order:i+1});}const screenshot=path.join(folder,'preflight.png');await writeFile(screenshot,'synthetic native preflight');const e={account:item.account,location:item.location,caption:'Gọi số điện thoại trong bio để được tư vấn. Cho biết vật liệu và nhu cầu.',publicPostCodes:false,assets,demoKind:'product_identity',authenticProductReferenceVerified:true,music:{soundId:'7700000000000000002',businessUseVerified:true,availableInAccount:true,selectedInUi:true,verifiedAt:NOW},scheduleWindow:{verified:true,format:item.format,account:item.account,verifiedAt:NOW,earliest:`${DAY}T00:00:00+07:00`,latest:`${DAY}T23:55:00+07:00`}};const postHash=scalePostHash(item,e);e.visualReview={verified:true,postHash,verifiedAt:NOW};e.offerReview={verified:true,containsDiscount:false,postHash,verifiedAt:NOW};e.preflight={verified:true,postHash,account:item.account,format:item.format,audience:'Everyone',location:item.location,scheduledAt:item.proposedPublishAt,disclosures:{aiGenerated:true,ownBrand:true},verifiedAt:NOW,evidence:{path:screenshot,sha256:await hashFile(screenshot)}};return e;}
  return {dir,campaignFile,planFile,journalFile,policyFile,policy,plan,bridge,revision,withPolicyHash,evidence,readState:async()=>JSON.parse(await readFile(campaignFile,'utf8')),cleanup:()=>rm(dir,{recursive:true,force:true})};
}

test('expired immutable intent gains a dated effective slot and advances through bound receipt and reload',async()=>{const f=await fixture();try{
  const item=f.plan.items[0],b=f.bridge(),before=await readFile(f.planFile,'utf8'),stateBefore=await readFile(f.campaignFile,'utf8');assert.equal(item.proposedPublishAt.slice(0,10),'2026-10-29');
  const revised=await b.revise(item.id,await f.withPolicyHash(f.revision(item)));assert.equal(revised.originalIntentHash,item.intentHash);assert.equal(revised.effectivePublishAt,`${DAY}T20:00:00+07:00`);assert.equal(await readFile(f.planFile,'utf8'),before);assert.equal(await readFile(f.campaignFile,'utf8'),stateBefore);
  const status=await f.bridge().status();assert.equal(status.items.find(x=>x.id===item.id).effectivePublishAt,revised.effectivePublishAt);
  const effective={...item,proposedPublishAt:revised.effectivePublishAt,scheduleRevision:JSON.parse(await readFile(f.journalFile,'utf8')).records[item.id].scheduleRevision};const e=await f.evidence(effective),bound=await b.bind(item.id,e);assert.equal(bound.status,'ready');assert.equal(bound.postHash,scalePostHash(effective,e));
  await b.submitting(item.id);await assert.rejects(b.revise(item.id,await f.withPolicyHash(f.revision(item,`${DAY}T20:10:00+07:00`))),/accepted|uncertain/i);const q=(await f.readState()).queue.find(x=>x.id===item.id);assert.equal(q.publishAt,revised.effectivePublishAt);assert.equal(q.intentHash,item.intentHash);assert.equal(q.scheduleRevisionHash,revised.revisionHash);
  const receipt={platformId:'7700000000000000003',status:'scheduled',account:item.account,postHash:bound.postHash,scheduledAt:revised.effectivePublishAt,verifiedAt:NOW,evidence:'Synthetic native receipt'};assert.equal((await b.receipt(item.id,receipt)).status,'scheduled');assert.equal((await f.bridge().status()).items.find(x=>x.id===item.id).status,'scheduled');assert.equal((await f.readState()).queue.find(x=>x.id===item.id).receipt.platformId,receipt.platformId);
  await assert.rejects(b.revise(item.id,await f.withPolicyHash(f.revision(item,`${DAY}T20:10:00+07:00`))),/accepted|uncertain/i);
}finally{await f.cleanup();}});

test('revision rejects wrong identity, policy, time and spacing without changing the journal',async()=>{const f=await fixture();try{
  const b=f.bridge(),item=f.plan.items[0],second=f.plan.items[1],base=await f.withPolicyHash(f.revision(item));
  for(const input of [{...base,account:'wrong'},{...base,originalIntentHash:'f'.repeat(64)},{...base,revisedPublishAt:`${DAY}T19:07:00+07:00`},{...base,revisedPublishAt:`${DAY}T19:20:00+07:00`},{...base,revisedPublishAt:'2026-10-31T20:00:00+07:00'},{...base,revisedPublishAt:`${DAY}T23:58:00+07:00`}])await assert.rejects(b.revise(item.id,input));
  f.policy.dailyTotal=41;await writeFile(f.policyFile,JSON.stringify(f.policy));await assert.rejects(b.revise(item.id,await f.withPolicyHash(base)),/policy/i);f.policy.dailyTotal=40;f.policy.additionalAuthorized=29;await writeFile(f.policyFile,JSON.stringify(f.policy));await assert.rejects(b.revise(item.id,await f.withPolicyHash(base)),/policy/i);f.policy.additionalAuthorized=30;await writeFile(f.policyFile,JSON.stringify(f.policy));
  await b.revise(item.id,await f.withPolicyHash(base));await assert.rejects(b.revise(second.id,await f.withPolicyHash(f.revision(second,`${DAY}T20:00:00+07:00`))),/spacing/i);
  await assert.rejects(b.revise(item.id,await f.withPolicyHash(base)),/new slot/i);
  f.policy.dailyTotal=41;await writeFile(f.policyFile,JSON.stringify(f.policy));await assert.rejects(b.status(),/checksum/i);
}finally{await f.cleanup();}});

test('expired private revised slot can be explicitly revised again without consuming another intent',async()=>{const f=await fixture();try{
  const item=f.plan.items[0],b=f.bridge(),first=await b.revise(item.id,await f.withPolicyHash(f.revision(item))),oldRecord=JSON.parse(await readFile(f.journalFile,'utf8')).records[item.id];
  const firstEffective={...item,proposedPublishAt:first.effectivePublishAt,scheduleRevision:oldRecord.scheduleRevision},firstBound=await b.bind(item.id,await f.evidence(firstEffective));assert.equal(firstBound.status,'ready');
  const late=createScaleProgress({campaignFile:f.campaignFile,journalFile:f.journalFile,now:()=>`${DAY}T19:35:00+07:00`});
  const second=await late.revise(item.id,await f.withPolicyHash(f.revision(item,`${DAY}T20:10:00+07:00`)));assert.equal(second.revisionCount,2);assert.notEqual(second.revisionHash,first.revisionHash);
  const journal=JSON.parse(await readFile(f.journalFile,'utf8')),record=journal.records[item.id];assert.equal(record.scheduleRevisionHistory.length,1);assert.deepEqual(record.scheduleRevisionHistory[0],oldRecord.scheduleRevision);assert.equal(record.scheduleRevision.supersedesRevisionHash,first.revisionHash);assert.equal(record.boundReady,null);assert.equal(record.postHash,null);assert.equal((await b.status()).items.find(x=>x.id===item.id).revisionCount,2);
  const secondEffective={...item,proposedPublishAt:second.effectivePublishAt,scheduleRevision:record.scheduleRevision},newBound=await late.bind(item.id,await f.evidence(secondEffective));assert.equal(newBound.status,'ready');assert.notEqual(newBound.postHash,firstBound.postHash);
  const afterBind=JSON.parse(await readFile(f.journalFile,'utf8')).records[item.id];assert.equal(afterBind.scheduleRevisionHistory.length,1);assert.equal((await f.readState()).queue.length,1);
  await assert.rejects(late.revise(item.id,await f.withPolicyHash(f.revision(item,`${DAY}T20:00:00+07:00`))),/too near/i);
  const tampered=JSON.parse(await readFile(f.journalFile,'utf8'));tampered.records[item.id].scheduleRevisionHistory[0].revisedPublishAt=`${DAY}T20:05:00+07:00`;await writeFile(f.journalFile,JSON.stringify(tampered));await assert.rejects(late.status(),/integrity|checksum/i);
}finally{await f.cleanup();}});

test('forty actual accepted reservations exhaust the dated cap',async()=>{const f=await fixture();try{
  const s=await f.readState();for(let i=0;i<39;i++){const hour=8+Math.floor(i/3),minute=(i%3)*20,at=`${DAY}T${String(hour).padStart(2,'0')}:${String(minute).padStart(2,'0')}:00+07:00`;s.queue.push({id:`synthetic-${i}`,account:'saigomlia',format:i%2?'video':'photo',status:'scheduled',receipt:{platformId:String(7800000000000000000n+BigInt(i)),scheduledAt:at,scheduledVerifiedAt:NOW}});}await writeFile(f.campaignFile,JSON.stringify(s));const item=f.plan.items[0];await assert.rejects(f.bridge().revise(item.id,await f.withPolicyHash(f.revision(item))),/daily cap/i);
}finally{await f.cleanup();}});

test('thirty unique revised intents remain the limit after re-revision',async()=>{const f=await fixture();try{
  const b=f.bridge(),policySha256=await hashFile(f.policyFile);for(let i=0;i<30;i++){const at=new Date(Date.parse(`${DAY}T20:00:00+07:00`)+i*5*60000);const local=new Date(at.getTime()+7*3600000).toISOString().slice(0,19)+'+07:00';await b.revise(f.plan.items[i].id,{...f.revision(f.plan.items[i],local),policySha256});}
  await assert.rejects(b.revise(f.plan.items[30].id,{...f.revision(f.plan.items[30],`${DAY}T22:30:00+07:00`),policySha256}),/Thirty additional/i);
  const again=await b.revise(f.plan.items[0].id,{...f.revision(f.plan.items[0],`${DAY}T23:00:00+07:00`),policySha256});assert.equal(again.revisionCount,2);assert.equal((await b.status()).items.filter(x=>x.revisionHash).length,30);
}finally{await f.cleanup();}});

test('registered and uncertain targets cannot revise; journal tamper fails on reload',async()=>{const f=await fixture();try{
  const b=f.bridge(),item=f.plan.items[0],input=await f.withPolicyHash(f.revision(item));const s=await f.readState();s.queue.push({...item,phase:'scale',publishAt:item.proposedPublishAt,status:'needs_review'});await writeFile(f.campaignFile,JSON.stringify(s));await assert.rejects(b.revise(item.id,input),/registered|uncertain/i);
  s.queue.pop();await writeFile(f.campaignFile,JSON.stringify(s));await b.revise(item.id,input);const j=JSON.parse(await readFile(f.journalFile,'utf8'));j.records[item.id].scheduleRevision.revisedPublishAt=`${DAY}T20:05:00+07:00`;await writeFile(f.journalFile,JSON.stringify(j));await assert.rejects(b.status(),/integrity|checksum/i);
}finally{await f.cleanup();}});
