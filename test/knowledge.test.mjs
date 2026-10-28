import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,mkdir,readFile,writeFile,rm} from 'node:fs/promises';
import {spawnSync} from 'node:child_process';
import os from 'node:os';
import path from 'node:path';
import {buildIndex,persistIndex,retrieve,createKnowledgePipeline,evaluateRetrieval} from '../src/knowledge/index.mjs';
import {prepareContentDataset} from '../src/knowledge/content-tuning.mjs';
import {assertReviewedEditorial} from '../src/knowledge/campaign-sources.mjs';

const when='2026-10-28T03:00:00Z';
const source=(changes={})=>({sourceId:'sku:offer:new',productId:'sku',promotionKey:'new',section:'offer',text:'Ưu đãi mua 1 tặng 1 cho 50 đơn đầu tiên từ TikTok.',sourceUri:'test:fixture',sourceHash:'fixture-hash',verifiedAt:'2026-10-28T01:00:00Z',validFrom:'2026-10-28T00:00:00Z',validTo:null,verified:true,claimFields:['offer','unit'],...changes});
const ask=(query,changes={})=>({query,productId:'sku',promotionKey:'new',asOf:when,...changes});
test('stable idempotent indexing, conflicting IDs and corrupted metadata fail',async()=>{
  const dir=await mkdtemp(path.join(os.tmpdir(),'knowledge-'));
  try {
    const first=await persistIndex([source(),source()],dir),bytes=await readFile(first.filename,'utf8');
    assert.equal(first.index.sources.length,1); assert.equal(first.changed,true);
    assert.equal((await persistIndex([source()],dir)).changed,false);
    assert.equal(await readFile(first.filename,'utf8'),bytes);
    assert.throws(()=>buildIndex([source(),source({text:'conflict'})]),/Conflicting/);
    assert.throws(()=>buildIndex([source({verified:false})]),/verified/);
    assert.throws(()=>buildIndex([source({verifiedAt:'yesterday'})]),/Invalid/);
  }finally{await rm(dir,{recursive:true,force:true});}
});
test('current promotion, product and temporal filters precede retrieval',()=>{
  const index=buildIndex([source(),source({sourceId:'sku:offer:old',promotionKey:'old',text:'Mua 3 tặng 1 TikTok.',validFrom:'2026-10-27T00:00:00Z',validTo:'2026-10-28T00:00:00Z'}),source({sourceId:'other:offer:new',productId:'other'})]);
  assert.deepEqual(retrieve(index,ask('Ưu đãi TikTok')).hits.map(h=>h.source.sourceId),['sku:offer:new']);
  assert.equal(retrieve(index,ask('Ưu đãi TikTok',{promotionKey:'old'})).status,'abstained');
  assert.equal(retrieve(index,ask('Ưu đãi TikTok',{asOf:'2026-11-20T03:00:00Z'})).status,'abstained');
  assert.equal(retrieve(index,ask('Ưu đãi TikTok',{asOf:'2026-10-27T03:00:00Z'})).status,'abstained');
  assert.equal(retrieve(index,ask('Giá Sakura bao nhiêu?')).status,'abstained');
  assert.equal(retrieve(index,ask('Còn lại bao nhiêu đơn TikTok?')).status,'abstained');
  assert.equal(retrieve(index,ask('How many orders remain?')).status,'abstained');
  assert.equal(retrieve(index,ask('Sakura ingredients?')).status,'abstained');
  assert.equal(retrieve(index,ask('Which angle is winning?')).status,'abstained');
  assert.equal(retrieve(index,ask('Tàu vũ trụ sao Hỏa')).status,'abstained');
});
test('actual LangChain invocation returns cited prompt and explicit no-generation mode',async()=>{
  const chain=createKnowledgePipeline(buildIndex([source()]));
  const result=await chain.invoke(ask('Ưu đãi TikTok'));
  assert.equal(result.mode,'retrieval-and-prompt-only');assert.match(result.prompt,/\[sku:offer:new\]/);assert.match(result.prompt,/verifiedAt=/);
  assert.equal((await chain.invoke(ask('Giá Sakura'))).prompt,null);
});
test('private LangChain pipeline refuses cloud tracing before an invocation',async()=>{
  const old=process.env.LANGSMITH_TRACING,chain=createKnowledgePipeline(buildIndex([source()]));
  try {
    process.env.LANGSMITH_TRACING='true';
    assert.throws(()=>createKnowledgePipeline(buildIndex([source()])),/refuses cloud tracing/);
    await assert.rejects(chain.invoke(ask('Ưu đãi TikTok')),/refuses cloud tracing/);
  }finally{if(old===undefined)delete process.env.LANGSMITH_TRACING;else process.env.LANGSMITH_TRACING=old;}
});
test('compound promotion/video request retains both sources or abstains when topK cannot cover it',async()=>{
  const index=buildIndex([source(),source({sourceId:'sku:video',text:'Chính sách video và giọng nữ miền Nam đã duyệt.',claimFields:['video-policy','voice-preference']})]);
  const request=ask('Ưu đãi và chính sách video giọng nữ miền Nam?');
  const result=await createKnowledgePipeline(index).invoke(request);
  assert.equal(result.status,'retrieved');assert.match(result.prompt,/\[sku:offer:new\]/);assert.match(result.prompt,/\[sku:video\]/);
  assert.equal(retrieve(index,{...request,topK:1}).status,'abstained');
});
test('changed editorial facts cannot renew stale hardcoded evidence',async()=>{
  const editorial=await readFile(new URL('../docs/FOOTAGE_EDITING.md',import.meta.url),'utf8');
  assert.ok(assertReviewedEditorial(editorial));
  assert.throws(()=>assertReviewedEditorial(editorial.replace('Thùy Dung','Changed voice')),/facts changed/);
});
test('evaluation reports ranking and abstention including negatives',async()=>{
  const result=await evaluateRetrieval(buildIndex([source()]),[
    {...ask('Ưu đãi TikTok'),topK:1,expectedSourceIds:['sku:offer:new'],expectAbstention:false},
    {...ask('Giá'),topK:1,expectedSourceIds:[],expectAbstention:true},
  ]);
  assert.equal(result.metrics.recallAtK,1);assert.equal(result.metrics.mrr,1);assert.equal(result.metrics.ndcg,1);assert.equal(result.metrics.abstentionAccuracy,1);
});
test('hybrid fixture verifies RRF, ambiguity abstention and unsupported-fact guard',()=>{
  const index=buildIndex([source(),source({sourceId:'sku:identity',promotionKey:'*',text:'Dung tích chai 500 ml.',claimFields:['volume']})]);
  const dense={modelId:'test-only-vectors',revision:'fixture',queryVector:[1,0],sourceVectors:{'sku:offer:new':[0,1],'sku:identity':[1,0]},minCosine:0.75};
  assert.equal(retrieve(index,ask('capacity',{dense})).hits[0].source.sourceId,'sku:identity');
  assert.equal(retrieve(index,ask('price',{dense})).status,'abstained');
  assert.equal(retrieve(index,ask('irrelevant',{dense:{...dense,sourceVectors:{'sku:offer:new':[1,0],'sku:identity':[1,0]}}})).status,'abstained');
});
function record(i,changes={}) {return {id:`r${i}`,groupId:`g${i}`,sourcePostId:`post${i}`,productId:'sku',promotionKey:'new',sourceIds:['sku:offer:new'],
  instruction:`Viết đoạn giới thiệu ưu đãi đã xác minh dành cho tình huống thứ ${i}, không bịa kết quả.`,
  response:`Tình huống ${i}: ${Array.from({length:20},(_,n)=>`từ${i}_${n}`).join(' ')}. Hãy hỏi shop trước khi đặt mua từ TikTok.`,
  consentForTraining:true,labelKind:'editorial_approved',review:{approved:true,reviewer:'fixture-editor',reviewedAt:when},...changes};}
test('tuning refuses invented labels, contacts and unverified sources; zero real labels is not ready',()=>{
  const index=buildIndex([source()]);
  assert.equal(prepareContentDataset([],index,{asOf:when}).manifest.ready,false);
  assert.throws(()=>prepareContentDataset([record(1,{labelKind:'winner'})],index,{asOf:when}),/approval required/);
  assert.throws(()=>prepareContentDataset([record(1,{consentForTraining:false})],index,{asOf:when}),/consent/);
  assert.throws(()=>prepareContentDataset([record(1,{sourceIds:['unknown']})],index,{asOf:when}),/source/);
  assert.throws(()=>prepareContentDataset([record(1,{response:'Call person@example.com to buy the product and ask for price information directly from the shop before purchasing any item.'})],index,{asOf:when}),/contact/);
});
test('content split is deterministic, deduplicated and groups/source posts never leak',()=>{
  const index=buildIndex([source()]), records=Array.from({length:80},(_,i)=>record(i));
  records.push(record(80,{response:records[0].response}));
  records[1].sourcePostId=records[0].sourcePostId;records[2].groupId=records[0].groupId;
  const a=prepareContentDataset(records,index,{asOf:when}),b=prepareContentDataset(records,index,{asOf:when});
  assert.equal(a.manifest.ready,true);assert.equal(a.manifest.datasetHash,b.manifest.datasetHash);assert.equal(a.manifest.counts.duplicates,1);
  const sets=['train','validation','heldout'];
  for(let i=0;i<sets.length;i++)for(let j=0;j<i;j++)for(const key of ['groupId','sourcePostId'])assert.equal(a[sets[i]].some(r=>a[sets[j]].some(s=>s[key]===r[key])),false);
  assert.equal(a.train.some(r=>r.grams),false);
});
test('removed duplicate bridges keep all surviving related groups in the same split',()=>{
  const records=Array.from({length:80},(_,i)=>record(i));
  records.push(record(80,{groupId:records[1].groupId,sourcePostId:records[2].sourcePostId,response:records[0].response}));
  const bundle=prepareContentDataset(records,buildIndex([source()]),{asOf:when});
  assert.equal(bundle.manifest.counts.duplicates,1);assert.equal(bundle.manifest.counts.groups,78);
  const splitOf=id=>['train','validation','heldout'].find(split=>bundle[split].some(r=>r.id===id));
  assert.equal(splitOf('r0'),splitOf('r1'));assert.equal(splitOf('r0'),splitOf('r2'));
});
test('Python non-training preflight accepts Node bundle hash and refuses tampering',{skip:!process.env.CONTENT_TUNING_TEST_PYTHON},async()=>{
  const dir=await mkdtemp(path.join(os.tmpdir(),'content-preflight-test-only-'));
  try {
    const bundle=prepareContentDataset(Array.from({length:80},(_,i)=>record(i)),buildIndex([source()]),{asOf:when});
    for(const split of ['train','validation','heldout'])await writeFile(path.join(dir,`${split}.jsonl`),bundle[split].map(r=>JSON.stringify(r)).join('\n'));
    await writeFile(path.join(dir,'manifest.json'),JSON.stringify(bundle.manifest));
    const run=()=>spawnSync(process.env.CONTENT_TUNING_TEST_PYTHON,['-X','utf8','scripts/train-content.py','check','--dataset',dir],{encoding:'utf8'});
    const checked=run();assert.equal(checked.status,0,checked.stderr);const report=JSON.parse(checked.stdout);
    assert.equal(report.trained,false);assert.equal(report.readyDataset,true);assert.equal(report.datasetHash,bundle.manifest.datasetHash);
    const modelDir=path.join(dir,'hash-test-only-not-a-model');await mkdir(modelDir);
    await writeFile(path.join(modelDir,'model.safetensors'),'fixture bytes for hashing only');await writeFile(path.join(modelDir,'config.json'),'{}');
    await writeFile(path.join(modelDir,'tokenizer.json'),'{"test":1}');
    const snapshot=()=>spawnSync(process.env.CONTENT_TUNING_TEST_PYTHON,['-X','utf8','-c',"import runpy,sys;from pathlib import Path;print(runpy.run_path('scripts/train-content.py')['snapshot_hash'](Path(sys.argv[1])))",modelDir],{encoding:'utf8'});
    const before=snapshot();assert.equal(before.status,0,before.stderr);
    await writeFile(path.join(modelDir,'tokenizer.json'),'{"test":2}');
    const after=snapshot();assert.equal(after.status,0,after.stderr);assert.notEqual(before.stdout,after.stdout);
    await writeFile(path.join(dir,'train.jsonl'),'{}\n');
    const corrupted=run();assert.notEqual(corrupted.status,0);assert.match(corrupted.stderr,/checksum/);
  }finally{await rm(dir,{recursive:true,force:true});}
});
