import {buildIndex,loadIndex,hash,retrieve,createKnowledgePipeline} from './index.mjs';
import {containsDiscount} from '../scale-campaign.mjs';

const scope='required-source-evidence-coverage-only',mode='offline-evergreen-production-grounding';
const requirements=Object.freeze([
  {id:'sakura:identity:500ml',fields:['identity','volume'],query:'Dung tích Sakura?'},
  {id:'sakura:policy:material-check',fields:['material-check'],query:'Vật liệu bề mặt Sakura'},
  {id:'sakura:policy:call-only-cta',fields:['cta-policy'],query:'CTA gọi số điện thoại trong bio'},
  {id:'sakura:policy:evergreen',fields:['promotion-policy'],query:'Chính sách evergreen'},
  {id:'sakura:editorial:footage-video-policy',fields:['video-policy','voice-preference'],query:'Chính sách video footage và giọng?'},
]);
export const evergreenRequiredSourceIds=Object.freeze(requirements.map(r=>r.id));
const iso=v=>typeof v==='string'&&/T.*(?:Z|[+-]\d\d:\d\d)$/.test(v)&&Number.isFinite(Date.parse(v));
const stable=v=>Array.isArray(v)?v.map(stable):v&&typeof v==='object'?Object.fromEntries(Object.keys(v).sort().map(k=>[k,stable(v[k])])):v;
const digest=v=>hash(stable(v));
const fold=v=>v.normalize('NFD').replace(/\p{M}/gu,'').replaceAll('đ','d').replaceAll('Đ','D').toLowerCase();
function copyStrings(value,depth=0){
  if(depth>8)throw Error('Public copy nesting exceeds8');
  if(typeof value==='string'){if(value.length>12000)throw Error('Public copy field exceeds12000characters');return [value];}
  if(Array.isArray(value))return value.flatMap(v=>copyStrings(v,depth+1));
  if(value&&Object.getPrototypeOf(value)===Object.prototype)return Object.values(value).flatMap(v=>copyStrings(v,depth+1));
  throw Error('Public copy must contain only JSON objects, arrays and strings');
}
function copyBinding(publicCopy,account,productId,promotionKey){
  const strings=copyStrings(publicCopy);
  if(!strings.some(s=>s.trim())||strings.join('').length>50000)throw Error('Nonempty bounded publicCopy required');
  const publicCopyHash=digest(publicCopy),script=typeof publicCopy==='object'&&!Array.isArray(publicCopy)?publicCopy.script:undefined;
  if(script!==undefined&&typeof script!=='string')throw Error('publicCopy.script must be the exact spoken string');
  const scriptHash=script===undefined?null:hash(script);
  return {strings,publicCopyHash,scriptHash,contentHash:digest({account,productId,promotionKey,publicCopyHash,scriptHash})};
}
async function checkedIndex(index,directory){
  const candidate=structuredClone(index??await loadIndex(directory)),checked=buildIndex(candidate.sources);
  if(candidate.version!==checked.version||candidate.retrieval!==checked.retrieval||candidate.corpusHash!==checked.corpusHash)throw Error('Current knowledge index checksum/version mismatch');
  return checked;
}
function requestedIds(ids){
  if(!Array.isArray(ids)||ids.length!==requirements.length||new Set(ids).size!==ids.length||evergreenRequiredSourceIds.some(id=>!ids.includes(id)))throw Error('All five exact evergreen source IDs are required; coverage cannot be weakened');
  return [...evergreenRequiredSourceIds];
}
const withoutRecordHash=record=>Object.fromEntries(Object.entries(record).filter(([key])=>key!=='recordHash'));

/** Read-only evidence coverage. Does not generate text or approve copy/media/audio. */
export async function createProductionGrounding({publicCopy,account,productId,promotionKey='evergreen-no-discount',requiredSourceIds=evergreenRequiredSourceIds,index,directory,asOf=new Date().toISOString(),reviewedAt=asOf,maxAgeHours=168}={}){
  if(!iso(asOf)||!iso(reviewedAt)||Date.parse(reviewedAt)>Date.parse(asOf))throw Error('Valid nonfuture evidence-check timestamps required');
  if(!Number.isFinite(maxAgeHours)||maxAgeHours<=0||maxAgeHours>168)throw Error('Source freshness must be greater than0and at most168hours');
  if(typeof account!=='string'||typeof productId!=='string')throw Error('Explicit account/productId required');
  const ids=requestedIds(requiredSourceIds),bound=copyBinding(publicCopy,account,productId,promotionKey),current=await checkedIndex(index,directory),blockers=[];
  if(account!=='saigomlia'||productId!=='sakura-cleaner-500ml')blockers.push('account_or_product_outside_current_evergreen_scope');
  if(promotionKey!=='evergreen-no-discount')blockers.push('only_evergreen_no_discount_is_supported');
  if(bound.strings.some(s=>containsDiscount(s)||/\b(uu dai|offer|discount|promotion|coupon|voucher)\b|first\s*50/.test(fold(s))))blockers.push('discount_or_offer_copy_has_no_current_eligibility');
  const sourceRecords=[],checks=[];
  // Each exact ID gets its own current, product/promotion/time-filtered retrieval.
  // Filtering precedes scoring, so a related section cannot substitute for it.
  const pipeline=createKnowledgePipeline(current,{retriever:request=>retrieve({...current,sources:current.sources.filter(s=>s.sourceId===request.requiredSourceId)},request)});
  for(const requirement of requirements){
    const source=current.sources.find(s=>s.sourceId===requirement.id);
    const request={query:requirement.query,requiredSourceId:requirement.id,productId,promotionKey,asOf,topK:1,maxAgeHours};
    const result=await pipeline.invoke(request);
    const covered=result.status==='retrieved'&&result.sources.length===1&&result.sources[0].id===requirement.id&&requirement.fields.every(f=>source?.claimFields.includes(f))&&/^[a-f0-9]{64}$/.test(source?.sourceHash??'');
    checks.push({requiredSourceId:requirement.id,query:requirement.query,status:covered?'retrieved':'abstained',reason:covered?null:result.reason??'Required source/claim-field/hash coverage missing',promptHash:covered?hash(result.prompt):null});
    if(!covered){blockers.push('required_source_unavailable:'+requirement.id);continue;}
    sourceRecords.push({sourceId:source.sourceId,sourceHash:source.sourceHash,sourceRecordHash:digest(source),sourceUri:source.sourceUri,snippet:source.text,verifiedAt:source.verifiedAt,validFrom:source.validFrom,validTo:source.validTo,timestampBasis:source.timestampBasis??'declared source verification',claimFields:[...source.claimFields]});
  }
  const {strings,...binding}=bound;
  const record={version:1,mode,scope,status:blockers.length?'abstained':'grounded',evidenceCoveragePassed:blockers.length===0,ready:false,humanReviewed:false,generativeLLMUsed:false,fineTunedModelUsed:false,
    account,productId,promotionKey,asOf,reviewedAt,reviewerType:'automated-local-evidence-check',maxAgeHours,requiredSourceIds:ids,corpusHash:current.corpusHash,...binding,sourceRecords,checks,blockers};
  // Stable cache binding excludes review/query timestamps and latency. Evidence
  // dates remain covered through sourceRecordHash; recordHash seals the audit.
  record.bindingHash=digest({version:record.version,mode,scope,account,productId,promotionKey,maxAgeHours,requiredSourceIds:ids,corpusHash:current.corpusHash,...binding,sourceRecords:sourceRecords.map(s=>({sourceId:s.sourceId,sourceHash:s.sourceHash,sourceRecordHash:s.sourceRecordHash}))});
  record.recordHash=digest(record);return record;
}

/** Recheck against the CURRENT index and exact copy. Returns no media readiness. */
export async function checkProductionGrounding(record,{publicCopy,account,productId,index,directory,asOf=new Date().toISOString()}={}){
  const blockers=[];
  if(!iso(asOf))throw Error('Valid current asOf required');
  if(!record||record.version!==1||record.mode!==mode||record.scope!==scope||record.ready!==false||record.humanReviewed!==false||record.generativeLLMUsed!==false||record.fineTunedModelUsed!==false||digest(withoutRecordHash(record))!==record.recordHash)blockers.push('grounding_record_integrity_or_scope_mismatch');
  if(blockers.length)return {valid:false,scope,ready:false,blockers};
  if(record.status!=='grounded'||record.evidenceCoveragePassed!==true)blockers.push('original_evidence_coverage_did_not_pass');
  if(!iso(record.asOf)||!iso(record.reviewedAt)||Date.parse(record.reviewedAt)>Date.parse(record.asOf)||Date.parse(record.asOf)>Date.parse(asOf))blockers.push('invalid_or_future_record_timestamps');
  const current=await createProductionGrounding({publicCopy,account,productId,promotionKey:record.promotionKey,requiredSourceIds:record.requiredSourceIds,index,directory,asOf,maxAgeHours:record.maxAgeHours});
  if(!current.evidenceCoveragePassed)blockers.push(...current.blockers);
  if(current.publicCopyHash!==record.publicCopyHash||current.scriptHash!==record.scriptHash||current.contentHash!==record.contentHash)blockers.push('exact_public_copy_script_or_identity_changed');
  if(current.corpusHash!==record.corpusHash)blockers.push('current_corpus_changed');
  if(digest(current.sourceRecords)!==digest(record.sourceRecords))blockers.push('current_source_records_differ');
  if(current.bindingHash!==record.bindingHash)blockers.push('current_source_or_binding_changed');
  return {valid:blockers.length===0,scope,ready:false,blockers:[...new Set(blockers)],currentRecord:current};
}
