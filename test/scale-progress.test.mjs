import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,mkdir,readFile,writeFile,rm,stat} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {buildScaleCampaign,bindScaleCreative,scalePostHash} from '../src/scale-campaign.mjs';
import {createScaleProgress} from '../src/scale-progress.mjs';
import {hashFile} from '../src/store.mjs';

const NOW='2026-10-28T08:00:00Z';
async function fixture(){
  const dir=await mkdtemp(path.join(tmpdir(),'scale-progress-')),campaignFile=path.join(dir,'campaign.json'),planFile=path.join(dir,'plan.json'),journalFile=path.join(dir,'progress.json');
  const old={id:'old-untouched',account:'saigomlia',status:'published',format:'photo',receipt:{platformId:'7600000000000000001',publishedAt:'2026-10-27T08:00:00+07:00',publishedVerifiedAt:NOW},caption:'Preserve this receipt and caption'};
  const initial={account:'saigomlia',products:[{id:'sakura-cleaner-500ml',facts:{volume:'500 ml'}}],campaign:{},queue:[old],posts:[],angles:[]};
  const plan=buildScaleCampaign(initial,{now:NOW});await writeFile(planFile,JSON.stringify(plan));initial.campaign.scaleCampaign={campaignId:plan.campaignId,planHash:plan.planHash,manifestFile:planFile,manifestSha256:await hashFile(planFile),counts:plan.counts};await writeFile(campaignFile,JSON.stringify(initial));
  const clock={value:NOW},bridge=(fault)=>createScaleProgress({campaignFile,journalFile,now:()=>clock.value,fault});
  async function evidence(item=plan.items[0]){
    const folder=path.join(dir,item.id);await mkdir(folder,{recursive:true});const assets=[];
    for(let i=0;i<6;i++){const file=path.join(folder,'image-'+i+'.png');await writeFile(file,'test-only-'+item.id+'-'+i);assets.push({path:file,sha256:await hashFile(file),order:i+1});}
    const screenshot=path.join(folder,'preflight.png');await writeFile(screenshot,'test-only-native-form-evidence');
    const e={account:'saigomlia',location:item.location,caption:'Nhắn '+item.leadCode+' kèm ảnh bề mặt và vật liệu. Hỏi thông tin trước khi đặt.',assets,demoKind:'product_identity',authenticProductReferenceVerified:true,
      music:{soundId:'7611000000000000001',businessUseVerified:true,availableInAccount:true,selectedInUi:true,verifiedAt:clock.value},
      scheduleWindow:{verified:true,format:item.format,account:'saigomlia',verifiedAt:clock.value,earliest:'2026-10-29T00:00:00+07:00',latest:'2026-11-27T00:00:00+07:00'}};
    const postHash=scalePostHash(item,e);e.visualReview={verified:true,postHash,verifiedAt:clock.value};e.offerReview={verified:true,containsDiscount:false,postHash,verifiedAt:clock.value};
    e.preflight={verified:true,postHash,account:'saigomlia',format:item.format,audience:'Everyone',location:item.location,scheduledAt:item.proposedPublishAt,disclosures:{aiGenerated:true,ownBrand:true},verifiedAt:clock.value,evidence:{path:screenshot,sha256:await hashFile(screenshot)}};return e;
  }
  const readState=async()=>JSON.parse(await readFile(campaignFile,'utf8'));
  const receipt=(bound,changes={})=>({platformId:'7612000000000000001',status:'scheduled',account:'saigomlia',postHash:bound.postHash,scheduledAt:bound.proposedPublishAt??plan.items.find(i=>i.id===bound.id).proposedPublishAt,verifiedAt:clock.value,evidence:'Synthetic test-only observed native receipt',...changes});
  return {dir,campaignFile,planFile,journalFile,initial,plan,clock,bridge,evidence,readState,receipt,cleanup:()=>rm(dir,{recursive:true,force:true})};
}
test('status bootstraps canonical first schedule and legacy binding without creating a journal or resetting counts',async()=>{
  const f=await fixture();try{
    const item=f.plan.items[0],e=await f.evidence(),ready=await bindScaleCreative(item,e,{state:await f.readState(),now:NOW}),legacy=path.join(f.dir,'scale-ready.json');await writeFile(legacy,JSON.stringify(ready));
    const s=await f.readState();s.campaign.scaleCampaign.progressFile=legacy;s.queue.push({...item,phase:'scale',campaignId:f.plan.campaignId,status:'scheduled',publishAt:item.proposedPublishAt,scalePostHash:ready.postHash,receipt:{...f.receipt(ready),scheduledVerifiedAt:NOW}});await writeFile(f.campaignFile,JSON.stringify(s));
    const before=await readFile(f.campaignFile,'utf8'),status=await f.bridge().status();assert.equal(status.counts.scheduled,1);assert.equal(status.counts.planned,999);assert.equal(status.items.find(i=>i.id===item.id).source,'canonical');assert.equal(await readFile(f.campaignFile,'utf8'),before);
    await assert.rejects(stat(f.journalFile),{code:'ENOENT'});await assert.rejects(f.bridge().submitting(item.id),/accepted|uncertain|reconcil/i);
  }finally{await f.cleanup();}
});
test('bind is private, submitting durably records uncertainty and registers exactly one canonical item/cohort',async()=>{
  const f=await fixture();try{
    const b=f.bridge(),item=f.plan.items[0],before=await readFile(f.campaignFile,'utf8');const bound=await b.bind(item.id,await f.evidence());assert.equal(bound.status,'ready');assert.equal(await readFile(f.campaignFile,'utf8'),before);
    const submitted=await b.submitting(item.id);assert.equal(submitted.status,'submitting');const s=await f.readState();assert.equal(s.queue.length,2);assert.deepEqual(s.queue[0],f.initial.queue[0]);assert.equal(s.angles.length,1);assert.equal(s.queue[1].scalePostHash,bound.postHash);assert.equal(s.queue[1].audience,'Everyone');assert.equal(s.queue[1].disclosures.aiGenerated,true);
    assert.equal((await b.status()).counts.submitting,1);await assert.rejects(b.submitting(item.id),/uncertain|reconcil|already/i);assert.equal((await f.readState()).queue.length,2);
  }finally{await f.cleanup();}
});
test('real receipt replay is idempotent and scheduled/review/published progress never resets or changes platform identity',async()=>{
  const f=await fixture();try{
    const b=f.bridge(),item=f.plan.items[0],bound=await b.bind(item.id,await f.evidence());await b.submitting(item.id);const r=f.receipt(bound);
    assert.equal((await b.receipt(item.id,r)).status,'scheduled');const before=await readFile(f.journalFile,'utf8'),stateBefore=await readFile(f.campaignFile,'utf8');assert.equal((await b.receipt(item.id,r)).replayed,true);assert.equal(await readFile(f.journalFile,'utf8'),before);assert.equal(await readFile(f.campaignFile,'utf8'),stateBefore);
    f.clock.value='2026-10-29T01:03:00Z';const pending={...r,status:'under_review',submittedAt:'2026-10-29T08:00:00+07:00',verifiedAt:f.clock.value};assert.equal((await b.receipt(item.id,pending)).status,'under_review');
    const published={...r,status:'published',publishedAt:'2026-10-29T08:01:00+07:00',verifiedAt:f.clock.value};assert.equal((await b.receipt(item.id,published)).status,'published');
    assert.equal((await b.status()).counts.published,1);assert.equal((await b.status()).counts.scheduled,0);assert.equal((await b.receipt(item.id,r)).replayed,true);
    const s=await f.readState();assert.equal(s.posts.length,1);assert.equal(s.posts[0].id,r.platformId);assert.deepEqual(s.queue[0],f.initial.queue[0]);
    await assert.rejects(b.receipt(item.id,{...published,platformId:'7612000000000000002'}),/platform|identity|receipt/i);
  }finally{await f.cleanup();}
});
test('preflight fields and exact current bytes are checked before uncertain journal/canonical registration',async()=>{
  const f=await fixture();try{
    const b=f.bridge(),item=f.plan.items[0],e=await f.evidence();e.preflight.disclosures.aiGenerated=false;await b.bind(item.id,e);await assert.rejects(b.submitting(item.id),/disclosure/i);assert.equal((await f.readState()).queue.length,1);assert.equal((await b.status()).counts.submitting,0);
    e.preflight.disclosures.aiGenerated=true;await b.bind(item.id,e);await writeFile(e.assets[0].path,'changed bytes');await assert.rejects(b.submitting(item.id),/readiness|hash|asset/i);assert.equal((await f.readState()).queue.length,1);
  }finally{await f.cleanup();}
});
test('wrong account, audience, actual format window or unknown discount cannot pass a new submission',async()=>{
  const f=await fixture();try{
    const b=f.bridge(),item=f.plan.items[0],e=await f.evidence();e.preflight.audience='Only me';await b.bind(item.id,e);await assert.rejects(b.submitting(item.id),/audience/i);
    e.preflight.audience='Everyone';e.scheduleWindow.format='video';assert.equal((await b.bind(item.id,e)).status,'planned');
    e.scheduleWindow.format='photo';e.caption+=' Mua1tặng1 cho50đơn đầu tiên.';const h=scalePostHash(item,e);e.visualReview.postHash=h;e.offerReview.postHash=h;e.preflight.postHash=h;assert.equal((await b.bind(item.id,e)).status,'planned');await assert.rejects(b.submitting(item.id),/ready|readiness/i);assert.equal((await f.readState()).queue.length,1);
  }finally{await f.cleanup();}
});
test('journal-before-canonical interruption stays uncertain, never blindly retries, and a real receipt can reconcile it',async()=>{
  const f=await fixture();try{
    const item=f.plan.items[0],b=f.bridge();const bound=await b.bind(item.id,await f.evidence());const broken=f.bridge(stage=>{if(stage==='after_submitting_journal')throw Error('injected registration interruption');});
    await assert.rejects(broken.submitting(item.id),/interruption/);assert.equal((await f.readState()).queue.length,1);assert.equal((await b.status()).counts.submitting,1);await assert.rejects(b.submitting(item.id),/uncertain|reconcil/i);
    assert.equal((await b.receipt(item.id,f.receipt(bound))).status,'scheduled');assert.equal((await f.readState()).queue.length,2);
  }finally{await f.cleanup();}
});
test('receipt journal survives canonical interruption and exact replay finishes reconciliation once',async()=>{
  const f=await fixture();try{
    const item=f.plan.items[0],b=f.bridge(),bound=await b.bind(item.id,await f.evidence());await b.submitting(item.id);const r=f.receipt(bound),broken=f.bridge(stage=>{if(stage==='after_receipt_journal')throw Error('injected receipt interruption');});
    await assert.rejects(broken.receipt(item.id,r),/interruption/);assert.equal((await f.readState()).queue[1].status,'submitting');assert.equal((await b.status()).counts.scheduled,1);
    const replay=await b.receipt(item.id,r);assert.equal(replay.replayed,true);assert.equal((await f.readState()).queue[1].status,'scheduled');assert.equal((await f.readState()).queue.length,2);
  }finally{await f.cleanup();}
});
test('atomic journal write failure preserves old JSON and never starts a canonical submission',async()=>{
  const f=await fixture();try{
    const item=f.plan.items[0],b=f.bridge();await b.bind(item.id,await f.evidence());const before=await readFile(f.journalFile,'utf8'),broken=f.bridge(stage=>{if(stage==='before_journal_rename')throw Error('injected write failure');});
    await assert.rejects(broken.submitting(item.id),/write failure/);assert.equal(await readFile(f.journalFile,'utf8'),before);assert.equal((await f.readState()).queue.length,1);assert.equal((await b.status()).counts.ready,1);
  }finally{await f.cleanup();}
});
test('same-status receipt reverification remains pending until its new evidence reaches canonical state',async()=>{
  const f=await fixture();try{
    const item=f.plan.items[0],b=f.bridge(),bound=await b.bind(item.id,await f.evidence());await b.submitting(item.id);await b.receipt(item.id,f.receipt(bound));
    f.clock.value='2026-10-28T08:01:00Z';const newer=f.receipt(bound,{evidence:'New observed test proof',verifiedAt:f.clock.value}),broken=f.bridge(stage=>{if(stage==='after_receipt_journal')throw Error('interrupted re-verification');});
    await assert.rejects(broken.receipt(item.id,newer),/interrupted/);assert.notEqual((await f.readState()).queue[1].receipt.evidence,newer.evidence);
    assert.equal((await b.status()).items.find(r=>r.id===item.id).canonicalApplyPending,true);await b.receipt(item.id,newer);assert.equal((await f.readState()).queue[1].receipt.evidence,newer.evidence);
  }finally{await f.cleanup();}
});
test('concurrent submitting calls serialize and cannot create duplicate canonical records',async()=>{
  const f=await fixture();try{
    const item=f.plan.items[0],b=f.bridge();await b.bind(item.id,await f.evidence());const results=await Promise.allSettled([b.submitting(item.id),b.submitting(item.id)]);assert.equal(results.filter(r=>r.status==='fulfilled').length,1);assert.equal((await f.readState()).queue.length,2);assert.equal((await b.status()).counts.submitting,1);
  }finally{await f.cleanup();}
});
test('original plan tamper, journal tamper, duplicate platform and canonical identity conflicts fail closed',async()=>{
  const f=await fixture();try{
    const item=f.plan.items[0],b=f.bridge(),bound=await b.bind(item.id,await f.evidence());await b.submitting(item.id);
    await assert.rejects(b.receipt(item.id,f.receipt(bound,{platformId:f.initial.queue[0].receipt.platformId})),/platform|duplicate/i);
    const original=await readFile(f.planFile,'utf8');await writeFile(f.planFile,original+' ');await assert.rejects(b.status(),/plan|checksum/i);await writeFile(f.planFile,original);
    const journal=JSON.parse(await readFile(f.journalFile,'utf8'));journal.records[item.id].postHash='f'.repeat(64);await writeFile(f.journalFile,JSON.stringify(journal));await assert.rejects(b.status(),/integrity|checksum|journal/i);
  }finally{await f.cleanup();}
});
