import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,mkdir,readFile,writeFile,rm} from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import {inspectHerkEdit,prepareHerkEdit,rawHerkTranscript,herkCommit} from '../src/herk-edit.mjs';
import {hashFile} from '../src/store.mjs';
import {hash} from '../src/knowledge/index.mjs';

async function fixture(){
  const dir=await mkdtemp(path.join(os.tmpdir(),'herk-export-test-')),upstreamRoot=path.join(dir,'upstream');await mkdir(path.join(upstreamRoot,'.git'),{recursive:true});await writeFile(path.join(upstreamRoot,'.git/HEAD'),herkCommit+'\n');
  const file=async(name,text)=>{const p=path.join(dir,name);await mkdir(path.dirname(p),{recursive:true});await writeFile(p,text);return {path:p,sha256:await hashFile(p)};};
  const voice=await file('voice.wav','SYNTHETIC BYTE HASH FIXTURE NOT REAL AUDIO'),preview=await file('preview.mp4','SYNTHETIC MEDIA HASH FIXTURE'),product=await file('product.jpg','SYNTHETIC IMAGE HASH FIXTURE');
  const script='Hỏi giá xong. Xem vật liệu trước.',scriptSha256=hash(script),scenes=[];
  for(let i=0;i<4;i++){const asset=await file('source-'+i+'.mp4','SYNTHETIC STOCK FIXTURE '+i);scenes.push({id:'V00'+(i+1),source:asset.path,sha256:asset.sha256,start:.5,duration:3,role:'stock_context_not_product_demo'});}
  const producer=await file('producer-source.mjs','// synthetic recipe fixture; never execute\ntransitionGraph(segments.length); //fps=30');
  await file('filter.txt',[1,2,3,4].map(i=>'xfade=transition=fade:duration=0.25:offset='+i*2.75).join(';'));
  const asr=await file('timing/asr.json',JSON.stringify({audioSha256:voice.sha256,scriptSha256,offline:true,output:{text:' Họ giá xong.',chunks:[{text:' Họ',timestamp:[.1,.3]},{text:' giá',timestamp:[.3,.5]},{text:' xong.',timestamp:[.5,.9]}]}}));
  const timing=await file('timing/receipt.json',JSON.stringify({queueId:'sakura-scale-10020',audioSha256:voice.sha256,scriptSha256,durationSeconds:19,asrFile:asr.path,asrSha256:asr.sha256,coverage:.5}));
  const receipt={schemaVersion:1,intentId:'sakura-scale-10020',seconds:21,path:preview.path,sha256:preview.sha256,scenes,voice:{...voice,script,scriptSha256,qa:{durationSeconds:19},listeningVerified:true},productImage:product,producerSource:{snapshot:producer.path,sha256:producer.sha256},captions:{receiptFile:timing.path,receiptSha256:timing.sha256},publicationReady:true,grounding:{bindingHash:'earlier-record-is-not-inherited'}};
  const receiptFile=(await file('receipt.json',JSON.stringify(receipt))).path,reviewFile=(await file('review.json',JSON.stringify({audioSha256:voice.sha256,scriptSha256,decision:'needs_revision',reason:'Synthetic technical rejection fixture',verified:false}))).path;
  return {dir,receipt,receiptFile,reviewFile,upstreamRoot,outputRoot:path.join(dir,'private-export'),async clean(){await rm(dir,{recursive:true,force:true});}};
}

test('raw ASR exporter preserves recognized text and observed timestamps, never script corrections or invented times',()=>{
  const asr={output:{text:' Họ giá',chunks:[{text:' Họ',timestamp:[.1,.3]},{text:' giá',timestamp:[.3,.5]},{text:'unknown',timestamp:[null,null]}]}};
  const t=rawHerkTranscript(asr,2);assert.equal(t.words[0].text,' Họ');assert.equal(t.words[0].sourceStart,.1);assert.deepEqual(t.invalidChunks,[2]);assert.equal(t.recognizedTextReplaced,false);assert.equal(t.wordAccuracyVerified,false);assert.equal(t.reviewRequired,true);
});
test('inspection verifies exact receipt/audio/ASR hashes and rejects stale or changed source evidence',async()=>{
  const f=await fixture();try{
    const inspected=await inspectHerkEdit(f);assert.equal(inspected.status,'editing_draft_unready');assert.equal(inspected.publicationReady,false);assert.equal(inspected.listeningApprovalInherited,false);assert.equal(inspected.transcript.words[0].text,' Họ');assert.ok(inspected.timeline[1].start<inspected.timeline[0].end);
    await assert.rejects(inspectHerkEdit({...f,expectedReceiptSha256:'a'.repeat(64)}),/receipt checksum/);
    await writeFile(f.receipt.voice.path,'changed waveform bytes');await assert.rejects(inspectHerkEdit(f),/Source checksum changed: voice/);
  }finally{await f.clean();}
});
test('wrong exact-audio timing or listening feedback cannot attach to another candidate',async()=>{
  const f=await fixture();try{
    const timingFile=f.receipt.captions.receiptFile,timing=JSON.parse(await readFile(timingFile));timing.audioSha256='b'.repeat(64);await writeFile(timingFile,JSON.stringify(timing));f.receipt.captions.receiptSha256=await hashFile(timingFile);await writeFile(f.receiptFile,JSON.stringify(f.receipt));await assert.rejects(inspectHerkEdit(f),/Stale\/wrong audio/);
  }finally{await f.clean();}
  const g=await fixture();try{await writeFile(g.reviewFile,JSON.stringify({audioSha256:'a'.repeat(64),scriptSha256:g.receipt.voice.scriptSha256}));await assert.rejects(inspectHerkEdit(g),/different exact audio/);}finally{await g.clean();}
});
test('preparation copies exact bytes and no-cut draft idempotently without inheriting readiness or fabricating anchors/events',async()=>{
  const f=await fixture();try{
    const result=await prepareHerkEdit(f),m=result.manifest;assert.equal(m.status,'editing_draft_unready');assert.equal(m.publicationReady,false);assert.equal(m.listeningApprovalInherited,false);assert.equal(m.groundingApprovalInherited,false);assert.equal(m.sourceReview.decision,'needs_revision');assert.deepEqual(m.audioTransformsApplied,[]);
    assert.equal(await hashFile(path.join(result.directory,'assets/voice.wav')),f.receipt.voice.sha256);
    const plan=JSON.parse(await readFile(path.join(result.directory,'assets/plan.json'))),edl=JSON.parse(await readFile(path.join(result.directory,'assets/edit-decisions.json'))),transcript=JSON.parse(await readFile(path.join(result.directory,'assets/transcript.json')));
    assert.ok(plan.scenes.every(s=>s.anchor===null&&s.anchorTime===null));assert.deepEqual(plan.events,[]);assert.deepEqual(plan.captions,[]);assert.deepEqual(edl.cuts,[]);assert.equal(edl.keeps[0].end,21);assert.equal(transcript.words[0].text,' Họ');assert.equal(m.footageValidation.status,'not_run');assert.equal(m.planValidation.status,'not_run');
    assert.equal((await prepareHerkEdit(f)).reused,true);await assert.rejects(prepareHerkEdit({...f,runFootageValidator:true}),/Reviewed pinned footage validator/);await writeFile(path.join(result.directory,'assets/voice.wav'),'corrupted exported audio');await assert.rejects(prepareHerkEdit(f),/Existing editing asset changed/);await rm(path.join(result.directory,'assets/voice.wav'));await assert.rejects(prepareHerkEdit(f),/Existing editing asset missing/);
  }finally{await f.clean();}
});
test('preparation refuses a different checkout pin or modified footage rather than creating a ready workspace',async()=>{
  const f=await fixture();try{await writeFile(path.join(f.upstreamRoot,'.git/HEAD'),'0'.repeat(40));await assert.rejects(prepareHerkEdit(f),/Pinned upstream checkout/);await writeFile(path.join(f.upstreamRoot,'.git/HEAD'),herkCommit);await writeFile(f.receipt.scenes[0].source,'changed stock');await assert.rejects(prepareHerkEdit(f),/Source checksum changed: footage/);}finally{await f.clean();}
});
