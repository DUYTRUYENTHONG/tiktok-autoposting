import {readFile,writeFile,mkdir,open,rename,unlink,realpath,stat} from 'node:fs/promises';
import {randomUUID} from 'node:crypto';
import path from 'node:path';
import {loadState,updateState,defaultFile,root,hashFile} from './store.mjs';
import {bindScaleCreative,scalePostHash,scaleHash,validateScaleReceipt,collectScaleReservations} from './scale-campaign.mjs';
import {vietnamDay} from './daily-kpi.mjs';
import {isTenDayPolicy,tenDayReference,isVideoRolloutPolicy,videoRolloutReference,isMixedRolloutPolicy,mixedRolloutReference} from './ten-day-cadence.mjs';

const accepted=new Set(['scheduled','under_review','published']),rank={planned:0,ready:1,submitting:2,scheduled:3,under_review:4,published:5};
const validTime=value=>typeof value==='string'&&/T.*(?:Z|[+-]\d\d:\d\d)$/.test(value)&&Number.isFinite(Date.parse(value));
const sort=value=>Array.isArray(value)?value.map(sort):value&&typeof value==='object'?Object.fromEntries(Object.keys(value).sort().map(k=>[k,sort(value[k])])):value;
const digest=value=>scaleHash(sort(value));
const clone=value=>structuredClone(value);
const account=value=>String(value).replace(/^@/,'').toLowerCase();
const receiptHash=receipt=>digest(receipt);
const receiptCore=r=>({status:r.status,platformId:r.platformId,account:account(r.account),postHash:r.postHash,at:r.status==='scheduled'?r.scheduledAt:r.status==='published'?r.publishedAt:r.submittedAt,verifiedAt:r.verifiedAt,evidence:r.evidence});
const recordStatus=record=>record?.status??'planned';
const overrideDay='2026-10-30',rollingStart='2026-10-31',rollingEnd='2026-12-19',minute=60000;
const twentyFiftyReference='2026-10-31 user: continue to schedule20posts per day; schedule for50days first; set the goal again.';
const rollingKind='scale-rolling-policy';
const effectiveItem=(item,record)=>record?.scheduleRevision?{...item,proposedPublishAt:record.scheduleRevision.revisedPublishAt,scheduleRevision:clone(record.scheduleRevision)}:item;
function checkOverride(policy,plan){
  if(policy?.kind!=='scale-day-override'||policy.day!==overrideDay||policy.account!==plan.policy.account||policy.additionalAuthorized!==30||policy.dailyTotal!==40||policy.minSpacingMinutes!==5||policy.windowStart!=='08:00'||policy.windowEnd!=='23:55'||policy.source!=='user'||!validTime(policy.verifiedAt)||vietnamDay(policy.verifiedAt)!==overrideDay||policy.policyReference!=='2026-10-30 user: still need30posts more for today; answer Five-minute spacing tonight in call_f551da25c867465c87e34a607f80a12a')throw Error('Dated scale override policy mismatch');
}
function checkRollingPolicy(policy,plan){
  const old=policy?.endDay==='2026-11-29'&&policy.dailyTotal===30&&policy.targetTotal===900&&policy.targetPhoto===15&&policy.targetVideo===15&&policy.policyReference==='2026-10-31 user: we do need 30 posts per day. schedule it for the next 30 days.';
  const current=policy?.endDay==='2026-12-19'&&policy.dailyTotal===20&&policy.targetTotal===1000&&policy.targetPhoto===10&&policy.targetVideo===10&&policy.policyReference===twentyFiftyReference;
  const ten=isTenDayPolicy(policy),video=isVideoRolloutPolicy(policy),mixed=isMixedRolloutPolicy(policy),historical=policy?.startDay===rollingStart&&(old||current)&&policy.minSpacingMinutes===20;
  if(policy?.kind!==rollingKind||policy.account!==plan.policy.account||!(historical||ten||video||mixed)||policy.windowStart!=='08:00'||policy.windowEnd!=='22:15'||policy.timezone!=='Asia/Ho_Chi_Minh'||policy.source!=='user'||!validTime(policy.verifiedAt)||vietnamDay(policy.verifiedAt)!==(video||mixed?'2026-11-01':rollingStart))throw Error('Rolling scale policy mismatch');
}
function validRevisedTime(at,now){return validTime(at)&&/^2026-10-30T\d\d:\d\d:00\+07:00$/.test(at)&&at.slice(11,16)>='08:00'&&at.slice(11,16)<='23:55'&&Number(at.slice(14,16))%5===0&&Date.parse(at)>=Date.parse(now)+30*minute;}
function validRollingTime(at,now,policy){return validTime(at)&&/^\d{4}-\d\d-\d\dT\d\d:\d\d:00\+07:00$/.test(at)&&vietnamDay(at)>=(policy?.startDay??rollingStart)&&vietnamDay(at)<=(policy?.endDay??rollingEnd)&&at.slice(11,16)>='08:00'&&at.slice(11,16)<='22:15'&&Number(at.slice(14,16))%5===0&&Date.parse(at)>=Date.parse(now)+30*minute;}
const revisionKind=revision=>revision.policyKind??'scale-day-override';
function allocations(c,exceptId,day){
  const all=[];
  const safeState={...c.state,queue:(c.state.queue??[]).filter(q=>!['submitting','needs_review'].includes(q.status))};
  for(const r of collectScaleReservations(safeState))if(r.day===day)all.push({id:r.queueId,at:r.at,format:r.format,source:'accepted'});
  for(const q of c.state.queue??[]){if(!['submitting','needs_review','ready'].includes(q.status)||q.account&&account(q.account)!==c.plan.policy.account)continue;
    if(q.status==='needs_review')throw Error('Reconcile needs_review before a schedule revision');
    if(!validTime(q.publishAt))throw Error('Uncertain/ready canonical allocation has no valid time');
    if(vietnamDay(q.publishAt)===day)all.push({id:q.id,at:q.publishAt,format:q.format,source:q.status});
  }
  for(const item of c.plan.items){const r=c.j.records[item.id];if(!r||!['ready','submitting'].includes(r.status)&&!accepted.has(r.status)&&!r.scheduleRevision)continue;
    const effective=effectiveItem(item,r),receipt=r.receipts?.at(-1)?.receipt;
    const at=receipt?.status==='published'?receipt.publishedAt:receipt?.status==='under_review'?receipt.submittedAt:effective.proposedPublishAt;
    if(vietnamDay(at)!==day)continue;
    if(!all.some(a=>a.id===item.id))all.push({id:item.id,at,format:item.format,source:r.status});
  }
  const selected=all.filter(a=>a.id!==exceptId),seen=new Set();for(const a of selected){if(seen.has(a.id))throw Error('Duplicate date allocation');seen.add(a.id);}
  return selected;
}
function checkAllocation(c,id,at,policy){const active=c.state.campaign?.rollingGoal;if(policy.kind===rollingKind&&active&&policy.policyReference!==active.policyReference)throw Error('Use the latest registered rolling policy for a new allocation');if(isTenDayPolicy(policy)&&c.plan.items.find(i=>i.id===id)?.format!=='photo')throw Error('Current ten-day campaign accepts photo intents only');if(isVideoRolloutPolicy(policy)&&c.plan.items.find(i=>i.id===id)?.format!=='video')throw Error('Current November campaign accepts new video intents only');const day=vietnamDay(at),all=[...allocations(c,id,day),{id,at,format:c.plan.items.find(i=>i.id===id)?.format,source:'candidate'}].sort((a,b)=>Date.parse(a.at)-Date.parse(b.at)),cap=policy.kind===rollingKind&&active?Math.min(policy.dailyTotal,active.dailyTarget):policy.dailyTotal;if(isMixedRolloutPolicy(policy)){const format=c.plan.items.find(i=>i.id===id)?.format,limit=format==='photo'?policy.targetPhoto:policy.targetVideo;if(all.filter(a=>a.format===format).length>limit)throw Error('Rolling format cap exceeded');}if(all.length>cap)throw Error(policy.kind===rollingKind?'Rolling daily cap exceeded':'Override daily cap exceeded');for(let i=1;i<all.length;i++)if(Date.parse(all[i].at)-Date.parse(all[i-1].at)<policy.minSpacingMinutes*minute&&(policy.kind!==rollingKind||all[i].source!=='accepted'||all[i-1].source!=='accepted'))throw Error(policy.kind===rollingKind?'Rolling '+policy.minSpacingMinutes+'-minute spacing conflict':'Override five-minute spacing conflict');}

async function json(file){if((await stat(file)).size>64*1024*1024)throw Error('Progress input exceeds64MB');return JSON.parse(await readFile(file,'utf8'));}
async function privateFile(file){
  if(!path.isAbsolute(file))throw Error('Progress journal requires an absolute private path');
  let parent=file,suffix=[];
  for(;;){try{parent=await realpath(parent);break;}catch(error){if(error.code!=='ENOENT')throw error;suffix.unshift(path.basename(parent));const next=path.dirname(parent);if(next===parent)throw error;parent=next;}}
  const resolved=path.join(parent,...suffix),checkout=(await realpath(root)).toLowerCase();
  if(resolved.toLowerCase()===checkout||resolved.toLowerCase().startsWith(checkout+path.sep))throw Error('Progress journals must stay outside the Git checkout');return resolved;
}
function validateBound(item,bound){
  if(bound?.id!==item.id||bound.intentHash!==item.intentHash||bound.status!=='ready'||bound.readiness?.ready!==true||!bound.boundCreative||scalePostHash(item,bound.boundCreative)!==bound.postHash)throw Error('Bound scale intent/postHash mismatch');return bound;
}
function checkJournal(j,plan,meta){
  const {integrityHash,...body}=j;
  if(j.kind!=='scale-progress'||j.version!==1||j.planHash!==plan.planHash||j.manifestSha256!==meta.manifestSha256||j.campaignId!==plan.campaignId||digest(body)!==integrityHash)throw Error('Progress journal integrity/plan checksum mismatch');
  let previous='0'.repeat(64);
  for(const [i,event] of j.events.entries()){const {eventHash,...payload}=event;if(event.seq!==i+1||event.previousHash!==previous||digest(payload)!==eventHash)throw Error('Progress journal event chain mismatch');previous=eventHash;}
  if(j.revision!==j.events.length||(j.events.length&&j.events.at(-1).recordsHash!==digest(j.records)))throw Error('Progress journal record checksum mismatch');
  const items=new Map(plan.items.map(i=>[i.id,i]));
  for(const [id,r] of Object.entries(j.records)){const item=items.get(id);if(!item||r.id!==id||!(r.status in rank))throw Error('Unknown progress intent/status');
    const history=r.scheduleRevisionHistory??[];
    if(!Array.isArray(history)||history.length&&!r.scheduleRevision)throw Error('Progress revision history mismatch');
    if(r.scheduleRevision){const revisions=[...history,r.scheduleRevision];for(const [index,revision] of revisions.entries()){
      const kind=revisionKind(revision),prior=revisions[index-1],samePolicy=prior&&revision.policyFile===prior.policyFile&&revision.policySha256===prior.policySha256&&revision.policyReference===prior.policyReference;
      if(revision.originalPublishAt!==item.proposedPublishAt||revision.originalIntentHash!==item.intentHash||revision.account!==item.account||!validTime(revision.recordedAt)||kind==='scale-day-override'&&(vietnamDay(revision.recordedAt)!==overrideDay||!validRevisedTime(revision.revisedPublishAt,revision.recordedAt))||kind===rollingKind&&(vietnamDay(revision.recordedAt)<rollingStart||vietnamDay(revision.recordedAt)>rollingEnd||!validRollingTime(revision.revisedPublishAt,revision.recordedAt))||!['scale-day-override',rollingKind].includes(kind)||index>0&&(revision.supersedesRevisionHash!==digest(prior)||!(samePolicy||revisionKind(prior)==='scale-day-override'&&kind===rollingKind||kind===rollingKind&&[videoRolloutReference,mixedRolloutReference].includes(revision.policyReference)&&Date.parse(prior.recordedAt)<=Date.parse(revision.recordedAt))))throw Error('Progress schedule revision history/identity mismatch');
    }}if(r.boundReady)validateBound(effectiveItem(item,r),r.boundReady);
  }
}
function addEvent(j,action,id,at){
  const event={seq:j.events.length+1,action,id,at,previousHash:j.events.at(-1)?.eventHash??'0'.repeat(64),recordsHash:digest(j.records)};event.eventHash=digest(event);j.events.push(event);j.revision=j.events.length;
}
function countsFor(plan,records){
  const counts={photo:plan.items.filter(i=>i.format==='photo').length,video:plan.items.filter(i=>i.format==='video').length,planned:0,ready:0,submitting:0,scheduled:0,under_review:0,published:0};
  for(const item of plan.items)counts[recordStatus(records[item.id])]++;return counts;
}
function normalizeCanonicalReceipt(q,item){
  const r=q.receipt;if(!r?.platformId)return null;
  if(r.postHash&&r.postHash!==(q.scalePostHash??q.postHash)||r.account&&account(r.account)!==account(q.account))throw Error('Canonical receipt account/postHash conflict');
  const verifiedAt=q.status==='published'?r.publishedVerifiedAt??r.verifiedAt:q.status==='scheduled'?r.scheduledVerifiedAt??r.verifiedAt:r.submittedVerifiedAt??r.verifiedAt;
  const normalized={...r,platformId:String(r.platformId),status:q.status,account:q.account,postHash:q.scalePostHash??q.postHash,verifiedAt,evidence:r.evidence??r.studioEvidence??r.verificationSource};
  const time=q.status==='scheduled'?r.scheduledAt:q.status==='published'?r.publishedAt:r.submittedAt??r.submittedVerifiedAt;
  if(!/^\d{10,25}$/.test(normalized.platformId)||!validTime(verifiedAt)||!validTime(time)||!normalized.evidence||q.status!=='scheduled'&&Date.parse(time)>Date.parse(verifiedAt))throw Error('Canonical scale receipt needs reconciliation: '+q.id);
  if(q.status==='scheduled'&&Date.parse(time)!==Date.parse(item.proposedPublishAt))throw Error('Canonical scale schedule differs from immutable intent');
  if(q.status==='under_review')normalized.submittedAt=time;return normalized;
}
function canonicalIdentity(q,item,plan){
  if(q.phase!=='scale'||q.campaignId!==plan.campaignId||account(q.account)!==item.account||q.productId!==item.productId||q.format!==item.format||q.leadCode!==item.leadCode||Date.parse(q.publishAt)!==Date.parse(item.proposedPublishAt)||q.location!==item.location||q.intentHash&&q.intentHash!==item.intentHash||item.scheduleRevision&&q.scheduleRevisionHash!==digest(item.scheduleRevision))throw Error('Canonical scale identity conflict: '+item.id);
}
function mergeCanonical(j,state,plan,bindings){
  const byId=new Map(plan.items.map(i=>[i.id,effectiveItem(i,j.records[i.id])]));
  for(const q of state.queue??[]){const item=byId.get(q.id);if(!item)continue;canonicalIdentity(q,item,plan);
    const hash=q.scalePostHash??q.postHash,prior=j.records[q.id],binding=prior?.boundReady??bindings.get(q.id);
    if((q.status==='submitting'||accepted.has(q.status))&&!/^[a-f0-9]{64}$/.test(hash??''))throw Error('Canonical scale postHash missing: '+q.id);
    if(prior?.postHash&&hash&&prior.postHash!==hash)throw Error('Canonical/journal postHash conflict: '+q.id);
    if(binding&&hash&&binding.postHash!==hash)throw Error('Legacy/canonical binding conflict');
    const status=accepted.has(q.status)||q.status==='submitting'?q.status:q.status==='ready'&&binding?'ready':'planned';
    const r=prior??{id:q.id,status:'planned',postHash:hash??null,receipts:[],source:'canonical'};
    if(binding)r.boundReady=clone(binding);
    if(accepted.has(status)){
      const receipt=normalizeCanonicalReceipt(q,item),previous=r.receipts.at(-1)?.receipt;
      if(previous&&previous.platformId!==receipt.platformId)throw Error('Canonical platform identity conflicts with progress receipt');
      if(rank[status]>rank[r.status]||(rank[status]===rank[r.status]&&(!previous||Date.parse(receipt.verifiedAt)>=Date.parse(previous.verifiedAt)))){r.status=status;r.postHash=hash;r.source='canonical';const h=receiptHash(receipt);if(!r.receipts.some(x=>x.hash===h))r.receipts.push({hash:h,receipt,source:'canonical'});}
    }else if(rank[status]>=rank[r.status]){r.status=status;r.postHash=hash??r.postHash;r.source='canonical';}
    r.canonicalStatus=q.status;r.canonicalPresent=true;
    r.canonicalMatchesTransaction=r.transaction?.kind==='receipt'?Boolean(q.receipt&&digest(receiptCore(normalizeCanonicalReceipt(q,item)))===digest(receiptCore(r.receipts.at(-1).receipt))):q.status===r.status;
    j.records[q.id]=r;
  }
  const owners=new Map();for(const r of Object.values(j.records)){const platform=r.receipts.at(-1)?.receipt.platformId;if(!platform)continue;if(owners.has(platform)&&owners.get(platform)!==r.id)throw Error('Conflicting scale platform ownership');owners.set(platform,r.id);}
  for(const q of state.queue??[]){const owner=owners.get(String(q.receipt?.platformId));if(owner&&owner!==q.id)throw Error('Duplicate platform ID in canonical queue');}
  for(const p of state.posts??[]){const owner=owners.get(String(p.id));if(owner&&p.queueId!==owner)throw Error('Duplicate or unowned platform ID in published observations');}
}
function filteredState(state,id,platformId){return {...state,queue:(state.queue??[]).filter(q=>q.id!==id),posts:(state.posts??[]).filter(p=>!(p.queueId===id&&String(p.id)===platformId))};}
function validateTransition(item,record,receipt,state,now){
  if(!record.boundReady)throw Error('Original hash-bound ready evidence unavailable; reconcile the legacy binding first');
  const bound=validateBound(item,record.boundReady),prior=record.receipts.at(-1)?.receipt;
  if(receipt.postHash!==record.postHash)throw Error('Receipt postHash mismatch');
  if(prior&&receipt.platformId!==prior.platformId)throw Error('Accepted platform identity cannot change');
  const allowed={submitting:['scheduled','under_review','published'],scheduled:['scheduled','under_review','published'],under_review:['under_review','published'],published:['published']};
  if(!allowed[record.status]?.includes(receipt.status))throw Error('Receipt transition would regress or has no uncertain submission');
  if(prior&&Date.parse(receipt.verifiedAt)<Date.parse(prior.verifiedAt))throw Error('Older receipt cannot replace a later observation');
  const e=bound.boundCreative;
  if(receipt.caption!==undefined&&receipt.caption!==e.caption||receipt.location!==undefined&&receipt.location!==item.location||receipt.format!==undefined&&receipt.format!==item.format||receipt.leadCode!==undefined&&receipt.leadCode!==item.leadCode||receipt.assetHashes!==undefined&&digest(receipt.assetHashes)!==digest(e.assets.map(a=>a.sha256))||receipt.music?.soundId!==undefined&&receipt.music.soundId!==e.music.soundId||e.music.soundId===null&&receipt.music&&['title','artist','duration','language','identitySource'].some(key=>receipt.music[key]!==undefined&&receipt.music[key]!==e.music[key]))throw Error('Receipt contradicts hash-bound creative/preflight fields');
  const clean=filteredState(state,item.id,receipt.platformId);
  // A real delayed live observation is retained after an already accepted platform ID.
  if(prior&&receipt.status==='published'&&vietnamDay(receipt.publishedAt)!==vietnamDay(item.proposedPublishAt)){
    if(receipt.platformId!==prior.platformId||account(receipt.account)!==item.account||!validTime(receipt.verifiedAt)||Date.parse(receipt.verifiedAt)>Date.parse(now)||!validTime(receipt.publishedAt)||Date.parse(receipt.publishedAt)>Date.parse(receipt.verifiedAt)||vietnamDay(receipt.publishedAt)<vietnamDay(item.proposedPublishAt)||!receipt.evidence)throw Error('Invalid delayed publication observation');
    if(clean.queue.some(q=>String(q.receipt?.platformId)===receipt.platformId)||clean.posts.some(p=>String(p.id)===receipt.platformId))throw Error('Duplicate platform ID');
  }else validateScaleReceipt(bound,receipt,clean,{now});
  return receipt;
}
async function preflight(item,bound,state,now){
  const fresh=await bindScaleCreative(item,bound.boundCreative,{state,now});if(!fresh.readiness.ready||fresh.postHash!==bound.postHash)throw Error('Fresh readiness/hash check failed: '+fresh.readiness.blockers.join(', '));
  const p=bound.boundCreative.preflight;
  if(p?.verified!==true||p.postHash!==bound.postHash||p.account!==item.account||p.format!==item.format||p.location!==item.location||p.scheduledAt!==item.proposedPublishAt)throw Error('Actual preflight account/format/location/time/postHash mismatch');
  if(p.audience!=='Everyone')throw Error('Actual public audience preflight missing');
  if(p.disclosures?.aiGenerated!==true||p.disclosures?.ownBrand!==true)throw Error('Actual AI/own-brand disclosures preflight missing');
  if(!validTime(p.verifiedAt)||Date.parse(p.verifiedAt)>Date.parse(now)||Date.parse(now)-Date.parse(p.verifiedAt)>10*60000)throw Error('Actual preflight is stale');
  if(!path.isAbsolute(p.evidence?.path??'')||!/^[a-f0-9]{64}$/.test(p.evidence?.sha256??'')||await hashFile(p.evidence.path)!==p.evidence.sha256)throw Error('Preflight evidence hash mismatch');
  if(bound.boundCreative.scheduleWindow?.format!==item.format)throw Error('Native scheduling window is not verified for this format');
  return fresh;
}
function angleFor(item){return {id:'angle-'+item.id,name:item.creative.hook,productId:item.productId,format:item.format,distribution:'organic',promotionKey:'evergreen-no-discount',status:'untested',sourceHypothesisId:item.creative.sourceHypothesisId};}
function checkCohort(state,item){
  if(!(state.products??[]).some(p=>p.id===item.productId))throw Error('Canonical product missing');
  const angle=angleFor(item),existing=state.angles?.find(a=>a.id===angle.id);
  if(existing&&['productId','format','distribution','promotionKey'].some(k=>existing[k]!==angle[k]))throw Error('Scale angle/cohort conflict');
}
export function observedScalePromotion(bound){
  const e=bound?.boundCreative;
  if(e?.offerReview?.containsDiscount===false)return {promotionKey:'evergreen-no-discount',discountIncluded:false};
  if(e?.offerReview?.containsDiscount===true&&e.contactOfferLedger&&e.offerReview.conditionalOfferDisclosureVerified===true&&e.offerReview.containsRemainingCountClaim===false)return {promotionKey:'buy1-get1-first50-tiktok-contacts',discountIncluded:true};
  return {promotionKey:'unknown',discountIncluded:e?.offerReview?.containsDiscount===true?true:null};
}
function queueItem(item,bound,at){const e=bound.boundCreative;return {id:item.id,phase:'scale',campaignId:item.campaignId,account:item.account,productId:item.productId,angleId:angleFor(item).id,variantId:item.format==='photo'?(e.photoStory?'scale-native-five-photo':'scale-evergreen-six'):'scale-evergreen-video',format:item.format,title:item.creative.hook,caption:e.caption,leadCode:item.leadCode,publishMode:'scheduled',publishAt:item.proposedPublishAt,timezone:'Asia/Ho_Chi_Minh',location:item.location,...observedScalePromotion(bound),assets:clone(e.assets),approved:true,assetsVerified:true,status:'submitting',scalePostHash:bound.postHash,intentHash:item.intentHash,...(item.scheduleRevision?{scheduleRevisionHash:digest(item.scheduleRevision)}:{}),music:clone(e.music),audience:'Everyone',disclosures:{aiGenerated:true,ownBrand:true},scalePreflight:clone(e.preflight),submissionStartedAt:at,receipt:null};}

export function createScaleProgress({campaignFile=defaultFile,journalFile,now=()=>new Date().toISOString(),fault=()=>{}}={}){
  const clock=()=>{const value=now();if(!validTime(value))throw Error('Invalid progress clock');return value;};
  async function context(){
    const state=await loadState(campaignFile),meta=state.campaign?.scaleCampaign;
    if(!meta?.planHash||!meta.manifestFile||!meta.manifestSha256||await hashFile(meta.manifestFile)!==meta.manifestSha256)throw Error('Registered immutable scale plan checksum missing/mismatched');
    const plan=await json(meta.manifestFile);
    if(plan.planHash!==meta.planHash||plan.campaignId!==meta.campaignId||plan.items?.length!==1000||plan.items.filter(i=>i.format==='photo').length!==500||plan.items.filter(i=>i.format==='video').length!==500)throw Error('Registered scale plan identity/count mismatch');
    const file=await privateFile(journalFile??path.join(path.dirname(meta.manifestFile),'progress-'+plan.planHash.slice(0,16)+'.json'));
    let j,exists=true;try{j=await json(file);checkJournal(j,plan,meta);}catch(error){if(error.code!=='ENOENT')throw error;exists=false;j={kind:'scale-progress',version:1,campaignId:plan.campaignId,planHash:plan.planHash,manifestSha256:meta.manifestSha256,revision:0,records:{},events:[]};}
    const bindings=new Map();for(const candidate of [...new Set([meta.progressFile,...(meta.legacyProgressFiles??[])].filter(Boolean))]){
      const source=path.isAbsolute(candidate)?candidate:path.resolve(root,candidate);if(path.resolve(source)===path.resolve(file))continue;
      try{const b=await json(source),item=plan.items.find(i=>i.id===b.id);if(item&&b.boundCreative){validateBound(item,b);bindings.set(item.id,b);}}catch(error){if(error.code!=='ENOENT')throw error;}
    }
    const policies=new Map();for(const r of Object.values(j.records))for(const revision of [...(r.scheduleRevisionHistory??[]),...(r.scheduleRevision?[r.scheduleRevision]:[])]){const key=revision.policyFile+'|'+revision.policySha256;if(!policies.has(key)){if(!path.isAbsolute(revision.policyFile)||await privateFile(revision.policyFile)!==revision.policyFile||await hashFile(revision.policyFile)!==revision.policySha256)throw Error('Schedule policy attestation checksum mismatch');const policy=await json(revision.policyFile);if(revisionKind(revision)===rollingKind)checkRollingPolicy(policy,plan);else checkOverride(policy,plan);policies.set(key,policy);}const policy=policies.get(key);if(policy.policyReference!==revision.policyReference||revisionKind(revision)===rollingKind&&Date.parse(policy.verifiedAt)>Date.parse(revision.recordedAt))throw Error('Schedule policy reference/verification mismatch');}
    for(const r of Object.values(j.records))for(const revision of [...(r.scheduleRevisionHistory??[]),...(r.scheduleRevision?[r.scheduleRevision]:[])])if(revisionKind(revision)===rollingKind){const policy=policies.get(revision.policyFile+'|'+revision.policySha256);if(!validRollingTime(revision.revisedPublishAt,revision.recordedAt,policy)||vietnamDay(revision.recordedAt)>policy.endDay)throw Error('Revision exceeds its own rolling policy window');}
    mergeCanonical(j,state,plan,bindings);return {state,meta,plan,file,j,exists,policies};
  }
  async function save(c,action,id){addEvent(c.j,action,id,clock());const {integrityHash,...body}=c.j,payload={...body,integrityHash:digest(body)};
    await mkdir(path.dirname(c.file),{recursive:true});const temp=c.file+'.'+randomUUID()+'.tmp';let handle;
    try{handle=await open(temp,'wx',0o600);await handle.writeFile(JSON.stringify(payload,null,2),'utf8');await handle.sync();await handle.close();handle=null;await fault('before_journal_rename');await rename(temp,c.file);c.j=payload;c.exists=true;}
    catch(error){await handle?.close().catch(()=>{});await unlink(temp).catch(()=>{});throw error;}
  }
  async function locked(fn){const initial=await context();await mkdir(path.dirname(initial.file),{recursive:true});let lock;
    for(let i=0;i<80;i++){try{lock=await open(initial.file+'.lock','wx');break;}catch(error){if(error.code!=='EEXIST')throw error;await new Promise(resolve=>setTimeout(resolve,25));}}
    if(!lock)throw Error('Scale progress is locked by another owner; reconcile before retrying');
    try{const c=await context();if(c.file!==initial.file||c.plan.planHash!==initial.plan.planHash)throw Error('Registered goal changed during progress lock');return await fn(c);}
    finally{await lock.close();await unlink(initial.file+'.lock');}
  }
  const itemFor=(c,id)=>{const item=c.plan.items.find(i=>i.id===id);if(!item)throw Error('Unknown immutable scale intent');return effectiveItem(item,c.j.records[id]);};
  const policyForItem=(c,item)=>{const revision=item.scheduleRevision;if(!revision)return null;const policy=c.policies.get(revision.policyFile+'|'+revision.policySha256);if(!policy)throw Error('Schedule policy unavailable');return policy;};
  function snapshot(c){return {campaignId:c.plan.campaignId,planHash:c.plan.planHash,journalFile:c.file,journalExists:c.exists,counts:countsFor(c.plan,c.j.records),items:c.plan.items.map(item=>{const r=c.j.records[item.id];return {id:item.id,status:recordStatus(r),postHash:r?.postHash??null,platformId:r?.receipts?.at(-1)?.receipt.platformId??null,source:r?.source??'original_plan',bindingAvailable:Boolean(r?.boundReady),originalPublishAt:item.proposedPublishAt,effectivePublishAt:r?.scheduleRevision?.revisedPublishAt??item.proposedPublishAt,revisionHash:r?.scheduleRevision?digest(r.scheduleRevision):null,revisionCount:r?.scheduleRevision?1+(r.scheduleRevisionHistory?.length??0):0,canonicalApplyPending:r?.transaction?.canonicalApplied===false&&!r.canonicalMatchesTransaction,journalAcknowledgementPending:r?.transaction?.canonicalApplied===false&&r.canonicalMatchesTransaction===true};})};}
  function assertMeta(state,c){const m=state.campaign?.scaleCampaign;if(m?.planHash!==c.meta.planHash||m.manifestSha256!==c.meta.manifestSha256||m.manifestFile!==c.meta.manifestFile)throw Error('Registered immutable goal changed');}
  function metadata(state,c){const previous=state.campaign.scaleCampaign;return {...previous,progressFile:c.file,legacyProgressFiles:[...new Set([...(previous.legacyProgressFiles??[]),...(previous.progressFile&&previous.progressFile!==c.file?[previous.progressFile]:[])])],counts:countsFor(c.plan,c.j.records),status:'rolling_campaign_in_progress'};}
  async function applyCanonical(c,item,record,receipt){
    const current=await loadState(campaignFile),own=current.queue?.find(q=>q.id===item.id);assertMeta(current,c);
    if(receipt&&own&&accepted.has(own.status)&&own.scalePostHash===record.postHash&&digest(receiptCore(normalizeCanonicalReceipt(own,item)))===digest(receiptCore(receipt)))return;
    await updateState(async state=>{
      assertMeta(state,c);checkCohort(state,item);let q=state.queue?.find(q=>q.id===item.id);state.queue??=[];state.angles??=[];
      if(q)canonicalIdentity(q,item,c.plan);
      if(!q){q=queueItem(item,record.boundReady,record.startedAt??clock());state.queue.push(q);}
      if(!state.angles.some(a=>a.id===q.angleId))state.angles.push({...angleFor(item),id:q.angleId});
      if(q.scalePostHash&&q.scalePostHash!==record.postHash)throw Error('Canonical postHash changed during reconciliation');
      if(receipt){
        validateTransition(item,{...record,status:record.beforeReceiptStatus??record.status,receipts:record.receipts.filter(r=>r.hash!==receiptHash(receipt))},receipt,state,clock());
        if(q.receipt&&q.receipt.platformId!==receipt.platformId)throw Error('Canonical platform identity changed');
        q.receiptHistory??=[];if(q.receipt&&digest(q.receipt)!==digest(receipt))q.receiptHistory.push(clone(q.receipt));
        q.receipt={...q.receipt,...clone(receipt),...(receipt.status==='scheduled'?{scheduledVerifiedAt:receipt.verifiedAt}:receipt.status==='published'?{publishedVerifiedAt:receipt.verifiedAt}:{submittedVerifiedAt:receipt.verifiedAt})};q.status=receipt.status;Object.assign(q,observedScalePromotion(record.boundReady));
        if(receipt.status==='published'){
          state.posts??=[];const post={id:receipt.platformId,queueId:item.id,productId:item.productId,angleId:q.angleId,variantId:q.variantId,format:item.format,publishedAt:receipt.publishedAt,distribution:'organic',...observedScalePromotion(record.boundReady),...(receipt.url?{url:receipt.url}:{})};
          const prior=state.posts.find(p=>String(p.id)===receipt.platformId);if(prior&&['queueId','productId','format','publishedAt'].some(k=>prior[k]!==post[k]))throw Error('Published observation conflict');if(!prior)state.posts.push(post);
        }
      }
      state.campaign.scaleCampaign=metadata(state,c);return state;
    },campaignFile);
  }
  return {
    async status(){return snapshot(await context());},
    async revise(id,input){return locked(async c=>{const original=c.plan.items.find(i=>i.id===id);if(!original)throw Error('Unknown immutable scale intent');const prior=c.j.records[id];if(prior&&(['submitting','scheduled','under_review','published'].includes(prior.status)||prior.transaction||prior.receipts?.length))throw Error('Accepted/uncertain intent cannot be revised');if(c.state.queue?.some(q=>q.id===id)||c.state.posts?.some(p=>p.queueId===id))throw Error('Registered intent cannot be revised');
      if(input?.account!==original.account||input.originalIntentHash!==original.intentHash||input.intentId!==id||typeof input.policyFile!=='string'||!path.isAbsolute(input.policyFile)||!/^[a-f0-9]{64}$/.test(input.policySha256??''))throw Error('Revision identity or attestation missing');
      const policyFile=await privateFile(input.policyFile);if(policyFile!==input.policyFile||await hashFile(policyFile)!==input.policySha256)throw Error('Revision policy checksum mismatch');const policy=await json(policyFile);if(policy.kind===rollingKind)checkRollingPolicy(policy,c.plan);else checkOverride(policy,c.plan);
      const at=clock(),rolling=policy.kind===rollingKind;if(rolling?!validRollingTime(input.revisedPublishAt,at,policy)||vietnamDay(at)<rollingStart||vietnamDay(at)>policy.endDay||Date.parse(policy.verifiedAt)>Date.parse(at):vietnamDay(at)!==overrideDay||!validRevisedTime(input.revisedPublishAt,at))throw Error('Revised time is outside authorized date/window or too near');
      if(prior?.scheduleRevision){const previous=prior.scheduleRevision,samePolicy=previous.policyFile===policyFile&&previous.policySha256===input.policySha256,tenDayMigration=rolling&&[tenDayReference,videoRolloutReference,mixedRolloutReference].includes(policy.policyReference)&&c.state.campaign?.rollingGoal?.policyReference===policy.policyReference&&revisionKind(previous)===rollingKind&&Date.parse(previous.recordedAt)<=Date.parse(policy.verifiedAt);if(previous.revisedPublishAt===input.revisedPublishAt||!(samePolicy||revisionKind(previous)==='scale-day-override'&&rolling||tenDayMigration))throw Error('Re-revision requires the same policy or authorized rolling migration and a new slot');}
      if(!rolling&&!prior?.scheduleRevision&&Object.values(c.j.records).filter(r=>r.scheduleRevision?.revisedPublishAt?.startsWith(overrideDay)).length>=30)throw Error('Thirty additional revisions already allocated');checkAllocation(c,id,input.revisedPublishAt,policy);
      const history=prior?.scheduleRevision?[...(prior.scheduleRevisionHistory??[]),clone(prior.scheduleRevision)]:[];
      const revision={account:original.account,originalIntentHash:original.intentHash,originalPublishAt:original.proposedPublishAt,revisedPublishAt:input.revisedPublishAt,policyFile,policySha256:input.policySha256,policyReference:policy.policyReference,recordedAt:at,...(rolling?{policyKind:rollingKind}:{}),...(prior?.scheduleRevision?{supersedesRevisionHash:digest(prior.scheduleRevision)}:{})};
      c.j.records[id]={id,status:'planned',postHash:null,boundReady:null,bindingDraft:null,receipts:[],source:'journal',scheduleRevision:revision,...(history.length?{scheduleRevisionHistory:history}:{})};await save(c,history.length?'rerevise':'revise',id);return {id,status:'planned',originalIntentHash:original.intentHash,originalPublishAt:original.proposedPublishAt,effectivePublishAt:revision.revisedPublishAt,revisionHash:digest(revision),revisionCount:history.length+1,counts:countsFor(c.plan,c.j.records)};
    });},
    async bind(id,evidence){return locked(async c=>{const item=itemFor(c,id),previous=c.j.records[id];if(previous&&(previous.status==='submitting'||accepted.has(previous.status)))throw Error('Accepted/uncertain scale intent requires reconciliation, not rebinding');
      if(item.scheduleRevision)checkAllocation(c,id,item.proposedPublishAt,policyForItem(c,item));
      const bound=await bindScaleCreative(item,evidence,{state:c.state,now:clock()});if(evidence.scheduleWindow?.format!==item.format){bound.status='planned';bound.readiness.ready=false;bound.readiness.blockers.push('actual_native_window_format_missing');}
      c.j.records[id]={id,status:bound.status,postHash:bound.postHash,boundReady:bound.status==='ready'?clone(bound):null,bindingDraft:bound.status==='ready'?null:clone(bound),receipts:[],source:'journal',...(item.scheduleRevision?{scheduleRevision:item.scheduleRevision,scheduleRevisionHistory:clone(previous?.scheduleRevisionHistory??[])}:{})};await save(c,'bind',id);return {id,status:bound.status,postHash:bound.postHash,blockers:bound.readiness.blockers,counts:countsFor(c.plan,c.j.records)};
    });},
    async submitting(id){return locked(async c=>{const item=itemFor(c,id),record=c.j.records[id];if(record&&(record.status==='submitting'||accepted.has(record.status)))throw Error('Uncertain/accepted submission: reconcile UI; blind retry refused');if(record?.status!=='ready'||!record.boundReady)throw Error('A ready bound intent is required');
      const at=clock();if(item.scheduleRevision)checkAllocation(c,id,item.proposedPublishAt,policyForItem(c,item));await preflight(item,record.boundReady,c.state,at);checkCohort(c.state,item);
      if(c.state.queue?.some(q=>q.id===id))throw Error('Existing canonical target requires reconciliation');
      record.status='submitting';record.startedAt=at;record.transaction={kind:'submitting',canonicalApplied:false};await save(c,'submitting',id);await fault('after_submitting_journal');
      await updateState(async state=>{assertMeta(state,c);const fresh={...c,state};if(item.scheduleRevision)checkAllocation(fresh,id,item.proposedPublishAt,policyForItem(c,item));await preflight(item,record.boundReady,state,clock());checkCohort(state,item);if(state.queue?.some(q=>q.id===id))throw Error('Canonical target changed during registration');state.queue??=[];state.angles??=[];state.queue.push(queueItem(item,record.boundReady,at));if(!state.angles.some(a=>a.id===angleFor(item).id))state.angles.push(angleFor(item));state.campaign.scaleCampaign=metadata(state,c);return state;},campaignFile);
      await fault('after_submitting_canonical');record.transaction.canonicalApplied=true;await save(c,'canonical_registered',id);return {id,status:'submitting',postHash:record.postHash,uncertain:true,canonicalRegistered:true,counts:countsFor(c.plan,c.j.records)};
    });},
    async receipt(id,receipt){return locked(async c=>{const item=itemFor(c,id),record=c.j.records[id];if(!record)throw Error('No recorded uncertain submission or canonical receipt to reconcile');const h=receiptHash(receipt),seen=record.receipts.find(r=>r.hash===h);
      if(seen){
        if(record.transaction?.canonicalApplied===false&&record.transaction.kind==='receipt'){await applyCanonical(c,item,record,record.receipts.at(-1).receipt);record.transaction.canonicalApplied=true;delete record.beforeReceiptStatus;await save(c,'receipt_reconciled',id);}
        return {id,status:record.status,platformId:record.receipts.at(-1).receipt.platformId,replayed:true,counts:countsFor(c.plan,c.j.records)};
      }
      validateTransition(item,record,receipt,c.state,clock());const before=record.status;record.status=receipt.status;record.beforeReceiptStatus=before;record.receipts.push({hash:h,receipt:clone(receipt),source:'operator'});record.source='journal';delete record.canonicalMatchesTransaction;record.transaction={kind:'receipt',canonicalApplied:false};await save(c,'receipt_observed',id);await fault('after_receipt_journal');
      await applyCanonical(c,item,record,receipt);await fault('after_receipt_canonical');record.transaction.canonicalApplied=true;delete record.beforeReceiptStatus;await save(c,'receipt_applied',id);return {id,status:record.status,platformId:receipt.platformId,replayed:false,counts:countsFor(c.plan,c.j.records)};
    });}
  };
}
